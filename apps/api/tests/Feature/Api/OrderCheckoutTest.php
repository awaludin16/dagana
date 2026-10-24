<?php

namespace Tests\Feature\Api;

use App\Domain\Authorization\Enums\RolePreset;
use App\Domain\Catalog\Models\Menu;
use App\Domain\Organization\Models\Business;
use App\Domain\Organization\Models\Membership;
use App\Domain\Outlet\Models\Outlet;
use App\Domain\Payment\Models\Payment;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class OrderCheckoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_cash_checkout_uses_server_prices_and_records_snapshots(): void
    {
        [$owner, $business, $outlet] = $this->ownerWithOutlet();
        $menu = Menu::factory()->for($business)->create([
            'name' => 'Kopi Susu',
            'price' => 18000,
        ]);

        $response = $this->actingAs($owner)->postJson(
            "/api/v1/outlets/{$outlet->id}/orders",
            [
                'payment_method' => 'cash',
                'items' => [['menu_id' => $menu->id, 'quantity' => 2]],
                'total' => 1,
            ],
            ['Idempotency-Key' => 'checkout-cash-000001'],
        )
            ->assertCreated()
            ->assertJsonPath('data.status', 'PAID')
            ->assertJsonPath('data.total', 36000)
            ->assertJsonPath('data.items.0.name', 'Kopi Susu')
            ->assertJsonPath('data.items.0.unit_price', 18000)
            ->assertJsonPath('data.items.0.total', 36000)
            ->assertJsonPath('data.payment.status', 'PAID')
            ->assertJsonPath('data.payment.amount', 36000)
            ->assertJsonPath('data.payment.actor_user_id', $owner->id);

        $orderId = $response->json('data.id');
        $menu->update(['name' => 'Kopi Baru', 'price' => 25000]);

        $this->getJson("/api/v1/outlets/{$outlet->id}/orders/{$orderId}")
            ->assertOk()
            ->assertJsonPath('data.items.0.name', 'Kopi Susu')
            ->assertJsonPath('data.items.0.unit_price', 18000)
            ->assertJsonPath('data.total', 36000);
    }

    public function test_non_cash_payment_stays_pending_until_authorized_confirmation(): void
    {
        [$owner, $business, $outlet] = $this->ownerWithOutlet();
        $menu = Menu::factory()->for($business)->create(['price' => 12000]);

        $orderResponse = $this->actingAs($owner)->postJson(
            "/api/v1/outlets/{$outlet->id}/orders",
            [
                'payment_method' => 'bank_transfer',
                'status' => 'PAID',
                'amount' => 1,
                'items' => [['menu_id' => $menu->id, 'quantity' => 1]],
            ],
            ['Idempotency-Key' => 'checkout-transfer-0001'],
        )->assertCreated()
            ->assertJsonPath('data.status', 'PENDING_PAYMENT')
            ->assertJsonPath('data.payment.status', 'PENDING')
            ->assertJsonPath('data.payment.amount', 12000)
            ->assertJsonPath('data.payment.paid_at', null);

        $orderId = $orderResponse->json('data.id');
        $confirmed = $this->postJson("/api/v1/outlets/{$outlet->id}/orders/{$orderId}/confirm-payment", [
            'reference' => 'bank-transfer-ref-1',
        ])->assertOk()
            ->assertJsonPath('data.status', 'PAID')
            ->assertJsonPath('data.payment.status', 'PAID')
            ->assertJsonPath('data.payment.reference', 'bank-transfer-ref-1')
            ->assertJsonPath('data.payment.confirmed_by_user_id', $owner->id);
        $this->assertNotNull($confirmed->json('data.payment.paid_at'));

        $this->postJson("/api/v1/outlets/{$outlet->id}/orders/{$orderId}/confirm-payment")
            ->assertOk()
            ->assertJsonPath('data.payment.status', 'PAID');
    }

    public function test_checkout_rejects_unavailable_or_inactive_menus_and_invalid_quantities(): void
    {
        [$owner, $business, $outlet] = $this->ownerWithOutlet();
        $unavailable = Menu::factory()->for($business)->create(['is_available' => false]);
        $disabled = Menu::factory()->for($business)->create(['status' => Menu::STATUS_DISABLED]);

        foreach ([$unavailable, $disabled] as $index => $menu) {
            $this->actingAs($owner)->postJson(
                "/api/v1/outlets/{$outlet->id}/orders",
                [
                    'payment_method' => 'cash',
                    'items' => [['menu_id' => $menu->id, 'quantity' => 1]],
                ],
                ['Idempotency-Key' => 'invalid-menu-key-000'.$index],
            )->assertUnprocessable()
                ->assertJsonValidationErrors('items.0.menu_id');
        }

        $this->postJson(
            "/api/v1/outlets/{$outlet->id}/orders",
            ['payment_method' => 'cash', 'items' => [['menu_id' => $unavailable->id, 'quantity' => 0]]],
            ['Idempotency-Key' => 'invalid-quantity-0001'],
        )->assertUnprocessable()->assertJsonValidationErrors('items.0.quantity');

        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('payments', 0);
    }

    public function test_same_idempotency_key_replays_one_order_and_rejects_different_input(): void
    {
        [$owner, $business, $outlet] = $this->ownerWithOutlet();
        $menu = Menu::factory()->for($business)->create(['price' => 10000]);
        $payload = [
            'payment_method' => 'cash',
            'items' => [['menu_id' => $menu->id, 'quantity' => 1]],
        ];
        $headers = ['Idempotency-Key' => 'same-checkout-key-00001'];

        $this->actingAs($owner)->postJson("/api/v1/outlets/{$outlet->id}/orders", $payload, $headers)
            ->assertCreated();
        $menu->update(['price' => 20000]);
        $this->postJson("/api/v1/outlets/{$outlet->id}/orders", $payload, $headers)
            ->assertOk()
            ->assertJsonPath('data.total', 10000);
        $this->postJson("/api/v1/outlets/{$outlet->id}/orders", [
            ...$payload,
            'items' => [['menu_id' => $menu->id, 'quantity' => 2]],
        ], $headers)->assertConflict();

        $this->assertDatabaseCount('orders', 1);
        $this->assertDatabaseCount('payments', 1);
    }

    public function test_database_unique_key_rejects_duplicate_checkout_key(): void
    {
        [$owner, $business, $outlet] = $this->ownerWithOutlet();
        $menu = Menu::factory()->for($business)->create();
        $key = 'race-checkout-key-00001';
        $this->actingAs($owner)->postJson(
            "/api/v1/outlets/{$outlet->id}/orders",
            [
                'payment_method' => 'cash',
                'items' => [['menu_id' => $menu->id, 'quantity' => 1]],
            ],
            ['Idempotency-Key' => $key],
        )->assertCreated();

        try {
            DB::table('orders')->insert([
                'business_id' => $business->id,
                'outlet_id' => $outlet->id,
                'actor_user_id' => $owner->id,
                'source' => 'POS',
                'status' => 'PAID',
                'idempotency_key' => $key,
                'request_hash' => str_repeat('a', 64),
                'total' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $this->fail('The database must reject a duplicate idempotency key.');
        } catch (QueryException) {
            $this->assertDatabaseCount('orders', 1);
        }
    }

    public function test_payment_write_failure_rolls_back_order_and_items(): void
    {
        [$owner, $business, $outlet] = $this->ownerWithOutlet();
        $menu = Menu::factory()->for($business)->create();
        Event::listen('eloquent.creating: '.Payment::class, static function (): void {
            throw new \RuntimeException('Simulated payment persistence failure.');
        });
        $this->withoutExceptionHandling();

        try {
            $this->actingAs($owner)->postJson(
                "/api/v1/outlets/{$outlet->id}/orders",
                [
                    'payment_method' => 'cash',
                    'items' => [['menu_id' => $menu->id, 'quantity' => 1]],
                ],
                ['Idempotency-Key' => 'rollback-checkout-00001'],
            );
            $this->fail('Checkout should fail when payment cannot be persisted.');
        } catch (\RuntimeException $exception) {
            $this->assertSame('Simulated payment persistence failure.', $exception->getMessage());
        }

        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('order_items', 0);
        $this->assertDatabaseCount('payments', 0);
    }

    public function test_checkout_requires_permissions_and_outlet_access(): void
    {
        [$owner, $business, $outlet] = $this->ownerWithOutlet();
        $menu = Menu::factory()->for($business)->create();
        $staff = User::factory()->create();
        Membership::factory()
            ->forBusiness($business)
            ->forUser($staff)
            ->role(RolePreset::Staff)
            ->create();

        $this->actingAs($staff)->postJson(
            "/api/v1/outlets/{$outlet->id}/orders",
            [
                'payment_method' => 'cash',
                'items' => [['menu_id' => $menu->id, 'quantity' => 1]],
            ],
            ['Idempotency-Key' => 'permission-denied-0001'],
        )->assertNotFound();

        $foreignBusiness = Business::factory()->create();
        $foreignOutlet = Outlet::factory()->for($foreignBusiness)->create();
        $this->actingAs($owner)->getJson("/api/v1/outlets/{$foreignOutlet->id}/orders")
            ->assertNotFound();

        $this->assertDatabaseCount('orders', 0);
    }

    public function test_foreign_business_menu_and_ungranted_payment_confirmation_are_rejected(): void
    {
        [$owner, $business, $outlet] = $this->ownerWithOutlet();
        $foreignBusiness = Business::factory()->create();
        $foreignMenu = Menu::factory()->for($foreignBusiness)->create();

        $this->actingAs($owner)->postJson(
            "/api/v1/outlets/{$outlet->id}/orders",
            [
                'payment_method' => 'cash',
                'items' => [['menu_id' => $foreignMenu->id, 'quantity' => 1]],
            ],
            ['Idempotency-Key' => 'foreign-menu-checkout-001'],
        )->assertUnprocessable()->assertJsonValidationErrors('items');

        $menu = Menu::factory()->for($business)->create();
        $orderId = $this->postJson(
            "/api/v1/outlets/{$outlet->id}/orders",
            [
                'payment_method' => 'qr_payment',
                'items' => [['menu_id' => $menu->id, 'quantity' => 1]],
            ],
            ['Idempotency-Key' => 'pending-payment-checkout-1'],
        )->assertCreated()->json('data.id');

        $cashier = User::factory()->create();
        $membership = Membership::factory()
            ->forBusiness($business)
            ->forUser($cashier)
            ->role(RolePreset::Cashier)
            ->create();
        $membership->outlets()->attach($outlet);
        $membership->permissionOverrides()->create([
            'permission' => 'payments.create',
            'effect' => 'deny',
        ]);

        $this->actingAs($cashier)
            ->postJson("/api/v1/outlets/{$outlet->id}/orders/{$orderId}/confirm-payment")
            ->assertNotFound();
        $this->assertDatabaseHas('payments', [
            'order_id' => $orderId,
            'status' => 'PENDING',
            'confirmed_by_user_id' => null,
        ]);
    }

    public function test_pending_payment_can_be_confirmed_after_outlet_is_disabled(): void
    {
        [$owner, $business, $outlet] = $this->ownerWithOutlet();
        $menu = Menu::factory()->for($business)->create();
        $orderId = $this->actingAs($owner)->postJson(
            "/api/v1/outlets/{$outlet->id}/orders",
            [
                'payment_method' => 'qr_payment',
                'items' => [['menu_id' => $menu->id, 'quantity' => 1]],
            ],
            ['Idempotency-Key' => 'disable-outlet-pending-01'],
        )->assertCreated()->json('data.id');

        $this->postJson("/api/v1/outlets/{$outlet->id}/disable")->assertOk();
        $this->postJson(
            "/api/v1/outlets/{$outlet->id}/orders",
            [
                'payment_method' => 'cash',
                'items' => [['menu_id' => $menu->id, 'quantity' => 1]],
            ],
            ['Idempotency-Key' => 'disabled-outlet-order-01'],
        )->assertNotFound();
        $this->postJson("/api/v1/outlets/{$outlet->id}/orders/{$orderId}/confirm-payment")
            ->assertOk()
            ->assertJsonPath('data.payment.status', 'PAID');
    }

    public function test_order_history_is_paginated_and_scoped_to_outlet(): void
    {
        [$owner, $business, $outlet] = $this->ownerWithOutlet();
        $menu = Menu::factory()->for($business)->create();

        foreach (['history-order-00001', 'history-order-00002', 'history-order-00003'] as $key) {
            $this->actingAs($owner)->postJson(
                "/api/v1/outlets/{$outlet->id}/orders",
                [
                    'payment_method' => 'cash',
                    'items' => [['menu_id' => $menu->id, 'quantity' => 1]],
                ],
                ['Idempotency-Key' => $key],
            )->assertCreated();
        }

        $this->getJson("/api/v1/outlets/{$outlet->id}/orders?per_page=2")
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.total', 3)
            ->assertJsonPath('meta.per_page', 2)
            ->assertJsonStructure(['data' => [['number', 'items', 'payment']]]);
        $this->getJson("/api/v1/outlets/{$outlet->id}/orders?per_page=101")
            ->assertUnprocessable()
            ->assertJsonValidationErrors('per_page');
    }

    /**
     * @return array{User, Business, Outlet}
     */
    private function ownerWithOutlet(): array
    {
        $owner = User::factory()->create();
        $business = Business::factory()->create();
        Membership::factory()
            ->forBusiness($business)
            ->forUser($owner)
            ->role(RolePreset::Owner)
            ->create();
        $outlet = Outlet::factory()->for($business)->create();

        return [$owner, $business, $outlet];
    }
}
