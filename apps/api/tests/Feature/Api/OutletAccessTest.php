<?php

namespace Tests\Feature\Api;

use App\Domain\Authorization\Enums\RolePreset;
use App\Domain\Organization\Models\Business;
use App\Domain\Organization\Models\Membership;
use App\Domain\Outlet\Models\Outlet;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OutletAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_has_business_wide_outlet_access(): void
    {
        $owner = User::factory()->create();
        $business = Business::factory()->create();
        Membership::factory()->forBusiness($business)->forUser($owner)->role(RolePreset::Owner)->create();
        $outlet = Outlet::factory()->for($business)->create();

        $this->actingAs($owner)
            ->getJson("/api/v1/outlets/{$outlet->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $outlet->id);
    }

    public function test_member_without_outlet_access_cannot_view_outlet(): void
    {
        $business = Business::factory()->create();
        $outlet = Outlet::factory()->for($business)->create();
        $staff = User::factory()->create();
        Membership::factory()->forBusiness($business)->forUser($staff)->role(RolePreset::Staff)->create();

        $this->actingAs($staff)
            ->getJson("/api/v1/outlets/{$outlet->id}")
            ->assertNotFound();
    }

    public function test_member_with_outlet_access_can_view_outlet(): void
    {
        $business = Business::factory()->create();
        $outlet = Outlet::factory()->for($business)->create();
        $staff = User::factory()->create();

        $membership = Membership::factory()
            ->forBusiness($business)
            ->forUser($staff)
            ->role(RolePreset::Staff)
            ->create();
        $membership->outlets()->attach($outlet->id);

        $this->actingAs($staff)
            ->getJson("/api/v1/outlets/{$outlet->id}")
            ->assertOk();
    }

    public function test_owner_can_create_and_list_outlets(): void
    {
        $owner = User::factory()->create();
        $business = Business::factory()->create();
        Membership::factory()->forBusiness($business)->forUser($owner)->role(RolePreset::Owner)->create();

        $this->actingAs($owner)
            ->postJson("/api/v1/businesses/{$business->id}/outlets", ['name' => 'Cabang Dua'])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Cabang Dua');

        $this->actingAs($owner)
            ->getJson("/api/v1/businesses/{$business->id}/outlets")
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_member_without_outlets_permission_cannot_list_outlets(): void
    {
        $business = Business::factory()->create();
        $outlet = Outlet::factory()->for($business)->create();
        $kitchen = User::factory()->create();

        $membership = Membership::factory()
            ->forBusiness($business)
            ->forUser($kitchen)
            ->role(RolePreset::Kitchen)
            ->create();
        $membership->outlets()->attach($outlet->id);

        // Kitchen has outlets.read in the provisional catalog, so this should
        // succeed while a role without outlets.read (none in Phase 1) would not.
        $this->actingAs($kitchen)
            ->getJson("/api/v1/businesses/{$business->id}/outlets")
            ->assertOk();
    }
}
