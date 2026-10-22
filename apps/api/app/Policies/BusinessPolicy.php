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

    public function viewCategories(User $user, Business $business): bool
    {
        return $this->membership($user, $business)?->hasPermission(Permission::CategoriesRead) ?? false;
    }

    public function createCategory(User $user, Business $business): bool
    {
        return $this->membership($user, $business)?->hasPermission(Permission::CategoriesCreate) ?? false;
    }

    public function updateCategory(User $user, Business $business): bool
    {
        return $this->membership($user, $business)?->hasPermission(Permission::CategoriesUpdate) ?? false;
    }

    public function archiveCategory(User $user, Business $business): bool
    {
        return $this->membership($user, $business)?->hasPermission(Permission::CategoriesArchive) ?? false;
    }

    public function viewProducts(User $user, Business $business): bool
    {
        return $this->membership($user, $business)?->hasPermission(Permission::ProductsRead) ?? false;
    }

    public function createProduct(User $user, Business $business): bool
    {
        return $this->membership($user, $business)?->hasPermission(Permission::ProductsCreate) ?? false;
    }

    public function updateProduct(User $user, Business $business): bool
    {
        return $this->membership($user, $business)?->hasPermission(Permission::ProductsUpdate) ?? false;
    }

    public function archiveProduct(User $user, Business $business): bool
    {
        return $this->membership($user, $business)?->hasPermission(Permission::ProductsArchive) ?? false;
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
