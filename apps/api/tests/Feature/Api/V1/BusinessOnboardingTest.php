<?php

namespace Tests\Feature\Api\V1;

use App\Domain\Business\Actions\CreateBusinessAction;
use App\Models\Business;
use App\Models\BusinessMembership;
use App\Models\Outlet;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BusinessOnboardingTest extends TestCase
{
    use RefreshDatabase;

    public function test_onboarding_creates_business_first_outlet_and_owner_membership(): void
    {
        $user = User::factory()->create();

        Sanctum::actingAs($user);

        $address = [
            'street' => 'Jl. Merdeka No. 1',
            'village' => 'Kelurahan Menteng',
            'district' => 'Kecamatan Menteng',
            'regency' => 'Jakarta Pusat',
            'province' => 'DKI JAKARTA',
            'postal_code' => '10310',
        ];

        $response = $this->postJson('/api/v1/businesses', [
            'business' => [
                'name' => 'Warung Budi',
            ],
            'outlet' => [
                'name' => 'Outlet Pusat',
                'phone' => '081298765432',
                'address' => $address,
            ],
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.business.name', 'Warung Budi')
            ->assertJsonPath('data.outlet.name', 'Outlet Pusat')
            ->assertJsonPath('data.outlet.phone', '081298765432')
            ->assertJsonPath('data.outlet.address.street', 'Jl. Merdeka No. 1')
            ->assertJsonPath('data.outlet.address.village', 'Kelurahan Menteng')
            ->assertJsonPath('data.outlet.address.district', 'Kecamatan Menteng')
            ->assertJsonPath('data.outlet.address.regency', 'Jakarta Pusat')
            ->assertJsonPath('data.outlet.address.province', 'DKI JAKARTA')
            ->assertJsonPath('data.outlet.address.postal_code', '10310')
            ->assertJsonStructure([
                'data' => [
                    'business' => ['id', 'name'],
                    'outlet' => ['id', 'business_id', 'name', 'phone', 'address' => [
                        'street', 'village', 'district', 'regency', 'province', 'postal_code',
                    ]],
                ],
            ]);

        $business = Business::sole();
        $outlet = Outlet::sole();
        $membership = BusinessMembership::sole();

        $this->assertSame('Warung Budi', $business->name);
        $this->assertSame($address, [
            'street' => $outlet->street,
            'village' => $outlet->village,
            'district' => $outlet->district,
            'regency' => $outlet->regency,
            'province' => $outlet->province,
            'postal_code' => $outlet->postal_code,
        ]);
        $this->assertSame($business->id, $outlet->business_id);
        $this->assertSame($business->id, $response->json('data.business.id'));
        $this->assertSame($outlet->id, $response->json('data.outlet.id'));
        $this->assertSame($user->id, $membership->user_id);
        $this->assertSame($business->id, $membership->business_id);
        $this->assertSame(BusinessMembership::ROLE_OWNER, $membership->role);
        $this->assertSame(BusinessMembership::STATUS_ACTIVE, $membership->status);
        $this->assertSame($business->id, $user->fresh()->business->id);
    }

    public function test_onboarding_ignores_business_phone_and_address_payloads(): void
    {
        $user = User::factory()->create();

        Sanctum::actingAs($user);

        $this->postJson('/api/v1/businesses', [
            'business' => [
                'name' => 'Warung Budi',
                'phone' => '0800000000',
                'address' => 'Alamat bisnis yang tidak boleh dipakai saat onboarding',
            ],
            'outlet' => [
                'name' => 'Outlet Pusat',
                'phone' => '081298765432',
                'address' => ['street' => 'Jl. Merdeka No. 1', 'village' => 'Menteng'],
            ],
        ])->assertCreated();

        $business = Business::sole();
        $outlet = Outlet::sole();

        $this->assertSame('Warung Budi', $business->name);
        $this->assertSame('081298765432', $outlet->phone);
        $this->assertSame('Jl. Merdeka No. 1', $outlet->street);
        $this->assertSame('Menteng', $outlet->village);
    }

    public function test_invalid_onboarding_leaves_no_partial_records(): void
    {
        $user = User::factory()->create();

        Sanctum::actingAs($user);

        $this->postJson('/api/v1/businesses', [
            'business' => ['name' => ''],
            'outlet' => ['name' => '', 'address' => ['street' => ['not-a-string']]],
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['business.name', 'outlet.name', 'outlet.address.street']);

        $this->assertDatabaseCount('businesses', 0);
        $this->assertDatabaseCount('outlets', 0);
        $this->assertDatabaseCount('business_memberships', 0);
    }

    public function test_user_cannot_create_a_second_business(): void
    {
        $user = User::factory()->create();

        Sanctum::actingAs($user);

        $payload = [
            'business' => ['name' => 'Warung Budi'],
            'outlet' => ['name' => 'Outlet Pusat'],
        ];

        $this->postJson('/api/v1/businesses', $payload)->assertCreated();

        $this->postJson('/api/v1/businesses', [
            'business' => ['name' => 'Warung Kedua'],
            'outlet' => ['name' => 'Outlet Kedua'],
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('business');

        $this->assertDatabaseCount('businesses', 1);
        $this->assertDatabaseCount('outlets', 1);
        $this->assertDatabaseCount('business_memberships', 1);
    }

    public function test_onboarding_rolls_back_when_membership_creation_fails(): void
    {
        $user = User::factory()->create();
        BusinessMembership::factory()->for($user)->create();

        try {
            app(CreateBusinessAction::class)->execute(
                $user,
                ['name' => 'Warung Kedua'],
                ['name' => 'Outlet Kedua'],
            );

            $this->fail('Expected the unique membership constraint to reject the second onboarding.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('business', $exception->errors());
        }

        $this->assertDatabaseCount('businesses', 1);
        $this->assertDatabaseCount('outlets', 0);
        $this->assertDatabaseCount('business_memberships', 1);
    }
}
