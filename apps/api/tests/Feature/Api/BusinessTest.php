<?php

namespace Tests\Feature\Api;

use App\Domain\Authorization\Enums\RolePreset;
use App\Domain\Organization\Models\Business;
use App\Domain\Organization\Models\Membership;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BusinessTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_creates_business_with_owner_membership_and_first_outlet(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/v1/businesses', [
            'name' => 'Warung Kopi',
            'outlet' => [
                'name' => 'Cabang Utama',
                'address' => 'Jl. Merdeka 1',
            ],
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'Warung Kopi')
            ->assertJsonPath('data.outlets.0.name', 'Cabang Utama');

        $businessId = $response->json('data.id');

        $this->assertDatabaseHas('memberships', [
            'business_id' => $businessId,
            'user_id' => $user->id,
            'role' => RolePreset::Owner->value,
            'status' => Membership::STATUS_ACTIVE,
        ]);

        $this->assertDatabaseHas('outlets', [
            'business_id' => $businessId,
            'name' => 'Cabang Utama',
        ]);
    }

    public function test_business_can_be_created_without_first_outlet(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/v1/businesses', [
            'name' => 'Tanpa Outlet',
        ]);

        $response->assertCreated()->assertJsonPath('data.name', 'Tanpa Outlet');

        $this->assertDatabaseCount('outlets', 0);
    }

    public function test_business_name_is_required(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/v1/businesses', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors('name');
    }

    public function test_owner_can_update_business_settings(): void
    {
        $business = Business::factory()->create();
        $owner = User::factory()->create();
        Membership::factory()->forBusiness($business)->forUser($owner)->role(RolePreset::Owner)->create();

        $this->actingAs($owner)
            ->patchJson("/api/v1/businesses/{$business->id}", ['name' => 'Nama Baru'])
            ->assertOk()
            ->assertJsonPath('data.name', 'Nama Baru');

        $this->assertDatabaseHas('businesses', ['id' => $business->id, 'name' => 'Nama Baru']);
    }

    public function test_member_without_settings_permission_cannot_update_business(): void
    {
        $business = Business::factory()->create();
        $cashier = User::factory()->create();
        Membership::factory()->forBusiness($business)->forUser($cashier)->role(RolePreset::Cashier)->create();

        $this->actingAs($cashier)
            ->patchJson("/api/v1/businesses/{$business->id}", ['name' => 'Ditolak'])
            ->assertForbidden();

        $this->assertDatabaseMissing('businesses', ['id' => $business->id, 'name' => 'Ditolak']);
    }
}
