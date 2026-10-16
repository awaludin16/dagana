<?php

namespace App\Policies;

use App\Domain\Authorization\Enums\Permission;
use App\Domain\Organization\Models\Membership;
use App\Domain\Outlet\Models\Outlet;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class OutletPolicy
{
    public function view(User $user, Outlet $outlet): Response|bool
    {
        $membership = $this->membership($user, $outlet);

        if ($membership === null
            || ! $membership->hasPermission(Permission::OutletsRead)
            || ! $membership->hasOutletAccess($outlet)) {
            return Response::denyAsNotFound();
        }

        return true;
    }

    public function update(User $user, Outlet $outlet): Response|bool
    {
        $membership = $this->membership($user, $outlet);

        if ($membership === null
            || ! $membership->hasPermission(Permission::OutletsUpdate)
            || ! $membership->hasOutletAccess($outlet)) {
            return Response::denyAsNotFound();
        }

        return true;
    }

    private function membership(User $user, Outlet $outlet): ?Membership
    {
        $membership = $user->memberships()
            ->where('business_id', $outlet->business_id)
            ->first();

        return $membership?->isActive() ? $membership : null;
    }
}
