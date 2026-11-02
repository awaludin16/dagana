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

class MembershipAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_operate_without_creating_any_employee(): void
    {
        [$owner, $business, $outlet] = $this->merchant();

        $this->assertDatabaseCount('business_memberships', 1);
        $this->assertDatabaseCount('users', 1);

        Sanctum::actingAs($owner);

        $this->getJson("/api/v1/businesses/{$business->id}")->assertOk();
        $this->getJson("/api/v1/outlets/{$outlet->id}")->assertOk();
        $this->getJson('/api/v1/members')->assertOk()->assertJsonCount(1, 'data');

        $this->getJson('/api/v1/me')
            ->assertOk()
            ->assertJsonPath('data.membership.role', BusinessMembership::ROLE_OWNER)
            ->assertJsonPath('data.membership.status', BusinessMembership::STATUS_ACTIVE)
            ->assertJsonCount(1, 'data.membership.outlets')
            ->assertJsonPath('data.membership.permissions', PermissionCatalog::forRole(BusinessMembership::ROLE_OWNER));
    }

    public function test_cashier_is_denied_actions_outside_the_preset_permissions(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        $cashier = $this->employee($business, [$outlet], BusinessMembership::ROLE_CASHIER);

        Sanctum::actingAs($cashier);

        $this->getJson("/api/v1/businesses/{$business->id}")->assertOk();
        $this->getJson('/api/v1/members')->assertForbidden();
        $this->getJson('/api/v1/roles')->assertForbidden();
        $this->patchJson("/api/v1/businesses/{$business->id}", ['name' => 'Diubah'])->assertForbidden();
        $this->patchJson("/api/v1/outlets/{$outlet->id}", ['name' => 'Diubah'])->assertForbidden();

        $this->assertDatabaseHas('businesses', ['id' => $business->id, 'name' => $business->name]);
        $this->assertDatabaseHas('outlets', ['id' => $outlet->id, 'name' => $outlet->name]);

        $this->assertTrue($owner->membership->hasPermission('members.read'));
        $this->getJson('/api/v1/me')
            ->assertOk()
            ->assertJsonPath('data.membership.role', BusinessMembership::ROLE_CASHIER)
            ->assertJsonFragment(['orders.create']);
    }

    public function test_inactive_membership_cannot_access_business_context(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        $cashier = $this->employee(
            $business,
            [$outlet],
            BusinessMembership::ROLE_CASHIER,
            BusinessMembership::STATUS_INACTIVE,
        );

        Sanctum::actingAs($cashier);

        $this->getJson("/api/v1/businesses/{$business->id}")->assertForbidden();
        $this->getJson('/api/v1/outlets')->assertForbidden();
        $this->getJson("/api/v1/outlets/{$outlet->id}")->assertForbidden();

        $this->getJson('/api/v1/me')
            ->assertOk()
            ->assertJsonPath('data.membership.status', BusinessMembership::STATUS_INACTIVE)
            ->assertJsonPath('data.membership.permissions', []);
    }

    public function test_manager_cannot_reach_outlet_outside_their_access(): void
    {
        [$owner, $business, $outletA] = $this->merchant();
        $outletB = Outlet::factory()->for($business)->create();
        $manager = $this->employee($business, [$outletA], BusinessMembership::ROLE_MANAGER);

        Sanctum::actingAs($manager);

        $this->getJson('/api/v1/outlets')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $outletA->id);

        $this->getJson("/api/v1/outlets/{$outletB->id}")->assertNotFound();
        $this->patchJson("/api/v1/outlets/{$outletB->id}", ['name' => 'Diambil Alih'])
            ->assertNotFound();

        $this->assertDatabaseHas('outlets', ['id' => $outletB->id, 'name' => $outletB->name]);
        $this->assertNotSame($owner->id, $manager->id);
    }

    public function test_owner_cannot_manage_membership_from_another_business(): void
    {
        [$ownerA, , $outletA] = $this->merchant();
        [$ownerB, $businessB, $outletB] = $this->merchant();
        $employeeB = $this->employee($businessB, [$outletB], BusinessMembership::ROLE_CASHIER);

        Sanctum::actingAs($ownerA);

        $target = $employeeB->membership;

        $this->patchJson("/api/v1/members/{$target->id}", [
            'role' => BusinessMembership::ROLE_MANAGER,
        ])->assertNotFound();

        $this->deleteJson("/api/v1/members/{$target->id}")->assertNotFound();

        $this->assertSame(BusinessMembership::ROLE_CASHIER, $target->fresh()->role);
        $this->assertSame(BusinessMembership::STATUS_ACTIVE, $target->fresh()->status);
        $this->getJson("/api/v1/outlets/{$outletA->id}")->assertOk();
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
    private function employee(
        Business $business,
        array $outlets,
        string $role,
        string $status = BusinessMembership::STATUS_ACTIVE,
    ): User {
        $user = User::factory()->create();
        $membership = BusinessMembership::factory()->for($user)->create([
            'business_id' => $business->id,
            'role' => $role,
            'status' => $status,
        ]);

        $membership->outletAccesses()->createMany(
            collect($outlets)->map(fn (Outlet $outlet): array => ['outlet_id' => $outlet->id])->all(),
        );

        return $user;
    }
}
