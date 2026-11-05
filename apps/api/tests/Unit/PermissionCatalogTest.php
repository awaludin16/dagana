<?php

namespace Tests\Unit;

use App\Domain\Access\PermissionCatalog;
use App\Models\BusinessMembership;
use PHPUnit\Framework\TestCase;

class PermissionCatalogTest extends TestCase
{
    public function test_only_the_three_mvp_roles_are_defined_with_resource_action_permissions(): void
    {
        $this->assertSame(
            [BusinessMembership::ROLE_OWNER, BusinessMembership::ROLE_MANAGER, BusinessMembership::ROLE_CASHIER],
            PermissionCatalog::ROLES,
        );

        foreach (PermissionCatalog::PERMISSIONS as $permission) {
            $this->assertMatchesRegularExpression('/^[a-z_]+\.[a-z_]+$/', $permission);
        }

        foreach (PermissionCatalog::ROLES as $role) {
            $this->assertSame(
                PermissionCatalog::forRole($role),
                array_values(array_unique(PermissionCatalog::forRole($role))),
            );
        }
    }

    public function test_owner_receives_every_permission_and_manager_cannot_escalate(): void
    {
        $this->assertSame(PermissionCatalog::PERMISSIONS, PermissionCatalog::forRole(BusinessMembership::ROLE_OWNER));
        $this->assertContains('members.delete', PermissionCatalog::PERMISSIONS);
        $this->assertNotContains('members.remove', PermissionCatalog::PERMISSIONS);
        $this->assertNotContains('business.delete', PermissionCatalog::PERMISSIONS);

        $manager = PermissionCatalog::forRole(BusinessMembership::ROLE_MANAGER);

        $this->assertContains('members.update', $manager);
        $this->assertContains('orders.create', $manager);
        $this->assertNotContains('members.delete', $manager);
        $this->assertNotContains('billing.manage_settings', $manager);
        $this->assertNotContains('audit.read', $manager);

        $cashier = PermissionCatalog::forRole(BusinessMembership::ROLE_CASHIER);

        $this->assertContains('orders.create', $cashier);
        $this->assertContains('payments.create', $cashier);
        $this->assertContains('cash.open', $cashier);
        $this->assertNotContains('members.read', $cashier);
        $this->assertNotContains('products.create', $cashier);
        $this->assertNotContains('reports.read', $cashier);
        $this->assertNotContains('settings.read', $cashier);
    }
}
