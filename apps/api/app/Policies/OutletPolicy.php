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

    public function viewCatalog(User $user, Outlet $outlet): Response|bool
    {
        $membership = $this->membership($user, $outlet);

        if ($outlet->status !== Outlet::STATUS_ACTIVE
            || $membership === null
            || ! $membership->hasPermission(Permission::OutletsRead)
            || ! $membership->hasPermission(Permission::ProductsRead)
            || ! $membership->hasOutletAccess($outlet)) {
            return Response::denyAsNotFound();
        }

        return true;
    }

    public function viewCatalogCategories(User $user, Outlet $outlet): Response|bool
    {
        $catalogAccess = $this->viewCatalog($user, $outlet);
        if ($catalogAccess !== true) {
            return $catalogAccess;
        }

        return $this->membership($user, $outlet)?->hasPermission(Permission::CategoriesRead)
            ? true
            : Response::denyAsNotFound();
    }

    public function viewOrders(User $user, Outlet $outlet): Response|bool
    {
        $membership = $this->membership($user, $outlet);

        if ($membership === null
            || ! $membership->hasPermission(Permission::OutletsRead)
            || ! $membership->hasPermission(Permission::OrdersRead)
            || ! $membership->hasOutletAccess($outlet)) {
            return Response::denyAsNotFound();
        }

        return true;
    }

    public function createOrder(User $user, Outlet $outlet): Response|bool
    {
        $membership = $this->membership($user, $outlet);

        if ($outlet->status !== Outlet::STATUS_ACTIVE
            || $membership === null
            || ! $membership->hasPermission(Permission::OutletsRead)
            || ! $membership->hasPermission(Permission::OrdersCreate)
            || ! $membership->hasPermission(Permission::PaymentsCreate)
            || ! $membership->hasOutletAccess($outlet)) {
            return Response::denyAsNotFound();
        }

        return true;
    }

    public function confirmOrderPayment(User $user, Outlet $outlet): Response|bool
    {
        $membership = $this->membership($user, $outlet);

        if ($membership === null
            || ! $membership->hasPermission(Permission::OutletsRead)
            || ! $membership->hasPermission(Permission::PaymentsCreate)
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

    public function disable(User $user, Outlet $outlet): Response|bool
    {
        $membership = $this->membership($user, $outlet);

        if ($membership === null
            || ! $membership->hasPermission(Permission::OutletsDisable)
            || ! $membership->hasOutletAccess($outlet)) {
            return Response::denyAsNotFound();
        }

        return true;
    }

    public function enable(User $user, Outlet $outlet): Response|bool
    {
        return $this->disable($user, $outlet);
    }

    private function membership(User $user, Outlet $outlet): ?Membership
    {
        $membership = $user->memberships()
            ->where('business_id', $outlet->business_id)
            ->first();

        return $membership?->isActive() ? $membership : null;
    }
}
