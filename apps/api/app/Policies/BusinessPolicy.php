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
        return $this->membership($user, $business) !== null;
    }

    public function update(User $user, Business $business): bool
    {
        return $this->membership($user, $business)?->hasPermission(Permission::SettingsUpdate) ?? false;
    }

    public function viewOutlets(User $user, Business $business): bool
    {
        return $this->membership($user, $business)?->hasPermission(Permission::OutletsRead) ?? false;
    }

    public function createOutlet(User $user, Business $business): bool
    {
        return $this->membership($user, $business)?->hasPermission(Permission::OutletsManage) ?? false;
    }

    private function membership(User $user, Business $business): ?Membership
    {
        $membership = $user->membershipFor($business);

        return $membership?->isActive() ? $membership : null;
    }
}
