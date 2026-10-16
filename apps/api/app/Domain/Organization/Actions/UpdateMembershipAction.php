<?php

namespace App\Domain\Organization\Actions;

use App\Domain\Authorization\Enums\RolePreset;
use App\Domain\Organization\Models\Business;
use App\Domain\Organization\Models\Membership;
use App\Domain\Organization\Services\BusinessOwnershipGuard;
use App\Domain\Organization\Services\MembershipPermissionManager;
use Illuminate\Support\Facades\DB;

/**
 * Updates a membership's role preset, explicit outlet access, and/or explicit
 * permission overrides (D-04).
 *
 * The acting membership is passed in so role assignment and override changes
 * cannot exceed the actor's own effective permissions.
 */
class UpdateMembershipAction
{
    public function __construct(
        private readonly BusinessOwnershipGuard $ownershipGuard,
        private readonly MembershipPermissionManager $permissionManager,
    ) {}

    /**
     * @param  array<int, int>|null  $outletIds  Null means "leave outlet access unchanged".
     * @param  array<int, string>|null  $permissionGrants  Null means "leave grants unchanged".
     * @param  array<int, string>|null  $permissionDenials  Null means "leave denials unchanged".
     */
    public function execute(
        Membership $actor,
        Membership $membership,
        ?RolePreset $role,
        ?array $outletIds,
        ?array $permissionGrants = null,
        ?array $permissionDenials = null,
    ): Membership {
        if ($role !== null) {
            $this->permissionManager->assertRoleAssignableBy($actor, $role);
        }

        if ($permissionGrants !== null || $permissionDenials !== null) {
            $this->permissionManager->assertOverridesWithinActor(
                $actor,
                $permissionGrants ?? [],
                $permissionDenials ?? [],
            );
        }

        return DB::transaction(function () use ($membership, $role, $outletIds, $permissionGrants, $permissionDenials): Membership {
            /** @var Business $business */
            $business = Business::query()
                ->whereKey($membership->business_id)
                ->lockForUpdate()
                ->firstOrFail();

            $resultingRole = $role ?? $membership->role;

            $this->ownershipGuard->assertOwnerCoverageRetained(
                $business,
                $membership,
                $resultingRole,
                Membership::STATUS_ACTIVE,
            );

            if ($role !== null) {
                $membership->role = $resultingRole;
                $membership->save();
            }

            if ($resultingRole->hasBusinessWideOutletAccess()) {
                // Owners always have business-wide access; drop redundant grants.
                $membership->outlets()->sync([]);
            } elseif ($outletIds !== null) {
                $membership->outlets()->sync($outletIds);
            }

            if ($resultingRole->hasBusinessWideOutletAccess()) {
                // Owner holds the full catalog; clear any stale overrides.
                $this->permissionManager->sync($membership, [], []);
            } elseif ($permissionGrants !== null || $permissionDenials !== null) {
                $this->permissionManager->sync(
                    $membership,
                    $permissionGrants ?? $membership->permissionGrants(),
                    $permissionDenials ?? $membership->permissionDenials(),
                );
            }

            return $membership->load(['user', 'outlets', 'permissionOverrides']);
        });
    }
}
