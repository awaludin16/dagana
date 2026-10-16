<?php

namespace App\Domain\Organization\Services;

use App\Domain\Authorization\Enums\RolePreset;
use App\Domain\Organization\Exceptions\LastOwnerException;
use App\Domain\Organization\Models\Business;
use App\Domain\Organization\Models\Membership;

/**
 * Protects the invariant that every business keeps at least one active owner.
 *
 * Role changes and status changes both funnel through this guard so the rule
 * is defined in one place (AGENTS §15 "avoid duplicating business logic").
 */
class BusinessOwnershipGuard
{
    /**
     * Assert that applying a new role/status to a membership still leaves the
     * business with an active owner.
     */
    public function assertOwnerCoverageRetained(
        Business $business,
        Membership $target,
        RolePreset $resultingRole,
        string $resultingStatus,
    ): void {
        $remainsActiveOwner = $resultingRole === RolePreset::Owner
            && $resultingStatus === Membership::STATUS_ACTIVE;

        if ($remainsActiveOwner) {
            return;
        }

        // The target was not an active owner, so it cannot reduce coverage.
        if (! $target->isOwner() || ! $target->isActive()) {
            return;
        }

        $otherActiveOwners = $business->owners()
            ->where('id', '!=', $target->getKey())
            ->count();

        if ($otherActiveOwners === 0) {
            throw LastOwnerException::cannotRemoveLastOwner();
        }
    }
}
