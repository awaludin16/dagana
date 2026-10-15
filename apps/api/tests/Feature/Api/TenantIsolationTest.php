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
 * Proves that Business A can never read or mutate Business B data
 * (AGENTS §4), and that inaccessible records resolve to 404 to avoid
 * leaking existence.
 */
class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_cannot_view_another_business(): void
    {
        $intruder = User::factory()->create();
        $business = Business::factory()->create();

        Membership::factory()
            ->forBusiness($business)
            ->forUser(User::factory()->create())
            ->role(RolePreset::Owner)
            ->create();

        $this->actingAs($intruder)
            ->getJson("/api/v1/businesses/{$business->id}")
            ->assertNotFound();
    }

    public function test_user_cannot_update_another_business(): void
    {
        $intruder = User::factory()->create();
        $business = Business::factory()->create();
        $originalName = $business->name;

        Membership::factory()
            ->forBusiness($business)
            ->forUser(User::factory()->create())
            ->role(RolePreset::Owner)
            ->create();

        $this->actingAs($intruder)
            ->patchJson("/api/v1/businesses/{$business->id}", ['name' => 'Diretas'])
            ->assertNotFound();

        $this->assertSame($originalName, $business->fresh()->name);
    }

    public function test_user_cannot_create_outlet_in_another_business(): void
    {
        $intruder = User::factory()->create();
        $business = Business::factory()->create();

        Membership::factory()
            ->forBusiness($business)
            ->forUser(User::factory()->create())
            ->role(RolePreset::Owner)
            ->create();

        $this->actingAs($intruder)
            ->postJson("/api/v1/businesses/{$business->id}/outlets", ['name' => 'Penyusup'])
            ->assertNotFound();

        $this->assertDatabaseMissing('outlets', ['business_id' => $business->id, 'name' => 'Penyusup']);
    }

    public function test_user_cannot_view_another_tenant_outlet(): void
    {
        $intruder = User::factory()->create();
        $business = Business::factory()->create();
        $outlet = Outlet::factory()->for($business)->create();

        Membership::factory()
            ->forBusiness($business)
            ->forUser(User::factory()->create())
            ->role(RolePreset::Owner)
            ->create();

        $this->actingAs($intruder)
            ->getJson("/api/v1/outlets/{$outlet->id}")
            ->assertNotFound();
    }

    public function test_business_list_only_contains_own_businesses(): void
    {
        $user = User::factory()->create();

        $own = Business::factory()->create();
        Membership::factory()->forBusiness($own)->forUser($user)->role(RolePreset::Owner)->create();

        $other = Business::factory()->create();
        Membership::factory()
            ->forBusiness($other)
            ->forUser(User::factory()->create())
            ->role(RolePreset::Owner)
            ->create();

        $response = $this->actingAs($user)->getJson('/api/v1/businesses');

        $response->assertOk();

        $ids = collect($response->json('data'))->pluck('id');

        $this->assertTrue($ids->contains($own->id));
        $this->assertFalse($ids->contains($other->id));
    }
}
