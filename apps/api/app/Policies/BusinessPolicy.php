<?php

namespace App\Policies;

use App\Domain\Authorization\Enums\Permission;
use App\Domain\Organization\Models\Business;
use App\Domain\Organization\Models\Membership;
use App\Models\User;

class BusinessPolicy
{
    public function view(User $user, Business $business): bool
    {
        return $this->membership($user, $business)?->hasPermission(Permission::BusinessRead) ?? false;
    }

    public function update(User $user, Business $business): bool
    {
        return $this->membership($user, $business)?->hasPermission(Permission::BusinessUpdate) ?? false;
    }

    public function viewOutlets(User $user, Business $business): bool
    {
        return $this->membership($user, $business)?->hasPermission(Permission::OutletsRead) ?? false;
    }

    public function createOutlet(User $user, Business $business): bool
    {
        return $this->membership($user, $business)?->hasPermission(Permission::OutletsCreate) ?? false;
    }

    public function viewEmployees(User $user, Business $business): bool
    {
        return $this->membership($user, $business)?->hasPermission(Permission::MembersRead) ?? false;
    }

    public function createEmployee(User $user, Business $business): bool
    {
        return $this->membership($user, $business)?->hasPermission(Permission::MembersInvite) ?? false;
    }

    public function manageMembershipPermissions(User $user, Business $business): bool
    {
        return $this->membership($user, $business)?->hasPermission(Permission::PermissionsManageMembership) ?? false;
    }

    private function membership(User $user, Business $business): ?Membership
    {
        $membership = $user->membershipFor($business);

        return $membership?->isActive() ? $membership : null;
    }
}
