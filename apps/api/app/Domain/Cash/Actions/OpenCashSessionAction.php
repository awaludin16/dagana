<?php

namespace App\Domain\Cash\Actions;

use App\Models\BusinessMembership;
use App\Models\CashSession;
use App\Models\Outlet;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Membuka Cash Session untuk operator pada satu outlet (D-06/D-07).
 * Satu operator hanya boleh memiliki satu session aktif per outlet; batas
 * ini divalidasi di sini dan diproteksi partial unique index di database.
 */
class OpenCashSessionAction
{
    public function execute(BusinessMembership $membership, Outlet $outlet, int $openingCash): CashSession
    {
        if ($outlet->business_id !== $membership->business_id) {
            throw new AuthorizationException('Outlet tidak ditemukan.');
        }

        if (! $membership->canAccessOutlet($outlet->id)) {
            throw new AuthorizationException('Outlet tidak dalam cakupan akses Anda.');
        }

        return DB::transaction(function () use ($membership, $outlet, $openingCash): CashSession {
            // Row lock mencegah dua open serentak meloloskan session ganda
            // pada operator yang sama (D-07), di luar proteksi unique index.
            $active = CashSession::query()
                ->where('business_id', $membership->business_id)
                ->where('outlet_id', $outlet->id)
                ->where('operator_membership_id', $membership->id)
                ->where('status', CashSession::STATUS_OPEN)
                ->lockForUpdate()
                ->exists();

            if ($active) {
                throw ValidationException::withMessages([
                    'outlet_id' => 'Anda masih memiliki session aktif pada outlet ini. Tutup session sebelum membuka yang baru.',
                ]);
            }

            return CashSession::create([
                'business_id' => $membership->business_id,
                'outlet_id' => $outlet->id,
                'operator_membership_id' => $membership->id,
                'status' => CashSession::STATUS_OPEN,
                'opening_cash' => $openingCash,
                'opened_at' => now(),
            ]);
        });
    }
}
