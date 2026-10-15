<?php

namespace App\Domain\Organization\Services;

use App\Domain\Authorization\Enums\PermissionEffect;
use App\Domain\Authorization\Enums\RolePreset;
use App\Domain\Organization\Models\Membership;
use Illuminate\Auth\Access\AuthorizationException;

/**
 * Applies membership permission overrides and enforces anti-escalation (D-04).
 *
 * A membership keeps the role preset as its default capability; overrides add
 * (`allow`) or remove (`deny`) individual permissions. An actor that manages a
 * membership must never be able to grant a role or permission it does not
 * itself hold — otherwise membership management becomes a privilege-escalation
 * path. Owner memberships always hold the full catalog, so their overrides are
 * ignored (ADR-0006).
 */
class MembershipPermissionManager
{
    /**
     * Ensure the actor may assign the given role preset.
     */
    public function assertRoleAssignableBy(Membership $actor, RolePreset $role): void
    {
        $missing = array_diff($role->permissions(), $actor->permissions());

        if ($missing !== []) {
            throw new AuthorizationException(
                'You cannot assign a role that grants permissions you do not hold: '.implode(', ', $missing).'.'
            );
        }
    }

    /**
     * Ensure every override targets a permission the actor itself holds.
     *
     * @param  array<int, string>  $grants
     * @param  array<int, string>  $denials
     */
    public function assertOverridesWithinActor(Membership $actor, array $grants, array $denials): void
    {
        $beyond = array_diff(array_merge($grants, $denials), $actor->permissions());

        if ($beyond !== []) {
            throw new AuthorizationException(
                'You cannot manage permissions you do not hold: '.implode(', ', $beyond).'.'
            );
        }
    }

    /**
     * Replace a membership's explicit permission overrides.
     *
     * @param  array<int, string>  $grants
     * @param  array<int, string>  $denials
     */
    public function sync(Membership $membership, array $grants, array $denials): void
    {
        $membership->permissionOverrides()->delete();

        // Owner always holds the full catalog; explicit overrides are ignored.
        if ($membership->isOwner()) {
            return;
        }

        $rows = [];

        foreach (array_unique($grants) as $permission) {
            $rows[] = ['permission' => $permission, 'effect' => PermissionEffect::Allow];
        }

        foreach (array_unique($denials) as $permission) {
            $rows[] = ['permission' => $permission, 'effect' => PermissionEffect::Deny];
        }

        if ($rows !== []) {
            $membership->permissionOverrides()->createMany($rows);
        }
    }
}
