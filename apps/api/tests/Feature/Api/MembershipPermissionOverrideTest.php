<?php

namespace Tests\Feature\Api;

use App\Domain\Authorization\Enums\Permission;
use App\Domain\Authorization\Enums\RolePreset;
use App\Domain\Organization\Models\Business;
use App\Domain\Organization\Models\Membership;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Covers explicit membership permission overrides (decision-log D-04):
 * grant, deny, precedence, anti-escalation, Owner immutability, and isolation.
 */
class MembershipPermissionOverrideTest extends TestCase
{
    use RefreshDatabase;

    private function memberOf(Business $business, RolePreset $role, ?User $user = null): Membership
    {
        $user ??= User::factory()->create();

        return Membership::factory()
            ->forBusiness($business)
            ->forUser($user)
            ->role($role)
            ->create();
    }

    public function test_owner_can_grant_a_permission_beyond_the_preset(): void
    {
        $business = Business::factory()->create();
        $owner = $this->memberOf($business, RolePreset::Owner);
        $staff = $this->memberOf($business, RolePreset::Staff);

        $this->assertFalse($staff->hasPermission(Permission::MembersRead));

        $this->actingAs($owner->user)
            ->patchJson("/api/v1/businesses/{$business->id}/members/{$staff->id}", [
                'permission_grants' => [Permission::MembersRead->value],
            ])
            ->assertOk()
            ->assertJsonPath('data.permission_grants', [Permission::MembersRead->value]);

        $this->assertTrue($staff->fresh()->hasPermission(Permission::MembersRead));

        // The effective permission is now enforced by the backend.
        $this->actingAs($staff->user)
            ->getJson("/api/v1/businesses/{$business->id}/members")
            ->assertOk();
    }

    public function test_owner_can_deny_a_permission_granted_by_the_preset(): void
    {
        $business = Business::factory()->create();
        $owner = $this->memberOf($business, RolePreset::Owner);
        $cashier = $this->memberOf($business, RolePreset::Cashier);

        $this->assertTrue($cashier->hasPermission(Permission::PaymentsCreate));

        $this->actingAs($owner->user)
            ->patchJson("/api/v1/businesses/{$business->id}/members/{$cashier->id}", [
                'permission_denials' => [Permission::PaymentsCreate->value],
            ])
            ->assertOk();

        $denied = $cashier->fresh();
        $this->assertTrue($denied->hasPermission(Permission::PaymentsRead));
        $this->assertFalse($denied->hasPermission(Permission::PaymentsCreate));
    }

