<?php

namespace Tests\Feature\Api\V1;

use App\Models\Business;
use App\Models\BusinessMembership;
use App\Models\InventoryItem;
use App\Models\Order;
use App\Models\Outlet;
use App\Models\Product;
use App\Models\ProductOutletAvailability;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OutletManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_create_an_outlet_with_village_address(): void
    {
        [$owner, $business] = $this->merchant();

        Sanctum::actingAs($owner);

        $response = $this->postJson('/api/v1/outlets', [
            'name' => 'Outlet Cabang',
            'phone' => '081234567890',
            'address' => [
                'street' => 'Jl. Cabang No. 2',
                'village' => 'Desa Cabang',
                'district' => 'Kecamatan Cabang',
                'regency' => 'Kota Cabang',
                'province' => 'PROVINSI CABANG',
                'postal_code' => '54321',
            ],
            'business_id' => 999,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.business_id', $business->id)
            ->assertJsonPath('data.name', 'Outlet Cabang')
            ->assertJsonPath('data.address.village', 'Desa Cabang');

        $this->assertDatabaseHas('outlets', [
            'business_id' => $business->id,
            'name' => 'Outlet Cabang',
            'village' => 'Desa Cabang',
        ]);
    }

    public function test_owner_can_delete_an_outlet_when_more_than_one_remains(): void
    {
        [$owner, $business] = $this->merchant();
        $second = Outlet::factory()->for($business)->create();

        Sanctum::actingAs($owner);

        $this->deleteJson("/api/v1/outlets/{$second->id}")->assertNoContent();

        $this->assertDatabaseMissing('outlets', ['id' => $second->id]);
        $this->assertDatabaseCount('outlets', 1);
    }

    public function test_outlet_with_product_availability_override_can_be_deleted(): void
    {
        [$owner, $business] = $this->merchant();
        $second = Outlet::factory()->for($business)->create();
        $product = Product::factory()->for($business)->create();

        $this->assertDatabaseHas('outlets', ['id' => $second->id]);

        ProductOutletAvailability::create([
            'product_id' => $product->id,
            'outlet_id' => $second->id,
            'is_available' => false,
        ]);

        Sanctum::actingAs($owner);

        $this->deleteJson("/api/v1/outlets/{$second->id}")->assertNoContent();

        $this->assertDatabaseMissing('outlets', ['id' => $second->id]);
        $this->assertDatabaseMissing('product_outlet_availabilities', ['outlet_id' => $second->id]);
    }

    public function test_outlet_store_requires_phone_and_full_address(): void
    {
        [$owner] = $this->merchant();

        Sanctum::actingAs($owner);

        $this->postJson('/api/v1/outlets', ['name' => 'Outlet Cabang'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'phone',
                'address.street',
                'address.village',
                'address.district',
                'address.regency',
                'address.province',
                'address.postal_code',
            ]);

        $this->assertDatabaseCount('outlets', 1);
    }

    public function test_outlet_phone_is_normalized_and_must_be_10_to_13_digits(): void
    {
        [$owner, , $outlet] = $this->merchant();

        Sanctum::actingAs($owner);

        $address = [
            'street' => 'Jl. Cabang No. 2',
            'village' => 'Desa Cabang',
            'district' => 'Kecamatan Cabang',
            'regency' => 'Kota Cabang',
            'province' => 'PROVINSI CABANG',
            'postal_code' => '54321',
        ];

        foreach (['081234567', '08123456789012', 'telepon'] as $phone) {
            $this->postJson('/api/v1/outlets', [
                'name' => 'Outlet Cabang',
                'phone' => $phone,
                'address' => $address,
                'business_id' => 999,
            ])
                ->assertUnprocessable()
                ->assertJsonValidationErrors('phone');
        }

        $this->postJson('/api/v1/outlets', [
            'name' => 'Outlet Cabang',
            'phone' => '0812-3456-789',
            'address' => $address,
            'business_id' => 999,
        ])
            ->assertCreated();

        $this->assertDatabaseHas('outlets', ['phone' => '08123456789']);

        $this->patchJson("/api/v1/outlets/{$outlet->id}", ['phone' => '081'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('phone');

        $this->assertDatabaseCount('outlets', 2);
    }

    public function test_outlet_update_cannot_clear_phone_or_send_partial_address(): void
    {
        [$owner, , $outlet] = $this->merchant();

        Sanctum::actingAs($owner);

        $this->patchJson("/api/v1/outlets/{$outlet->id}", ['phone' => ''])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('phone');

        $this->patchJson("/api/v1/outlets/{$outlet->id}", [
            'address' => ['street' => 'Jl. Setengah Alamat'],
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'address.village',
                'address.district',
                'address.regency',
                'address.province',
                'address.postal_code',
            ]);

        $this->assertDatabaseHas('outlets', [
            'id' => $outlet->id,
            'phone' => $outlet->phone,
            'street' => $outlet->street,
        ]);
    }

    public function test_last_outlet_cannot_be_deleted(): void
    {
        [$owner, , $outlet] = $this->merchant();

        Sanctum::actingAs($owner);

        $this->deleteJson("/api/v1/outlets/{$outlet->id}")
            ->assertUnprocessable()
            ->assertJsonValidationErrors('outlet');

        $this->assertDatabaseHas('outlets', ['id' => $outlet->id]);
    }

    public function test_outlet_with_order_history_cannot_be_deleted(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        $second = Outlet::factory()->for($business)->create();
        Order::factory()->for($business)->create(['outlet_id' => $second->id]);

        Sanctum::actingAs($owner);

        $this->deleteJson("/api/v1/outlets/{$second->id}")
            ->assertUnprocessable()
            ->assertJsonValidationErrors('outlet');

        $this->assertDatabaseHas('outlets', ['id' => $second->id]);
    }

    public function test_outlet_with_inventory_history_cannot_be_deleted(): void
    {
        [$owner, $business] = $this->merchant();
        $second = Outlet::factory()->for($business)->create();
        InventoryItem::factory()->for($business)->create(['outlet_id' => $second->id]);

        Sanctum::actingAs($owner);

        $this->deleteJson("/api/v1/outlets/{$second->id}")
            ->assertUnprocessable()
            ->assertJsonValidationErrors('outlet');

        $this->assertDatabaseHas('outlets', ['id' => $second->id]);
    }

    public function test_outlet_delete_is_scoped_to_the_authenticated_business(): void
    {
        [$owner] = $this->merchant();
        [, , $foreignOutlet] = $this->merchant();

        Sanctum::actingAs($owner);

        $this->deleteJson("/api/v1/outlets/{$foreignOutlet->id}")->assertNotFound();

        $this->assertDatabaseHas('outlets', ['id' => $foreignOutlet->id]);
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
}
