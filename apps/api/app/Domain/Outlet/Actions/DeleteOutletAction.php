<?php

namespace App\Domain\Outlet\Actions;

use App\Models\Business;
use App\Models\Outlet;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DeleteOutletAction
{
    /**
     * Keep at least one outlet per business. Lock the business row so two
     * concurrent deletes cannot remove the last two outlets together.
     */
    public function execute(Outlet $outlet): void
    {
        DB::transaction(function () use ($outlet): void {
            $business = Business::query()->lockForUpdate()->findOrFail($outlet->business_id);

            if ($business->outlets()->count() <= 1) {
                throw ValidationException::withMessages([
                    'outlet' => 'Business harus memiliki minimal satu outlet.',
                ]);
            }

            // Guard eksplisit: FK restrictOnDelete sudah melindungi data historis,
            // tapi diterjemahkan ke 422 agar client tidak menerima 500.
            $hasHistory = collect([
                'orders',
                'payments',
                'cash_sessions',
                'cash_movements',
            ])->contains(fn (string $table): bool => DB::table($table)
                ->where('outlet_id', $outlet->id)
                ->exists());

            if ($hasHistory) {
                throw ValidationException::withMessages([
                    'outlet' => 'Outlet memiliki data historis (order, pembayaran, atau kas) dan tidak dapat dihapus.',
                ]);
            }

            // Override ketersediaan dan stok menu bukan histori; hapus bersama
            // outletnya agar FK restrictOnDelete tidak berubah menjadi error 500.
            DB::table('product_outlet_availabilities')->where('outlet_id', $outlet->id)->delete();
            DB::table('product_stocks')->where('outlet_id', $outlet->id)->delete();

            $outlet->delete();
        });
    }
}
