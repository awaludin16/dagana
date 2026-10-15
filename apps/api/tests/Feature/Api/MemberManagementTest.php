<?php

namespace Tests\Feature\Api;

use App\Domain\Authorization\Enums\RolePreset;
use App\Domain\Organization\Models\Business;
use App\Domain\Organization\Models\Membership;
use App\Domain\Outlet\Models\Outlet;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Covers employee/membership management: permission granted, permission denied,
 * inactive membership, outlet-scoped access, and cross-tenant isolation.
 */
class MemberManagementTest extends TestCase
{
    use RefreshDatabase;

    private function ownerOf(Business $business): User
    {
        $owner = User::factory()->create();

        Membership::factory()
            ->forBusiness($business)
            ->forUser($owner)
            ->role(RolePreset::Owner)
            ->create();

        return $owner;
    }

    private function memberOf(Business $business, RolePreset $role): User
    {
        $user = User::factory()->create();

        Membership::factory()
            ->forBusiness($business)
            ->forUser($user)
            ->role($role)
            ->create();

        return $user;
    }

    public function test_owner_can_list_members(): void
    {
        $business = Business::factory()->create();
        $owner = $this->ownerOf($business);

        $response = $this->actingAs($owner)->getJson("/api/v1/businesses/{$business->id}/members");

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.role', RolePreset::Owner->value)
            ->assertJsonPath('data.0.role_label', 'Owner')
            ->assertJsonPath('data.0.user.email', $owner->email);
    }

    public function test_member_without_employees_read_cannot_list_members(): void
    {
        $business = Business::factory()->create();
        $this->ownerOf($business);

        $cashier = $this->memberOf($business, RolePreset::Cashier);

        $this->actingAs($cashier)
            ->getJson("/api/v1/businesses/{$business->id}/members")
            ->assertForbidden();
    }

