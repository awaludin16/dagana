<?php

namespace App\Domain\Organization\Actions;

use App\Domain\Organization\Models\Business;
use App\Domain\Organization\Models\Membership;
use App\Domain\Organization\Services\BusinessOwnershipGuard;
use Illuminate\Support\Facades\DB;

/**
 * Enables or disables a membership.
 *
 * A disabled membership keeps its grants but is treated as inactive by every
 * authorization check, so the user can no longer act in the business context.
 */
class ChangeMembershipStatusAction
{
    public function __construct(private readonly BusinessOwnershipGuard $ownershipGuard) {}

    public function disable(Membership $membership): Membership
    {
        return DB::transaction(function () use ($membership): Membership {
            /** @var Business $business */
            $business = Business::query()
                ->whereKey($membership->business_id)
                ->lockForUpdate()
                ->firstOrFail();

            $this->ownershipGuard->assertOwnerCoverageRetained(
                $business,
                $membership,
                $membership->role,
                Membership::STATUS_DISABLED,
            );

            $membership->status = Membership::STATUS_DISABLED;
            $membership->save();

            return $membership->load(['user', 'outlets', 'permissionOverrides']);
        });
    }

    public function enable(Membership $membership): Membership
    {
        $membership->status = Membership::STATUS_ACTIVE;
        $membership->save();

        return $membership->load(['user', 'outlets', 'permissionOverrides']);
    }
}
