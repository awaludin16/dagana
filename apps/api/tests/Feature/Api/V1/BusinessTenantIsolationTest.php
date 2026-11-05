<?php

namespace Tests\Feature\Api\V1;

use App\Models\Business;
use App\Models\BusinessMembership;
use App\Models\Outlet;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BusinessTenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_cannot_read_or_update_another_business_or_outlet(): void
    {
        [$userA, $businessA, $outletA] = $this->merchant();
        [, $businessB, $outletB] = $this->merchant();

        Sanctum::actingAs($userA);

        $this->getJson("/api/v1/businesses/{$businessB->id}")->assertNotFound();
        $this->patchJson("/api/v1/businesses/{$businessB->id}", ['name' => 'Diambil Alih'])
            ->assertNotFound();
        $this->getJson("/api/v1/outlets/{$outletB->id}")->assertNotFound();
        $this->patchJson("/api/v1/outlets/{$outletB->id}", ['name' => 'Diambil Alih'])
            ->assertNotFound();

        $this->assertDatabaseHas('businesses', ['id' => $businessB->id, 'name' => $businessB->name]);
        $this->assertDatabaseHas('outlets', ['id' => $outletB->id, 'name' => $outletB->name]);

        $this->getJson("/api/v1/businesses/{$businessA->id}")->assertOk();
        $this->getJson("/api/v1/outlets/{$outletA->id}")->assertOk();
    }

    public function test_outlet_cannot_be_reassigned_to_another_business_via_payload(): void
    {
        [$user, $business, $outlet] = $this->merchant();
        [, $otherBusiness] = $this->merchant();

        Sanctum::actingAs($user);

        $this->patchJson("/api/v1/outlets/{$outlet->id}", [
            'name' => 'Outlet Tetap',
            'business_id' => $otherBusiness->id,
        ])
            ->assertOk()
            ->assertJsonPath('data.business_id', $business->id);

        $this->assertDatabaseHas('outlets', [
            'id' => $outlet->id,
            'business_id' => $business->id,
            'name' => 'Outlet Tetap',
        ]);
        $this->assertDatabaseHas('businesses', ['id' => $otherBusiness->id, 'name' => $otherBusiness->name]);
    }

    public function test_outlet_list_only_contains_outlets_of_the_authenticated_business(): void
    {
        [$userA, , $outletA] = $this->merchant();
        $this->merchant();

        Sanctum::actingAs($userA);

        $this->getJson('/api/v1/outlets')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $outletA->id);
    }

    public function test_business_and_outlet_settings_can_be_read_and_updated(): void
    {
        [$user, $business, $outlet] = $this->merchant();

        Sanctum::actingAs($user);

        $this->getJson("/api/v1/businesses/{$business->id}")
            ->assertOk()
            ->assertJsonPath('data.name', $business->name)
            ->assertJsonMissingPath('data.phone')
            ->assertJsonMissingPath('data.address');

        $this->patchJson("/api/v1/businesses/{$business->id}", [
            'name' => 'Warung Baru',
            'phone' => '0800000000',
            'address' => ['street' => 'Alamat yang tidak dipakai'],
        ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Warung Baru')
            ->assertJsonMissingPath('data.phone')
            ->assertJsonMissingPath('data.address');

        $this->getJson("/api/v1/outlets/{$outlet->id}")
            ->assertOk()
            ->assertJsonPath('data.name', $outlet->name);

        $this->patchJson("/api/v1/outlets/{$outlet->id}", [
            'name' => 'Outlet Cabang',
            'address' => [
                'street' => 'Jl. Cabang No. 3',
                'village' => 'Desa Cabang',
                'district' => 'Kecamatan Cabang',
                'regency' => 'Kota Cabang',
                'province' => 'PROVINSI CABANG',
                'postal_code' => '54321',
            ],
        ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Outlet Cabang')
            ->assertJsonPath('data.address.street', 'Jl. Cabang No. 3')
            ->assertJsonPath('data.address.village', 'Desa Cabang')
            ->assertJsonPath('data.address.regency', 'Kota Cabang');

        $this->assertDatabaseHas('businesses', [
            'id' => $business->id,
            'name' => 'Warung Baru',
        ]);
        $this->assertDatabaseHas('outlets', [
            'id' => $outlet->id,
            'name' => 'Outlet Cabang',
            'street' => 'Jl. Cabang No. 3',
            'village' => 'Desa Cabang',
            'district' => 'Kecamatan Cabang',
        ]);
    }

    public function test_invalid_settings_update_is_rejected_without_changing_data(): void
    {
        [$user, $business, $outlet] = $this->merchant();

        Sanctum::actingAs($user);

        $this->patchJson("/api/v1/businesses/{$business->id}", ['name' => ''])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('name');

        $this->patchJson("/api/v1/outlets/{$outlet->id}", ['name' => ''])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('name');

        $this->assertDatabaseHas('businesses', ['id' => $business->id, 'name' => $business->name]);
        $this->assertDatabaseHas('outlets', ['id' => $outlet->id, 'name' => $outlet->name]);
    }

    /**
     * @return array{User, Business, Outlet}
     */
    private function merchant(): array
    {
        $user = User::factory()->create();
        $membership = BusinessMembership::factory()->for($user)->create();
        $outlet = Outlet::factory()->for($membership->business)->create();

        return [$user, $membership->business, $outlet];
    }
}