    public function test_owner_can_add_employee_with_role_and_outlet_access(): void
    {
        $business = Business::factory()->create();
        $owner = $this->ownerOf($business);
        $outlet = Outlet::factory()->for($business)->create();
        $employee = User::factory()->create(['email' => 'employee@dagana.test']);

        $response = $this->actingAs($owner)->postJson("/api/v1/businesses/{$business->id}/members", [
            'email' => $employee->email,
            'role' => RolePreset::Cashier->value,
            'outlet_ids' => [$outlet->id],
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.role', RolePreset::Cashier->value)
            ->assertJsonPath('data.status', Membership::STATUS_ACTIVE)
            ->assertJsonPath('data.user.email', 'employee@dagana.test')
            ->assertJsonPath('data.outlets.0.id', $outlet->id);

        $membershipId = $response->json('data.id');

        $this->assertDatabaseHas('memberships', [
            'id' => $membershipId,
            'business_id' => $business->id,
            'user_id' => $employee->id,
            'role' => RolePreset::Cashier->value,
            'status' => Membership::STATUS_ACTIVE,
        ]);

        $this->assertDatabaseHas('membership_outlet', [
            'membership_id' => $membershipId,
            'outlet_id' => $outlet->id,
        ]);
    }

    public function test_owner_membership_ignores_explicit_outlet_grants(): void
    {
        $business = Business::factory()->create();
        $owner = $this->ownerOf($business);
        $outlet = Outlet::factory()->for($business)->create();
        $secondOwner = User::factory()->create(['email' => 'second-owner@dagana.test']);

        $response = $this->actingAs($owner)->postJson("/api/v1/businesses/{$business->id}/members", [
            'email' => $secondOwner->email,
            'role' => RolePreset::Owner->value,
            'outlet_ids' => [$outlet->id],
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.business_wide_outlet_access', true);

        $this->assertDatabaseMissing('membership_outlet', [
            'membership_id' => $response->json('data.id'),
        ]);
    }

    public function test_adding_unknown_email_is_rejected(): void
    {
        $business = Business::factory()->create();
        $owner = $this->ownerOf($business);

        $this->actingAs($owner)
            ->postJson("/api/v1/businesses/{$business->id}/members", [
                'email' => 'nobody@dagana.test',
                'role' => RolePreset::Cashier->value,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('email');
    }

    public function test_adding_existing_member_is_rejected(): void
    {
        $business = Business::factory()->create();
        $owner = $this->ownerOf($business);
        $existing = $this->memberOf($business, RolePreset::Cashier);

        $this->actingAs($owner)
            ->postJson("/api/v1/businesses/{$business->id}/members", [
                'email' => $existing->email,
                'role' => RolePreset::Staff->value,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('email');

        $this->assertDatabaseCount('memberships', 2);
    }

    public function test_adding_employee_with_outlet_from_another_business_is_rejected(): void
    {
        $business = Business::factory()->create();
        $owner = $this->ownerOf($business);
        $foreignOutlet = Outlet::factory()->create();
        $employee = User::factory()->create();

        $this->actingAs($owner)
            ->postJson("/api/v1/businesses/{$business->id}/members", [
                'email' => $employee->email,
                'role' => RolePreset::Cashier->value,
                'outlet_ids' => [$foreignOutlet->id],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('outlet_ids.0');

        $this->assertDatabaseMissing('memberships', ['user_id' => $employee->id]);
    }

    public function test_invalid_role_is_rejected(): void
    {
        $business = Business::factory()->create();
        $owner = $this->ownerOf($business);
        $employee = User::factory()->create();

        $this->actingAs($owner)
            ->postJson("/api/v1/businesses/{$business->id}/members", [
                'email' => $employee->email,
                'role' => 'superadmin',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('role');
    }

    public function test_member_without_employees_create_cannot_add_employee(): void
    {
        $business = Business::factory()->create();
        $this->ownerOf($business);
        $cashier = $this->memberOf($business, RolePreset::Cashier);
        $employee = User::factory()->create();

        $this->actingAs($cashier)
            ->postJson("/api/v1/businesses/{$business->id}/members", [
                'email' => $employee->email,
                'role' => RolePreset::Staff->value,
            ])
            ->assertForbidden();

        $this->assertDatabaseMissing('memberships', ['user_id' => $employee->id]);
    }

    public function test_owner_can_update_employee_role_and_outlets(): void
    {
        $business = Business::factory()->create();
        $owner = $this->ownerOf($business);
        $outlet = Outlet::factory()->for($business)->create();
        $employee = $this->memberOf($business, RolePreset::Staff);
        $membership = $employee->membershipFor($business);

        $this->actingAs($owner)
            ->patchJson("/api/v1/businesses/{$business->id}/members/{$membership->id}", [
                'role' => RolePreset::Manager->value,
                'outlet_ids' => [$outlet->id],
            ])
            ->assertOk()
            ->assertJsonPath('data.role', RolePreset::Manager->value)
            ->assertJsonPath('data.outlets.0.id', $outlet->id);

        $this->assertDatabaseHas('memberships', [
            'id' => $membership->id,
            'role' => RolePreset::Manager->value,
        ]);
        $this->assertDatabaseHas('membership_outlet', [
            'membership_id' => $membership->id,
            'outlet_id' => $outlet->id,
        ]);
    }

    public function test_member_without_employees_update_cannot_change_role(): void
    {
        $business = Business::factory()->create();
        $this->ownerOf($business);
        $cashier = $this->memberOf($business, RolePreset::Cashier);
        $target = $this->memberOf($business, RolePreset::Staff);
        $targetMembership = $target->membershipFor($business);

        $this->actingAs($cashier)
            ->patchJson("/api/v1/businesses/{$business->id}/members/{$targetMembership->id}", [
                'role' => RolePreset::Manager->value,
            ])
            ->assertForbidden();

        $this->assertDatabaseHas('memberships', [
            'id' => $targetMembership->id,
            'role' => RolePreset::Staff->value,
        ]);
    }

    public function test_owner_can_disable_employee_and_employee_loses_business_access(): void
    {
        $business = Business::factory()->create();
        $owner = $this->ownerOf($business);
        $employee = $this->memberOf($business, RolePreset::Cashier);
        $membership = $employee->membershipFor($business);

        $this->actingAs($employee)->getJson("/api/v1/businesses/{$business->id}")->assertOk();

        $this->actingAs($owner)
            ->postJson("/api/v1/businesses/{$business->id}/members/{$membership->id}/disable")
            ->assertOk()
            ->assertJsonPath('data.status', Membership::STATUS_DISABLED);

        $this->actingAs($employee)
            ->getJson("/api/v1/businesses/{$business->id}")
            ->assertNotFound();
    }

    public function test_owner_can_reenable_employee(): void
    {
        $business = Business::factory()->create();
        $owner = $this->ownerOf($business);
        $employee = $this->memberOf($business, RolePreset::Cashier);
        $membership = $employee->membershipFor($business);

        $this->actingAs($owner)
            ->postJson("/api/v1/businesses/{$business->id}/members/{$membership->id}/disable")
            ->assertOk();

        $this->actingAs($owner)
            ->postJson("/api/v1/businesses/{$business->id}/members/{$membership->id}/enable")
            ->assertOk()
            ->assertJsonPath('data.status', Membership::STATUS_ACTIVE);

        $this->actingAs($employee)
            ->getJson("/api/v1/businesses/{$business->id}")
            ->assertOk();
    }

    public function test_cannot_disable_last_owner(): void
    {
        $business = Business::factory()->create();
        $owner = $this->ownerOf($business);
        $membership = $owner->membershipFor($business);

        $this->actingAs($owner)
            ->postJson("/api/v1/businesses/{$business->id}/members/{$membership->id}/disable")
            ->assertStatus(409);

        $this->assertDatabaseHas('memberships', [
            'id' => $membership->id,
            'status' => Membership::STATUS_ACTIVE,
        ]);
    }

    public function test_cannot_demote_last_owner(): void
    {
        $business = Business::factory()->create();
        $owner = $this->ownerOf($business);
        $membership = $owner->membershipFor($business);

        $this->actingAs($owner)
            ->patchJson("/api/v1/businesses/{$business->id}/members/{$membership->id}", [
                'role' => RolePreset::Manager->value,
            ])
            ->assertStatus(409);

        $this->assertDatabaseHas('memberships', [
            'id' => $membership->id,
            'role' => RolePreset::Owner->value,
        ]);
    }

    public function test_owner_can_demote_when_another_active_owner_exists(): void
    {
        $business = Business::factory()->create();
        $owner = $this->ownerOf($business);
        $secondOwner = $this->memberOf($business, RolePreset::Owner);
        $secondMembership = $secondOwner->membershipFor($business);

        $this->actingAs($owner)
            ->patchJson("/api/v1/businesses/{$business->id}/members/{$secondMembership->id}", [
                'role' => RolePreset::Manager->value,
            ])
            ->assertOk();

        $this->assertDatabaseHas('memberships', [
            'id' => $secondMembership->id,
            'role' => RolePreset::Manager->value,
        ]);
    }

    public function test_cannot_manage_membership_of_another_business(): void
    {
        $businessA = Business::factory()->create();
        $ownerA = $this->ownerOf($businessA);

        $businessB = Business::factory()->create();
        $ownerB = $this->ownerOf($businessB);
        $membershipB = $ownerB->membershipFor($businessB);

        $this->actingAs($ownerA)
            ->patchJson("/api/v1/businesses/{$businessA->id}/members/{$membershipB->id}", [
                'role' => RolePreset::Manager->value,
            ])
            ->assertNotFound();

        $this->actingAs($ownerA)
            ->postJson("/api/v1/businesses/{$businessA->id}/members/{$membershipB->id}/disable")
            ->assertNotFound();

        $this->assertDatabaseHas('memberships', [
            'id' => $membershipB->id,
            'role' => RolePreset::Owner->value,
            'status' => Membership::STATUS_ACTIVE,
        ]);
    }

    public function test_employee_can_only_view_outlets_they_are_granted(): void
    {
        $business = Business::factory()->create();
        $owner = $this->ownerOf($business);
        $grantedOutlet = Outlet::factory()->for($business)->create();
        $otherOutlet = Outlet::factory()->for($business)->create();
        $employee = User::factory()->create();

        $response = $this->actingAs($owner)->postJson("/api/v1/businesses/{$business->id}/members", [
            'email' => $employee->email,
            'role' => RolePreset::Cashier->value,
            'outlet_ids' => [$grantedOutlet->id],
        ]);

        $response->assertCreated();

        $this->actingAs($employee)
            ->getJson("/api/v1/outlets/{$grantedOutlet->id}")
            ->assertOk();

        $this->actingAs($employee)
            ->getJson("/api/v1/outlets/{$otherOutlet->id}")
            ->assertNotFound();
    }

    public function test_owner_retains_operational_access_after_employee_is_added(): void
    {
        $business = Business::factory()->create();
        $owner = $this->ownerOf($business);
        $employee = User::factory()->create();

        $this->actingAs($owner)
            ->postJson("/api/v1/businesses/{$business->id}/members", [
                'email' => $employee->email,
                'role' => RolePreset::Cashier->value,
            ])
            ->assertCreated();

        // Employee setup must not lock the owner out of the business context.
        $this->actingAs($owner)
            ->getJson("/api/v1/businesses/{$business->id}")
            ->assertOk();

        $this->actingAs($owner)
            ->postJson("/api/v1/businesses/{$business->id}/outlets", ['name' => 'Outlet Kedua'])
            ->assertCreated();
    }
}
