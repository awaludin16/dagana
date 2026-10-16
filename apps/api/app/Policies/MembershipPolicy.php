<?php

namespace App\Policies;

use App\Domain\Authorization\Enums\Permission;
use App\Domain\Organization\Models\Membership;
use App\Models\User;

/**
 * Authorization for managing an existing membership (employee).
 *
 * The acting user must hold an active membership in the same business that
 * grants the relevant members.* permission. Tenant scoping is also enforced by
 * the nested route binding, so a foreign membership resolves to 404 first.
 *
 * Permission overrides additionally require `permissions.manage_membership`
 * (D-04); anti-escalation is enforced in MembershipPermissionManager.
 */
class MembershipPolicy
{
    public function update(User $user, Membership $membership): bool
    {
        return $this->allows($user, $membership, Permission::MembersUpdate);
    }

    public function disable(User $user, Membership $membership): bool
    {
        return $this->allows($user, $membership, Permission::MembersDisable);
    }

    public function enable(User $user, Membership $membership): bool
    {
        return $this->allows($user, $membership, Permission::MembersUpdate);
    }

    public function managePermissions(User $user, Membership $membership): bool
    {
        return $this->allows($user, $membership, Permission::PermissionsManageMembership);
    }

    private function allows(User $user, Membership $membership, Permission $permission): bool
    {
        $actor = $user->membershipFor($membership->business);

        return $actor !== null
            && $actor->isActive()
            && $actor->hasPermission($permission);
    }
}
