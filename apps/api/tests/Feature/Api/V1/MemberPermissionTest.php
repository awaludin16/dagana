<?php

namespace Tests\Feature\Api\V1;

use App\Models\Business;
use App\Models\BusinessMembership;
use App\Models\Outlet;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Izin tambahan di luar preset role (revisi D-04, 2026-11-17):
 * hanya Owner, hanya katalog D-03, preset tidak dapat dikirim/dicabut.
 */
class MemberPermissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_grant_extra_permission_on_create_and_backend_honors_it(): void
    {
        [$owner, $business, $outlet] = $this->merchant();

        Sanctum::actingAs($owner);

        $member = $this->postJson('/api/v1/members', [
            'name' => 'Kasir Menu',
            'email' => 'kasirmenu@example.com',
            'password' => 'password123',
            'role' => BusinessMembership::ROLE_CASHIER,
            'outlet_ids' => [$outlet->id],
            'extra_permissions' => ['products.create'],
        ])
            ->assertCreated()
            ->assertJsonPath('data.extra_permissions', ['products.create']);

        $this->assertDatabaseHas('membership_permission_overrides', [
            'membership_id' => $member->json('data.id'),
            'permission' => 'products.create',
        ]);

        $cashier = User::where('email', 'kasirmenu@example.com')->sole();

        Sanctum::actingAs($cashier);

        // Permission middleware membaca izin efektif (preset + tambahan).
        $this->postJson('/api/v1/products', [
            'name' => 'Es Teh',
            'price' => 5000,
        ])->assertCreated();
    }

    public function test_owner_can_revoke_extra_permission(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        $cashier = $this->employee($business, [$outlet], BusinessMembership::ROLE_CASHIER, ['products.create']);

        Sanctum::actingAs($owner);

        $this->patchJson("/api/v1/members/{$cashier->membership->id}", [
            'extra_permissions' => [],
        ])
            ->assertOk()
            ->assertJsonPath('data.extra_permissions', []);

        $this->assertDatabaseMissing('membership_permission_overrides', [
            'membership_id' => $cashier->membership->id,
        ]);

        Sanctum::actingAs($cashier);

        $this->postJson('/api/v1/products', [
            'name' => 'Es Teh',
            'price' => 5000,
        ])->assertForbidden();
    }

    public function test_extra_permission_must_come_from_the_catalog(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        $cashier = $this->employee($business, [$outlet], BusinessMembership::ROLE_CASHIER);

        Sanctum::actingAs($owner);

        $this->patchJson("/api/v1/members/{$cashier->membership->id}", [
            'extra_permissions' => ['products.destroy_everything'],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('extra_permissions.0');

        $this->assertDatabaseCount('membership_permission_overrides', 0);
    }

    public function test_role_preset_permission_cannot_be_sent_as_extra(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        $cashier = $this->employee($business, [$outlet], BusinessMembership::ROLE_CASHIER);

        Sanctum::actingAs($owner);

        $this->patchJson("/api/v1/members/{$cashier->membership->id}", [
            'extra_permissions' => ['payments.create'],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('extra_permissions');

        $this->assertDatabaseCount('membership_permission_overrides', 0);
    }

    public function test_preset_check_follows_the_role_sent_in_the_same_request(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        $cashier = $this->employee($business, [$outlet], BusinessMembership::ROLE_CASHIER);

        Sanctum::actingAs($owner);

        // products.create adalah preset MANAGER, jadi bila role diubah ke
        // MANAGER dalam request yang sama, kirim ulang izin itu harus ditolak.
        $this->patchJson("/api/v1/members/{$cashier->membership->id}", [
            'role' => BusinessMembership::ROLE_MANAGER,
            'extra_permissions' => ['products.create'],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('extra_permissions');

        $this->assertDatabaseCount('membership_permission_overrides', 0);
        $this->assertSame(BusinessMembership::ROLE_CASHIER, $cashier->membership->fresh()->role);
    }

    public function test_manager_cannot_set_extra_permissions(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        $manager = $this->employee($business, [$outlet], BusinessMembership::ROLE_MANAGER);
        $cashier = $this->employee($business, [$outlet], BusinessMembership::ROLE_CASHIER);

        Sanctum::actingAs($manager);

        $this->patchJson("/api/v1/members/{$cashier->membership->id}", [
            'extra_permissions' => ['products.create'],
        ])->assertForbidden()
            ->assertJsonPath('message', 'Hanya Owner yang dapat mengatur izin tambahan.');

        $this->postJson('/api/v1/members', [
            'name' => 'Kasir Baru',
            'email' => 'kasirbaru@example.com',
            'password' => 'password123',
            'role' => BusinessMembership::ROLE_CASHIER,
            'outlet_ids' => [$outlet->id],
            'extra_permissions' => ['products.create'],
        ])->assertForbidden();

        $this->assertDatabaseCount('membership_permission_overrides', 0);
        $this->assertDatabaseMissing('users', ['email' => 'kasirbaru@example.com']);
    }

    public function test_extra_permissions_survive_deactivation_and_reactivation(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        $cashier = $this->employee($business, [$outlet], BusinessMembership::ROLE_CASHIER, ['reports.read']);

        Sanctum::actingAs($owner);

        $this->patchJson("/api/v1/members/{$cashier->membership->id}", [
            'status' => BusinessMembership::STATUS_INACTIVE,
        ])->assertOk();

        $membership = $cashier->membership->fresh();

        $this->assertSame(['reports.read'], $membership->extraPermissions());
        $this->assertSame([], $membership->permissions(), 'Member non-aktif tidak boleh punya izin efektif.');

        $this->patchJson("/api/v1/members/{$membership->id}", [
            'status' => BusinessMembership::STATUS_ACTIVE,
        ])->assertOk()
            ->assertJsonPath('data.extra_permissions', ['reports.read']);

        Sanctum::actingAs($cashier->fresh());

        $today = now()->toDateString();

        $this->getJson("/api/v1/reports/sales?from={$today}&to={$today}")->assertOk();
    }

    public function test_me_reflects_effective_and_extra_permissions(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        $cashier = $this->employee($business, [$outlet], BusinessMembership::ROLE_CASHIER, ['products.create']);

        Sanctum::actingAs($cashier);

        $response = $this->getJson('/api/v1/me')->assertOk();

        $this->assertSame(['products.create'], $response->json('data.membership.extra_permissions'));
        $this->assertContains(
            'products.create',
            $response->json('data.membership.permissions'),
        );
        // Preset role tetap utuh di daftar izin efektif.
        $this->assertContains(
            'payments.create',
            $response->json('data.membership.permissions'),
        );
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
     * @param  list<string>  $extraPermissions
     */
    private function employee(Business $business, array $outlets, string $role, array $extraPermissions = []): User
    {
        $user = User::factory()->create();
        $membership = BusinessMembership::factory()->for($user)->create([
            'business_id' => $business->id,
            'role' => $role,
        ]);

        $membership->outletAccesses()->createMany(
            collect($outlets)->map(fn (Outlet $outlet): array => ['outlet_id' => $outlet->id])->all(),
        );

        if ($extraPermissions !== []) {
            $membership->permissionOverrides()->createMany(
                collect($extraPermissions)->map(fn (string $permission): array => ['permission' => $permission])->all(),
            );
        }

        return $user;
    }
}
