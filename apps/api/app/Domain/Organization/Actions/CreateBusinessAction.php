<?php

namespace App\Domain\Organization\Actions;

use App\Domain\Authorization\Enums\RolePreset;
use App\Domain\Organization\Models\Business;
use App\Domain\Organization\Models\Membership;
use App\Domain\Outlet\Models\Outlet;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Creates a business and grants its creator the Owner membership.
 *
 * Optionally creates the first outlet in the same transaction so the
 * "Register -> Business -> Outlet -> Start Selling" flow stays frictionless.
 */
class CreateBusinessAction
{
    /**
     * @param  array{name: string, address?: string|null}|null  $firstOutlet
     */
    public function execute(
        User $owner,
        string $name,
        ?array $firstOutlet = null,
        string $timezone = 'Asia/Jakarta',
        string $currency = 'IDR',
    ): Business {
        return DB::transaction(function () use ($owner, $name, $firstOutlet, $timezone, $currency): Business {
            $business = Business::create([
                'name' => $name,
                'timezone' => $timezone,
                'currency' => $currency,
                'status' => Business::STATUS_ACTIVE,
            ]);

            Membership::create([
                'business_id' => $business->getKey(),
                'user_id' => $owner->getKey(),
                'role' => RolePreset::Owner,
                'status' => Membership::STATUS_ACTIVE,
            ]);

            if ($firstOutlet !== null) {
                $business->outlets()->create([
                    'name' => $firstOutlet['name'],
                    'address' => $firstOutlet['address'] ?? null,
                    'timezone' => $business->timezone,
                    'status' => Outlet::STATUS_ACTIVE,
                ]);
            }

            return $business->load('outlets');
        });
    }
}
