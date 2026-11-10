<?php

namespace App\Domain\Cash\Actions;

use App\Models\BusinessMembership;
use App\Models\CashSession;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Menutup Cash Session: actual cash diinput operator, expected cash dihitung
 * dari ledger, variance = actual_cash - expected_cash (tidak diarang sifat).
 * Session CLOSED tidak dapat ditutup/diubah ulang; koreksi memakai movement
 * atau alur eksplisit yang diaudit.
 */
class CloseCashSessionAction
{
    public function execute(CashSession $session, BusinessMembership $membership, int $actualCash, ?string $varianceNote): CashSession
    {
        if ($session->business_id !== $membership->business_id) {
            throw new AuthorizationException('Session tidak ditemukan.');
        }

        if (! $membership->canAccessOutlet($session->outlet_id)) {
            throw new AuthorizationException('Outlet tidak dalam cakupan akses Anda.');
        }

        return DB::transaction(function () use ($session, $membership, $actualCash, $varianceNote): CashSession {
            // Row lock menyelesaikan balapan close vs checkout sale/movement baru.
            $locked = CashSession::query()
                ->where('business_id', $session->business_id)
                ->whereKey($session->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($locked->isClosed()) {
                throw ValidationException::withMessages([
                    'status' => 'Session sudah ditutup dan tidak dapat ditutup ulang.',
                ]);
            }

            $expectedCash = CashSession::computeExpectedCash($locked->opening_cash, $locked->netMovement());

            $locked->update([
                'status' => CashSession::STATUS_CLOSED,
                'actual_cash' => $actualCash,
                'expected_cash' => $expectedCash,
                'variance' => $actualCash - $expectedCash,
                'variance_note' => $varianceNote,
                'closed_at' => now(),
                'closed_by_membership_id' => $membership->id,
            ]);

            return $locked->fresh();
        });
    }
}
