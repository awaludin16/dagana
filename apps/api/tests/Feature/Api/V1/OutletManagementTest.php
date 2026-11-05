<?php

namespace Tests\Feature\Api\V1;

use App\Models\Business;
use App\Models\BusinessMembership;
use App\Models\Outlet;
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

    public function test_last_outlet_cannot_be_deleted(): void
    {
        [$owner, , $outlet] = $this->merchant();

        Sanctum::actingAs($owner);

        $this->deleteJson("/api/v1/outlets/{$outlet->id}")
            ->assertUnprocessable()
            ->assertJsonValidationErrors('outlet');

        $this->assertDatabaseHas('outlets', ['id' => $outlet->id]);
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
