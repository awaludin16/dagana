<?php

namespace Tests\Unit\Authorization;

use App\Domain\Authorization\Enums\Permission;
use App\Domain\Authorization\Enums\RolePreset;
use App\Domain\Organization\Models\Membership;
use Tests\TestCase;

class RolePresetPermissionTest extends TestCase
{
    public function test_owner_preset_grants_every_permission(): void
    {
        $this->assertEqualsCanonicalizing(Permission::values(), RolePreset::Owner->permissions());
    }

    public function test_every_configured_permission_is_a_valid_catalog_key(): void
    {
        $valid = Permission::values();

        foreach (RolePreset::cases() as $role) {
            foreach ($role->permissions() as $permission) {
                $this->assertContains(
                    $permission,
                    $valid,
                    "Permission [{$permission}] for role [{$role->value}] is not in the catalog."
                );
            }
        }
    }

    public function test_membership_permission_helpers_follow_the_preset(): void
    {
        $cashier = new Membership([
            'role' => RolePreset::Cashier,
            'status' => Membership::STATUS_ACTIVE,
        ]);

        $this->assertTrue($cashier->hasPermission(Permission::PaymentsCreate));
        $this->assertFalse($cashier->hasPermission(Permission::SettingsUpdate));
    }

    public function test_inactive_membership_has_no_permissions(): void
    {
        $disabled = new Membership([
            'role' => RolePreset::Owner,
            'status' => Membership::STATUS_DISABLED,
        ]);

        $this->assertFalse($disabled->hasPermission(Permission::SettingsUpdate));
    }

    public function test_only_owner_preset_has_business_wide_outlet_access(): void
    {
        $this->assertTrue(RolePreset::Owner->hasBusinessWideOutletAccess());

        foreach ([RolePreset::Manager, RolePreset::Cashier, RolePreset::Inventory, RolePreset::Kitchen, RolePreset::Staff] as $role) {
            $this->assertFalse($role->hasBusinessWideOutletAccess());
        }
    }

    public function test_manager_preset_is_a_superset_of_every_other_non_owner_preset(): void
    {
        $manager = RolePreset::Manager->permissions();

        foreach ([RolePreset::Cashier, RolePreset::Inventory, RolePreset::Kitchen, RolePreset::Staff] as $role) {
            $this->assertSame(
                [],
                array_diff($role->permissions(), $manager),
                "Manager preset must cover [{$role->value}] so it cannot escalate by assigning it."
            );
        }

        // Owner is deliberately not a subset of Manager: only an Owner may create another Owner.
        $this->assertNotSame([], array_diff(RolePreset::Owner->permissions(), $manager));
    }
}