    public function test_grant_and_deny_for_the_same_permission_is_rejected(): void
    {
        $business = Business::factory()->create();
        $owner = $this->memberOf($business, RolePreset::Owner);
        $cashier = $this->memberOf($business, RolePreset::Cashier);

        $this->actingAs($owner->user)
            ->patchJson("/api/v1/businesses/{$business->id}/members/{$cashier->id}", [
                'permission_grants' => [Permission::OrdersCancel->value],
                'permission_denials' => [Permission::OrdersCancel->value],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('permission_grants');

        $this->assertFalse($cashier->fresh()->hasPermission(Permission::OrdersCancel));
    }

    public function test_overrides_are_isolated_between_memberships(): void
    {
        $business = Business::factory()->create();
        $owner = $this->memberOf($business, RolePreset::Owner);
        $first = $this->memberOf($business, RolePreset::Cashier);
        $second = $this->memberOf($business, RolePreset::Cashier);

        $this->actingAs($owner->user)
            ->patchJson("/api/v1/businesses/{$business->id}/members/{$first->id}", [
                'permission_denials' => [Permission::PaymentsCreate->value],
            ])
            ->assertOk();

        $this->assertFalse($first->fresh()->hasPermission(Permission::PaymentsCreate));
        $this->assertTrue($second->fresh()->hasPermission(Permission::PaymentsCreate));
    }

    public function test_member_without_manage_permission_cannot_change_overrides(): void
    {
        $business = Business::factory()->create();
        $this->memberOf($business, RolePreset::Owner);
        $cashier = $this->memberOf($business, RolePreset::Cashier);
        $target = $this->memberOf($business, RolePreset::Staff);

        $this->actingAs($cashier->user)
            ->patchJson("/api/v1/businesses/{$business->id}/members/{$target->id}", [
                'permission_grants' => [Permission::ReportsRead->value],
            ])
            ->assertForbidden();

        $this->assertFalse($target->fresh()->hasPermission(Permission::ReportsRead));
    }

    public function test_actor_cannot_grant_a_permission_it_does_not_hold(): void
    {
        $business = Business::factory()->create();
        $this->memberOf($business, RolePreset::Owner);
        $manager = $this->memberOf($business, RolePreset::Manager);
        $cashier = $this->memberOf($business, RolePreset::Cashier);

        // Manager holds permissions.manage_membership but not audit.read.
        $this->assertFalse($manager->hasPermission(Permission::AuditRead));

        $this->actingAs($manager->user)
            ->patchJson("/api/v1/businesses/{$business->id}/members/{$cashier->id}", [
                'permission_grants' => [Permission::AuditRead->value],
            ])
            ->assertForbidden();

        $this->assertFalse($cashier->fresh()->hasPermission(Permission::AuditRead));
    }

    public function test_manager_can_manage_overrides_within_own_permissions(): void
    {
        $business = Business::factory()->create();
        $this->memberOf($business, RolePreset::Owner);
        $manager = $this->memberOf($business, RolePreset::Manager);
        $cashier = $this->memberOf($business, RolePreset::Cashier);

        $this->actingAs($manager->user)
            ->patchJson("/api/v1/businesses/{$business->id}/members/{$cashier->id}", [
                'permission_grants' => [Permission::ReportsExport->value],
            ])
            ->assertOk();

        $this->assertTrue($cashier->fresh()->hasPermission(Permission::ReportsExport));
    }

    public function test_manager_cannot_assign_owner_role_through_invitation(): void
    {
        $business = Business::factory()->create();
        $this->memberOf($business, RolePreset::Owner);
        $manager = $this->memberOf($business, RolePreset::Manager);
        $newUser = User::factory()->create(['email' => 'candidate@dagana.test']);

        $this->actingAs($manager->user)
            ->postJson("/api/v1/businesses/{$business->id}/invitations", [
                'email' => $newUser->email,
                'role' => RolePreset::Owner->value,
            ])
            ->assertForbidden();

        $this->assertDatabaseMissing('memberships', [
            'business_id' => $business->id,
            'user_id' => $newUser->id,
        ]);
    }

    public function test_owner_overrides_are_ignored_and_keep_the_full_catalog(): void
    {
        $business = Business::factory()->create();
        $owner = $this->memberOf($business, RolePreset::Owner);
        $secondOwner = $this->memberOf($business, RolePreset::Owner);

        $this->actingAs($owner->user)
            ->patchJson("/api/v1/businesses/{$business->id}/members/{$secondOwner->id}", [
                'permission_denials' => [Permission::AuditRead->value],
            ])
            ->assertOk()
            ->assertJsonPath('data.permission_denials', []);

        $this->assertTrue($secondOwner->fresh()->hasPermission(Permission::AuditRead));
        $this->assertDatabaseMissing('membership_permissions', [
            'membership_id' => $secondOwner->id,
        ]);
    }

    public function test_invalid_permission_is_rejected(): void
    {
        $business = Business::factory()->create();
        $owner = $this->memberOf($business, RolePreset::Owner);
        $staff = $this->memberOf($business, RolePreset::Staff);

        $this->actingAs($owner->user)
            ->patchJson("/api/v1/businesses/{$business->id}/members/{$staff->id}", [
                'permission_grants' => ['not.a.permission'],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('permission_grants.0');
    }

    public function test_cannot_change_overrides_of_membership_from_another_business(): void
    {
        $businessA = Business::factory()->create();
        $ownerA = $this->memberOf($businessA, RolePreset::Owner);

        $businessB = Business::factory()->create();
        $ownerB = $this->memberOf($businessB, RolePreset::Owner);

        $this->actingAs($ownerA->user)
            ->patchJson("/api/v1/businesses/{$businessA->id}/members/{$ownerB->id}", [
                'permission_denials' => [Permission::AuditRead->value],
            ])
            ->assertNotFound();

        $this->assertTrue($ownerB->fresh()->hasPermission(Permission::AuditRead));
    }
}
