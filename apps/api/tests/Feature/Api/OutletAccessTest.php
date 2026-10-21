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
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.total', 1);
    }

    public function test_manager_can_access_an_outlet_they_create(): void
    {
        $manager = User::factory()->create();
        $business = Business::factory()->create();
        Membership::factory()
            ->forBusiness($business)
            ->forUser($manager)
            ->role(RolePreset::Manager)
            ->create();

        $created = $this->actingAs($manager)
            ->postJson("/api/v1/businesses/{$business->id}/outlets", ['name' => 'Cabang Baru'])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Cabang Baru')
            ->assertJsonPath('data.status', Outlet::STATUS_ACTIVE);

        $outletId = $created->json('data.id');
        $this->actingAs($manager)
            ->getJson("/api/v1/businesses/{$business->id}/outlets?status=all")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $outletId);

        $this->actingAs($manager)
            ->patchJson("/api/v1/outlets/{$outletId}", ['name' => 'Cabang Diperbarui'])
            ->assertOk()
            ->assertJsonPath('data.name', 'Cabang Diperbarui');
    }

    public function test_outlet_names_are_unique_per_business_after_trimming_and_case_normalization(): void
    {
        $owner = User::factory()->create();
        $business = Business::factory()->create();
        Membership::factory()
            ->forBusiness($business)
            ->forUser($owner)
            ->role(RolePreset::Owner)
            ->create();
        $outlet = Outlet::factory()->for($business)->create(['name' => 'Cabang Utama']);

        $this->actingAs($owner)
            ->postJson("/api/v1/businesses/{$business->id}/outlets", ['name' => ' cabang utama '])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('name');

        $this->actingAs($owner)
            ->patchJson("/api/v1/outlets/{$outlet->id}", ['name' => ' CABANG UTAMA '])
            ->assertOk()
            ->assertJsonPath('data.name', 'CABANG UTAMA');

        $anotherBusiness = Business::factory()->create();
        Membership::factory()
            ->forBusiness($anotherBusiness)
            ->forUser($owner)
            ->role(RolePreset::Owner)
            ->create();

        $this->actingAs($owner)
            ->postJson("/api/v1/businesses/{$anotherBusiness->id}/outlets", ['name' => 'Cabang Utama'])
            ->assertCreated();
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

        // Kitchen has outlets.read in the catalog, so listing succeeds while a
        // role without outlets.read would receive a 403.
        $this->actingAs($kitchen)
            ->getJson("/api/v1/businesses/{$business->id}/outlets")
            ->assertOk();
    }

    public function test_owner_can_disable_and_reenable_an_outlet_without_deleting_it(): void
    {
        $owner = User::factory()->create();
        $business = Business::factory()->create();
        Membership::factory()->forBusiness($business)->forUser($owner)->role(RolePreset::Owner)->create();
        $outlet = Outlet::factory()->for($business)->create();

        $this->actingAs($owner)
            ->postJson("/api/v1/outlets/{$outlet->id}/disable")
            ->assertOk()
            ->assertJsonPath('data.status', Outlet::STATUS_DISABLED);

        $this->actingAs($owner)
            ->getJson("/api/v1/businesses/{$business->id}/outlets")
            ->assertOk()
            ->assertJsonCount(0, 'data');

        $this->actingAs($owner)
            ->getJson("/api/v1/businesses/{$business->id}/outlets?status=all")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $outlet->id);

        $this->actingAs($owner)
            ->postJson("/api/v1/outlets/{$outlet->id}/enable")
            ->assertOk()
            ->assertJsonPath('data.status', Outlet::STATUS_ACTIVE);

        $this->assertDatabaseHas('outlets', ['id' => $outlet->id]);
    }

    public function test_outlet_listing_is_paginated_and_limited_to_assigned_outlets(): void
    {
        $business = Business::factory()->create();
        $first = Outlet::factory()->for($business)->create();
        Outlet::factory()->for($business)->create();
        $staff = User::factory()->create();
        $membership = Membership::factory()
            ->forBusiness($business)
            ->forUser($staff)
            ->role(RolePreset::Kitchen)
            ->create();
        $membership->outlets()->attach($first->id);

        $this->actingAs($staff)
            ->getJson("/api/v1/businesses/{$business->id}/outlets?per_page=1")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('meta.per_page', 1);
    }
}
