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

            $outlet->delete();
        });
    }
}
