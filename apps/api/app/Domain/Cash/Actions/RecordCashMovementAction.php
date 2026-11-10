<?php

namespace App\Domain\Cash\Actions;

use App\Models\BusinessMembership;
use App\Models\CashMovement;
use App\Models\CashSession;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Mencatat movement ledger kas pada session aktif (Phase 5).
 * Session yang sudah ditutup tidak menerima movement lagi; koreksi dilakukan
 * sebagai movement baru pada session lain, bukan mengubah history lama.
 */
class RecordCashMovementAction
{
    /**
     * Pemetaan type → permission terkait (D-03 baseline). REFUND dan ADJUSTMENT
     * adalah koreksi kas level manajemen: permission `cash.reconcile`.
     */
    public const TYPE_PERMISSIONS = [
        CashMovement::TYPE_CASH_IN => 'cash.cash_in',
        CashMovement::TYPE_CASH_OUT => 'cash.cash_out',
        CashMovement::TYPE_REFUND => 'cash.reconcile',
        CashMovement::TYPE_ADJUSTMENT => 'cash.reconcile',
    ];

    public function execute(CashSession $session, BusinessMembership $membership, string $type, int $amount, ?string $reason): CashMovement
    {
        if ($session->business_id !== $membership->business_id) {
            throw new AuthorizationException('Session tidak ditemukan.');
        }

        if (! $membership->canAccessOutlet($session->outlet_id)) {
            throw new AuthorizationException('Outlet tidak dalam cakupan akses Anda.');
        }

        $permission = self::TYPE_PERMISSIONS[$type] ?? null;
        if ($permission === null || ! $membership->hasPermission($permission)) {
            throw new AuthorizationException('Anda tidak memiliki izin untuk aksi ini.');
        }

        return DB::transaction(function () use ($session, $membership, $type, $amount, $reason): CashMovement {
            // Row lock menjaga close serentak tidak mulai menghitung expected
            // cash sebelum movement ini commit.
            $locked = CashSession::query()
                ->where('business_id', $session->business_id)
                ->whereKey($session->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($locked->isClosed()) {
                throw ValidationException::withMessages([
                    'status' => 'Session sudah ditutup dan tidak menerima movement baru.',
                ]);
            }

            $signedAmount = match ($type) {
                CashMovement::TYPE_CASH_IN => $amount,
                CashMovement::TYPE_CASH_OUT,
                CashMovement::TYPE_REFUND => -1 * $amount,
                default => $amount, // ADJUSTMENT dipetakan di controller (+/-)
            };

            return $session->movements()->create([
                'business_id' => $session->business_id,
                'outlet_id' => $session->outlet_id,
                'membership_id' => $membership->id,
                'type' => $type,
                'amount' => $signedAmount,
                'reason' => $reason,
            ]);
        });
    }
}
