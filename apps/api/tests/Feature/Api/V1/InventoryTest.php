<?php

namespace Tests\Feature\Api\V1;

use App\Models\Business;
use App\Models\BusinessMembership;
use App\Models\Order;
use App\Models\Outlet;
use App\Models\OutletAccess;
use App\Models\Payment;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Phase 6 — Basic Inventory: item, saldo dari ledger, adjustment, low stock,
 * retry/idempotency, isolasi business/outlet, dan penjualan tanpa inventory.
 */
class InventoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_create_item_and_stock_starts_at_zero(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        Sanctum::actingAs($owner);

        $response = $this->postJson('/api/v1/inventory', [
            'outlet_id' => $outlet->id,
            'name' => 'Coffee Bean',
            'unit' => 'g',
            'low_stock_threshold' => 100,
            'business_id' => 999, // client-supplied scope harus diabaikan
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.business_id', $business->id)
            ->assertJsonPath('data.outlet_id', $outlet->id)
            ->assertJsonPath('data.current_stock', 0)
            ->assertJsonPath('data.is_low_stock', true)
            ->assertJsonPath('data.is_active', true);

        $this->assertDatabaseHas('inventory_items', [
            'business_id' => $business->id,
            'outlet_id' => $outlet->id,
            'name' => 'Coffee Bean',
            'unit' => 'g',
            'low_stock_threshold' => 100,
        ]);
    }

    public function test_adjustment_writes_signed_ledger_and_balance_is_reconciled(): void
    {
        [$owner, , $outlet] = $this->merchant();
        Sanctum::actingAs($owner);

        $itemId = $this->createItem($outlet->id, 'Milk', 'ml', 20);

        $created = $this->postJson("/api/v1/inventory/{$itemId}/adjustments", [
            'quantity_change' => 1000,
            'reason' => 'Stok awal',
            'idempotency_key' => fake()->uuid(),
        ])->assertCreated()
            ->assertJsonPath('data.type', StockMovement::TYPE_ADJUSTMENT)
            ->assertJsonPath('data.quantity_change', 1000)
            ->assertJsonPath('data.reason', 'Stok awal')
            ->assertJsonPath('data.membership_id', $this->membershipId($owner));

        $this->assertNotNull($created->json('data.created_at'));

        $this->postJson("/api/v1/inventory/{$itemId}/adjustments", [
            'quantity_change' => -250,
            'reason' => 'Pemakaian produksi',
            'idempotency_key' => fake()->uuid(),
        ])->assertCreated()->assertJsonPath('data.quantity_change', -250);

        // Saldo = 1000 - 250 = 750, dapat direkonsiliasi dari ledger.
        $this->getJson("/api/v1/inventory/{$itemId}")
            ->assertOk()
            ->assertJsonPath('data.current_stock', 750)
            ->assertJsonPath('data.is_low_stock', false);

        $this->getJson("/api/v1/inventory/{$itemId}/movements?per_page=10")
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.quantity_change', -250)
            ->assertJsonPath('data.1.quantity_change', 1000);

        $this->assertSame(
            750,
            (int) DB::table('stock_movements')->where('inventory_item_id', $itemId)->sum('quantity_change'),
        );
    }

    public function test_low_stock_uses_stored_threshold_and_filter(): void
    {
        [$owner, , $outlet] = $this->merchant();
        Sanctum::actingAs($owner);

        $low = $this->createItem($outlet->id, 'Sugar', 'g', 10);
        $safe = $this->createItem($outlet->id, 'Cup', 'pcs', 10);
        $untracked = $this->createItem($outlet->id, 'Napkin', 'pcs', null);

        $this->adjust($low, 10);
        $this->adjust($safe, 11);

        // 10 <= 10 dianggap low; item tanpa threshold tidak pernah low.
        $this->getJson('/api/v1/inventory?low_stock=true')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $low)
            ->assertJsonPath('data.0.is_low_stock', true);

        $this->getJson("/api/v1/inventory/{$untracked}")
            ->assertOk()
            ->assertJsonPath('data.low_stock_threshold', null)
            ->assertJsonPath('data.is_low_stock', false);

        $this->patchJson("/api/v1/inventory/{$low}", ['low_stock_threshold' => 5])
            ->assertOk()
            ->assertJsonPath('data.is_low_stock', false);

        $this->getJson('/api/v1/inventory?low_stock=true')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_adjustment_rejects_negative_balance_zero_quantity_and_missing_reason(): void
    {
        [$owner, , $outlet] = $this->merchant();
        Sanctum::actingAs($owner);

        $itemId = $this->createItem($outlet->id);

        $this->postJson("/api/v1/inventory/{$itemId}/adjustments", [
            'quantity_change' => -1,
            'reason' => 'Coba keluar',
            'idempotency_key' => fake()->uuid(),
        ])->assertUnprocessable()->assertJsonValidationErrors(['quantity_change']);

        $this->adjust($itemId, 5);

        $this->postJson("/api/v1/inventory/{$itemId}/adjustments", [
            'quantity_change' => -6,
            'reason' => 'Melebihi saldo',
            'idempotency_key' => fake()->uuid(),
        ])->assertUnprocessable()->assertJsonValidationErrors(['quantity_change']);

        $this->postJson("/api/v1/inventory/{$itemId}/adjustments", [
            'quantity_change' => 0,
            'reason' => 'Nol',
            'idempotency_key' => fake()->uuid(),
        ])->assertUnprocessable()->assertJsonValidationErrors(['quantity_change']);

        $this->postJson("/api/v1/inventory/{$itemId}/adjustments", [
            'quantity_change' => 1,
            'idempotency_key' => fake()->uuid(),
        ])->assertUnprocessable()->assertJsonValidationErrors(['reason']);

        $this->postJson("/api/v1/inventory/{$itemId}/adjustments", [
            'quantity_change' => 1,
            'reason' => 'Key tidak valid',
            'idempotency_key' => 'not-a-uuid',
        ])->assertUnprocessable()->assertJsonValidationErrors(['idempotency_key']);

        $this->getJson("/api/v1/inventory/{$itemId}")
            ->assertOk()
            ->assertJsonPath('data.current_stock', 5);
        $this->assertDatabaseCount('stock_movements', 1);
    }

    public function test_retry_with_same_idempotency_key_is_replayed_without_duplicate(): void
    {
        [$owner, , $outlet] = $this->merchant();
        Sanctum::actingAs($owner);

        $itemId = $this->createItem($outlet->id);
        $otherItemId = $this->createItem($outlet->id, 'Other Item');
        $key = fake()->uuid();

        $first = $this->postJson("/api/v1/inventory/{$itemId}/adjustments", [
            'quantity_change' => 12,
            'reason' => 'Restock',
            'idempotency_key' => $key,
        ])->assertCreated();

        $second = $this->postJson("/api/v1/inventory/{$itemId}/adjustments", [
            'quantity_change' => 12,
            'reason' => 'Restock',
            'idempotency_key' => $key,
        ])->assertOk();

        $this->assertSame($first->json('data.id'), $second->json('data.id'));
        $this->assertDatabaseCount('stock_movements', 1);
        $this->getJson("/api/v1/inventory/{$itemId}")
            ->assertOk()
            ->assertJsonPath('data.current_stock', 12);

        // Key yang sama tidak boleh diam-diam dipakai untuk item lain.
        $this->postJson("/api/v1/inventory/{$otherItemId}/adjustments", [
            'quantity_change' => 3,
            'reason' => 'Restock',
            'idempotency_key' => $key,
        ])->assertUnprocessable()->assertJsonValidationErrors(['idempotency_key']);

        $this->assertDatabaseCount('stock_movements', 1);
    }

    public function test_database_unique_constraint_blocks_duplicate_movement_key(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        Sanctum::actingAs($owner);

        $itemId = $this->createItem($outlet->id);
        $key = fake()->uuid();
        $this->adjust($itemId, 1, $key);

        $this->expectException(UniqueConstraintViolationException::class);

        // Penulisan mentah mensimulasikan dua request yang lolos pengecekan
        // awal: proteksi terakhir adalah unique index database.
        DB::table('stock_movements')->insert([
            'business_id' => $business->id,
            'outlet_id' => $outlet->id,
            'inventory_item_id' => $itemId,
            'membership_id' => $this->membershipId($owner),
            'type' => StockMovement::TYPE_ADJUSTMENT,
            'quantity_change' => 1,
            'reason' => 'Duplicate',
            'idempotency_key' => $key,
        ]);
    }

    public function test_inactive_item_rejects_new_adjustment_but_remains_readable(): void
    {
        [$owner, , $outlet] = $this->merchant();
        Sanctum::actingAs($owner);

        $itemId = $this->createItem($outlet->id);

        $this->patchJson("/api/v1/inventory/{$itemId}", ['is_active' => false])
            ->assertOk()
            ->assertJsonPath('data.is_active', false);

        $this->postJson("/api/v1/inventory/{$itemId}/adjustments", [
            'quantity_change' => 1,
            'reason' => 'Restock',
            'idempotency_key' => fake()->uuid(),
        ])->assertUnprocessable()->assertJsonValidationErrors(['item']);

        $this->getJson("/api/v1/inventory/{$itemId}")->assertOk();
        $this->getJson('/api/v1/inventory?is_active=true')->assertOk()->assertJsonCount(0, 'data');
        $this->getJson('/api/v1/inventory?is_active=false')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_unit_cannot_change_after_movements_exist(): void
    {
        [$owner, , $outlet] = $this->merchant();
        Sanctum::actingAs($owner);

        $itemId = $this->createItem($outlet->id, 'Flour', 'g');

        // Sebelum ada movement, koreksi unit masih aman.
        $this->patchJson("/api/v1/inventory/{$itemId}", ['unit' => 'kg'])
            ->assertOk()
            ->assertJsonPath('data.unit', 'kg');

        $this->adjust($itemId, 2);

        $this->patchJson("/api/v1/inventory/{$itemId}", ['unit' => 'g'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['unit']);

        $this->patchJson("/api/v1/inventory/{$itemId}", ['name' => 'Wheat Flour'])
            ->assertOk()
            ->assertJsonPath('data.unit', 'kg')
            ->assertJsonPath('data.name', 'Wheat Flour');
    }

    public function test_sales_continue_without_inventory_and_do_not_touch_stock(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        $product = Product::factory()->for($business)->create(['price' => 15_000]);
        Sanctum::actingAs($owner);

        $itemId = $this->createItem($outlet->id);

        $this->postJson('/api/v1/orders', [
            'outlet_id' => $outlet->id,
            'idempotency_key' => fake()->uuid(),
            'payment_method' => Payment::METHOD_CASH,
            'amount_tendered' => 15_000,
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ])->assertCreated()->assertJsonPath('data.status', Order::STATUS_PAID);

        // Mapping produk → bahan belum ditetapkan (Phase 12A), jadi penjualan
        // tidak boleh mengarang pengurangan stok.
        $this->assertDatabaseCount('stock_movements', 0);
        $this->getJson("/api/v1/inventory/{$itemId}")
            ->assertOk()
            ->assertJsonPath('data.current_stock', 0);
    }

    public function test_cashier_cannot_read_or_adjust_inventory(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        Sanctum::actingAs($owner);
        $itemId = $this->createItem($outlet->id);
        $cashier = $this->memberWithOutlet($business, $outlet, BusinessMembership::ROLE_CASHIER);

        Sanctum::actingAs($cashier);

        $this->getJson('/api/v1/inventory')->assertForbidden();
        $this->getJson("/api/v1/inventory/{$itemId}")->assertForbidden();
        $this->postJson("/api/v1/inventory/{$itemId}/adjustments", [
            'quantity_change' => 1,
            'reason' => 'Restock',
            'idempotency_key' => fake()->uuid(),
        ])->assertForbidden();
    }

    public function test_manager_without_outlet_access_cannot_read_or_adjust_item(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        $otherOutlet = Outlet::factory()->for($business)->create();
        Sanctum::actingAs($owner);
        $itemId = $this->createItem($outlet->id);
        $manager = $this->memberWithOutlet($business, $otherOutlet, BusinessMembership::ROLE_MANAGER);

        Sanctum::actingAs($manager);

        $this->getJson("/api/v1/inventory/{$itemId}")->assertForbidden();
        $this->getJson("/api/v1/inventory?outlet_id={$outlet->id}")->assertForbidden();
        $this->postJson("/api/v1/inventory/{$itemId}/adjustments", [
            'quantity_change' => 1,
            'reason' => 'Restock',
            'idempotency_key' => fake()->uuid(),
        ])->assertForbidden();

        // List tetap ter-scope ke outlet yang boleh diakses (kosong).
        $this->getJson('/api/v1/inventory')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_other_business_cannot_read_mutate_or_create_item(): void
    {
        [$owner, , $outlet] = $this->merchant();
        Sanctum::actingAs($owner);
        $itemId = $this->createItem($outlet->id);

        [$foreignOwner, , $foreignOutlet] = $this->merchant();
        Sanctum::actingAs($foreignOwner);

        $this->getJson("/api/v1/inventory/{$itemId}")->assertNotFound();
        $this->getJson("/api/v1/inventory/{$itemId}/movements")->assertNotFound();
        $this->patchJson("/api/v1/inventory/{$itemId}", ['name' => 'Hijack'])->assertNotFound();
        $this->postJson("/api/v1/inventory/{$itemId}/adjustments", [
            'quantity_change' => 1,
            'reason' => 'Hijack',
            'idempotency_key' => fake()->uuid(),
        ])->assertNotFound();

        $this->postJson('/api/v1/inventory', [
            'outlet_id' => $outlet->id,
            'name' => 'Foreign Item',
            'unit' => 'pcs',
        ])->assertUnprocessable()->assertJsonValidationErrors(['outlet_id']);

        $this->assertDatabaseMissing('inventory_items', ['name' => 'Foreign Item']);
        $this->assertDatabaseMissing('inventory_items', ['name' => 'Hijack']);

        // Outlet yang valid tetapi milik business lain tidak dapat dipakai.
        $this->postJson('/api/v1/inventory', [
            'outlet_id' => $foreignOutlet->id,
            'name' => 'Own Item',
            'unit' => 'pcs',
        ])->assertCreated();
    }

    public function test_list_is_scoped_and_paginated(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        $otherOutlet = Outlet::factory()->for($business)->create();
        Sanctum::actingAs($owner);
        $this->createItem($outlet->id, 'Alpha');
        $this->createItem($otherOutlet->id, 'Beta');

        [$foreignOwner, , $foreignOutlet] = $this->merchant();
        Sanctum::actingAs($foreignOwner);
        $this->createItem($foreignOutlet->id, 'Foreign');

        Sanctum::actingAs($owner);
        $this->getJson('/api/v1/inventory?per_page=10')
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $this->getJson('/api/v1/inventory?per_page=1')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.total', 2);

        $this->getJson("/api/v1/inventory?outlet_id={$outlet->id}&q=alph")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Alpha');
    }

    /**
     * @return array{0: User, 1: Business, 2: Outlet}
     */
    private function merchant(): array
    {
        $owner = User::factory()->create();
        $membership = BusinessMembership::factory()->for($owner)->create();
        $outlet = Outlet::factory()->for($membership->business)->create();

        return [$owner, $membership->business, $outlet];
    }

    private function memberWithOutlet(Business $business, Outlet $outlet, string $role): User
    {
        $user = User::factory()->create();
        $membership = BusinessMembership::factory()->for($user)->create([
            'business_id' => $business->id,
            'role' => $role,
        ]);
        OutletAccess::create(['membership_id' => $membership->id, 'outlet_id' => $outlet->id]);

        return $user;
    }

    private function membershipId(User $user): int
    {
        return BusinessMembership::query()->where('user_id', $user->id)->firstOrFail()->id;
    }

    private function createItem(
        int $outletId,
        string $name = 'Coffee Bean',
        string $unit = 'g',
        ?int $lowStockThreshold = null,
    ): int {
        $response = $this->postJson('/api/v1/inventory', [
            'outlet_id' => $outletId,
            'name' => $name,
            'unit' => $unit,
            'low_stock_threshold' => $lowStockThreshold,
        ]);

        return (int) $response->assertCreated()->json('data.id');
    }

    private function adjust(int $itemId, int $quantityChange, ?string $key = null): void
    {
        $this->postJson("/api/v1/inventory/{$itemId}/adjustments", [
            'quantity_change' => $quantityChange,
            'reason' => 'Test adjustment',
            'idempotency_key' => $key ?? fake()->uuid(),
        ])->assertCreated();
    }
}
