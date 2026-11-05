<?php

namespace Tests\Feature\Api\V1;

use App\Domain\Access\PermissionCatalog;
use App\Models\Business;
use App\Models\BusinessMembership;
use App\Models\Outlet;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MemberManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_add_employee_with_role_and_outlet_access(): void
    {
        [$owner, $business, $outlet] = $this->merchant();

        Sanctum::actingAs($owner);

        $response = $this->postJson('/api/v1/members', [
            'name' => 'Kasir Satu',
            'email' => 'KASIR@example.com',
            'password' => 'password123',
            'role' => BusinessMembership::ROLE_CASHIER,
            'outlet_ids' => [$outlet->id],
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.role', BusinessMembership::ROLE_CASHIER)
            ->assertJsonPath('data.status', BusinessMembership::STATUS_ACTIVE)
            ->assertJsonPath('data.user.email', 'kasir@example.com')
            ->assertJsonPath('data.outlets.0.id', $outlet->id)
            ->assertJsonPath('data.permissions', PermissionCatalog::forRole(BusinessMembership::ROLE_CASHIER));

        $employee = User::where('email', 'kasir@example.com')->sole();

        $this->assertDatabaseHas('business_memberships', [
            'user_id' => $employee->id,
            'business_id' => $business->id,
            'role' => BusinessMembership::ROLE_CASHIER,
            'status' => BusinessMembership::STATUS_ACTIVE,
        ]);
        $this->assertDatabaseHas('outlet_accesses', [
            'membership_id' => $employee->membership->id,
            'outlet_id' => $outlet->id,
        ]);

        // The new account is usable immediately and only sees its assigned outlet.
        $this->postJson('/api/v1/auth/login', [
            'email' => 'kasir@example.com',
            'password' => 'password123',
        ])->assertOk();

        Sanctum::actingAs($employee);

        $this->getJson('/api/v1/outlets')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $outlet->id);
    }

    public function test_invalid_member_payload_is_rejected_without_creating_records(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        [, , $foreignOutlet] = $this->merchant();

        Sanctum::actingAs($owner);

        $this->postJson('/api/v1/members', [
            'name' => 'Kasir Dua',
            'email' => $owner->email,
            'password' => 'password123',
            'role' => BusinessMembership::ROLE_OWNER,
            'outlet_ids' => [$foreignOutlet->id],
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email', 'role', 'outlet_ids.0']);

        $this->assertDatabaseCount('business_memberships', 2);
        $this->assertDatabaseCount('outlet_accesses', 0);
        $this->assertDatabaseMissing('users', ['email' => 'kasir@example.com']);
    }

    public function test_owner_can_change_role_and_outlet_access(): void
    {
        [$owner, $business, $outletA] = $this->merchant();
        $outletB = Outlet::factory()->for($business)->create();
        $employee = $this->employee($business, [$outletA], BusinessMembership::ROLE_CASHIER);

        Sanctum::actingAs($owner);

        $this->patchJson("/api/v1/members/{$employee->membership->id}", [
            'role' => BusinessMembership::ROLE_MANAGER,
            'outlet_ids' => [$outletB->id],
        ])
            ->assertOk()
            ->assertJsonPath('data.role', BusinessMembership::ROLE_MANAGER)
            ->assertJsonPath('data.outlets.0.id', $outletB->id);

        $this->assertDatabaseHas('business_memberships', [
            'id' => $employee->membership->id,
            'role' => BusinessMembership::ROLE_MANAGER,
        ]);
        $this->assertDatabaseMissing('outlet_accesses', [
            'membership_id' => $employee->membership->id,
            'outlet_id' => $outletA->id,
        ]);

        Sanctum::actingAs($employee);

        $this->getJson("/api/v1/outlets/{$outletA->id}")->assertNotFound();
        $this->getJson("/api/v1/outlets/{$outletB->id}")->assertOk();
    }

    public function test_manager_cannot_manage_owner_or_their_own_membership(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        $manager = $this->employee($business, [$outlet], BusinessMembership::ROLE_MANAGER);

        Sanctum::actingAs($manager);

        $this->patchJson("/api/v1/members/{$owner->membership->id}", [
            'role' => BusinessMembership::ROLE_MANAGER,
        ])->assertForbidden();

        $this->patchJson("/api/v1/members/{$owner->membership->id}", [
            'status' => BusinessMembership::STATUS_INACTIVE,
        ])->assertForbidden();

        $this->patchJson("/api/v1/members/{$manager->membership->id}", [
            'role' => BusinessMembership::ROLE_MANAGER,
        ])->assertForbidden();

        $this->patchJson("/api/v1/members/{$manager->membership->id}", [
            'status' => BusinessMembership::STATUS_INACTIVE,
        ])->assertForbidden();

        $this->assertSame(BusinessMembership::ROLE_OWNER, $owner->membership->fresh()->role);
        $this->assertSame(BusinessMembership::STATUS_ACTIVE, $manager->membership->fresh()->status);
    }

    public function test_manager_can_add_employee_but_cannot_assign_owner(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        $manager = $this->employee($business, [$outlet], BusinessMembership::ROLE_MANAGER);

        Sanctum::actingAs($manager);

        $this->postJson('/api/v1/members', [
            'name' => 'Kasir Tiga',
            'email' => 'kasir3@example.com',
            'password' => 'password123',
            'role' => BusinessMembership::ROLE_CASHIER,
            'outlet_ids' => [$outlet->id],
        ])->assertCreated();

        $this->postJson('/api/v1/members', [
            'name' => 'Owner Palsu',
            'email' => 'owner2@example.com',
            'password' => 'password123',
            'role' => BusinessMembership::ROLE_OWNER,
            'outlet_ids' => [$outlet->id],
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('role');

        $this->assertDatabaseCount('business_memberships', 3);
        $this->assertDatabaseMissing('users', ['email' => 'owner2@example.com']);
    }

    public function test_manager_cannot_grant_outlet_access_outside_their_own_scope(): void
    {
        [$owner, $business, $outletA] = $this->merchant();
        $outletB = Outlet::factory()->for($business)->create();
        $manager = $this->employee($business, [$outletA], BusinessMembership::ROLE_MANAGER);

        Sanctum::actingAs($manager);

        $this->postJson('/api/v1/members', [
            'name' => 'Kasir Empat',
            'email' => 'kasir4@example.com',
            'password' => 'password123',
            'role' => BusinessMembership::ROLE_CASHIER,
            'outlet_ids' => [$outletB->id],
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('outlet_ids');

        $this->assertDatabaseMissing('users', ['email' => 'kasir4@example.com']);
        $this->assertSame($owner->id, $business->memberships()->where('role', BusinessMembership::ROLE_OWNER)->sole()->user_id);
    }

    public function test_member_deactivation_revokes_tokens_and_reactivation_restores_access(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        $employee = $this->employee($business, [$outlet], BusinessMembership::ROLE_CASHIER);
        $employee->createToken('pos-mobile');

        Sanctum::actingAs($owner);

        $this->patchJson("/api/v1/members/{$employee->membership->id}", [
            'status' => BusinessMembership::STATUS_INACTIVE,
        ])
            ->assertOk()
            ->assertJsonPath('data.status', BusinessMembership::STATUS_INACTIVE)
            ->assertJsonPath('data.outlets.0.id', $outlet->id);

        $membership = $employee->membership->fresh();

        $this->assertSame(BusinessMembership::STATUS_INACTIVE, $membership->status);
        $this->assertDatabaseHas('outlet_accesses', [
            'membership_id' => $membership->id,
            'outlet_id' => $outlet->id,
        ]);
        $this->assertDatabaseCount('personal_access_tokens', 0);

        Sanctum::actingAs($employee->fresh());

        $this->getJson("/api/v1/outlets/{$outlet->id}")->assertForbidden();

        Sanctum::actingAs($owner);

        $this->patchJson("/api/v1/members/{$membership->id}", [
            'status' => BusinessMembership::STATUS_ACTIVE,
        ])
            ->assertOk()
            ->assertJsonPath('data.status', BusinessMembership::STATUS_ACTIVE)
            ->assertJsonPath('data.role', BusinessMembership::ROLE_CASHIER)
            ->assertJsonPath('data.outlets.0.id', $outlet->id);

        Sanctum::actingAs($employee->fresh());

        $this->getJson("/api/v1/outlets/{$outlet->id}")->assertOk();
    }

    public function test_owner_can_hard_delete_an_employee_membership(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        $employee = $this->employee($business, [$outlet], BusinessMembership::ROLE_CASHIER);
        $membershipId = $employee->membership->id;
        $employee->createToken('pos-mobile');

        Sanctum::actingAs($owner);

        $this->deleteJson("/api/v1/members/{$membershipId}")->assertNoContent();

        $this->assertDatabaseMissing('business_memberships', ['id' => $membershipId]);
        $this->assertDatabaseMissing('outlet_accesses', ['membership_id' => $membershipId]);
        $this->assertDatabaseCount('personal_access_tokens', 0);
        $this->assertDatabaseHas('users', ['id' => $employee->id]);
    }

    public function test_owner_cannot_hard_delete_the_owner_or_self(): void
    {
        [$owner] = $this->merchant();

        Sanctum::actingAs($owner);

        $this->deleteJson("/api/v1/members/{$owner->membership->id}")->assertForbidden();

        $this->assertDatabaseHas('business_memberships', ['id' => $owner->membership->id]);
    }

    public function test_manager_cannot_hard_delete_members(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        $manager = $this->employee($business, [$outlet], BusinessMembership::ROLE_MANAGER);
        $employee = $this->employee($business, [$outlet], BusinessMembership::ROLE_CASHIER);

        Sanctum::actingAs($manager);

        $this->deleteJson("/api/v1/members/{$employee->membership->id}")->assertForbidden();

        $this->assertDatabaseHas('business_memberships', ['id' => $employee->membership->id]);
        $this->assertDatabaseHas('business_memberships', ['id' => $owner->membership->id]);
    }

    public function test_member_delete_is_scoped_to_the_authenticated_business(): void
    {
        [$owner] = $this->merchant();
        [, , $foreignOutlet] = $this->merchant();
        $foreignEmployee = $this->employee($foreignOutlet->business, [$foreignOutlet], BusinessMembership::ROLE_CASHIER);

        Sanctum::actingAs($owner);

        $this->deleteJson("/api/v1/members/{$foreignEmployee->membership->id}")->assertNotFound();

        $this->assertDatabaseHas('business_memberships', ['id' => $foreignEmployee->membership->id]);
    }

    public function test_member_status_must_be_active_or_inactive(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        $employee = $this->employee($business, [$outlet], BusinessMembership::ROLE_CASHIER);

        Sanctum::actingAs($owner);

        $this->patchJson("/api/v1/members/{$employee->membership->id}", [
            'status' => 'DELETED',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('status');

        $this->assertSame(BusinessMembership::STATUS_ACTIVE, $employee->membership->fresh()->status);
    }

    /**
     * @return array{User, Business, Outlet}
     */
    private function merchant(): array
    {
        $owner = User::factory()->create();
        $membership = BusinessMembership::factory()->for($owner)->create();
        $outlet = Outlet::factory()->for($membership->business)->create();

        return [$owner, $membership->business, $outlet];
    }

    /**
     * @param  list<Outlet>  $outlets
     */
    private function employee(Business $business, array $outlets, string $role): User
    {
        $user = User::factory()->create();
        $membership = BusinessMembership::factory()->for($user)->create([
            'business_id' => $business->id,
            'role' => $role,
        ]);

        $membership->outletAccesses()->createMany(
            collect($outlets)->map(fn (Outlet $outlet): array => ['outlet_id' => $outlet->id])->all(),
        );

        return $user;
    }
}
