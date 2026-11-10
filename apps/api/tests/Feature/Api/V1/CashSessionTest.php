<?php

namespace Tests\Feature\Api\V1;

use App\Models\BusinessMembership;
use App\Models\CashMovement;
use App\Models\CashSession;
use App\Models\Order;
use App\Models\Outlet;
use App\Models\OutletAccess;
use App\Models\Payment;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Phase 5 — Cash Session: open (D-06/D-07), movement ledger, close/variance,
 * status invalid, permission, dan isolasi business/outlet.
 */
class CashSessionTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_open_session_with_opening_cash(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        Sanctum::actingAs($owner);

        $response = $this->postJson('/api/v1/cash-sessions', [
            'outlet_id' => $outlet->id,
            'opening_cash' => 500_000,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.status', CashSession::STATUS_OPEN)
            ->assertJsonPath('data.opening_cash', 500_000)
            ->assertJsonPath('data.expected_cash', 500_000)
            ->assertJsonPath('data.variance', null)
            ->assertJsonPath('data.operator_membership_id', $this->membershipId($owner));

        $this->assertDatabaseHas('cash_sessions', [
            'business_id' => $business->id,
            'outlet_id' => $outlet->id,
            'status' => CashSession::STATUS_OPEN,
            'opening_cash' => 500_000,
        ]);
    }

    public function test_opening_cash_negative_is_rejected(): void
    {
        [$owner, , $outlet] = $this->merchant();
        Sanctum::actingAs($owner);

        $this->postJson('/api/v1/cash-sessions', [
            'outlet_id' => $outlet->id,
            'opening_cash' => -1,
        ])->assertUnprocessable()->assertJsonValidationErrors(['opening_cash']);
    }

    public function test_same_operator_cannot_open_two_active_sessions_per_outlet(): void
    {
        [$owner, , $outlet] = $this->merchant();
        Sanctum::actingAs($owner);

        $this->postJson('/api/v1/cash-sessions', ['outlet_id' => $outlet->id, 'opening_cash' => 0])
            ->assertCreated();

        $this->postJson('/api/v1/cash-sessions', ['outlet_id' => $outlet->id, 'opening_cash' => 0])
            ->assertUnprocessable()->assertJsonValidationErrors(['outlet_id']);
    }

    public function test_database_unique_index_blocks_double_open_race(): void
    {
        // Proteksi lapisalandua: validasi action (test di atas) dan partial
        // unique index database (D-07). Index dites langsung dengan insert
        // mentah untuk membuktikan dua baris OPEN tidak mungkin lolos.
        [$owner, $business, $outlet] = $this->merchant();
        $membershipId = $this->membershipId($owner);

        CashSession::create([
            'business_id' => $business->id,
            'outlet_id' => $outlet->id,
            'operator_membership_id' => $membershipId,
            'status' => CashSession::STATUS_OPEN,
            'opening_cash' => 0,
            'opened_at' => now(),
        ]);

        $this->expectException(UniqueConstraintViolationException::class);

        DB::table('cash_sessions')->insert([
            'business_id' => $business->id,
            'outlet_id' => $outlet->id,
            'operator_membership_id' => $membershipId,
            'status' => CashSession::STATUS_OPEN,
            'opening_cash' => 0,
            'opened_at' => now(),
        ]);
    }

    public function test_two_operators_can_open_separate_sessions_on_same_outlet(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        $cashier = $this->cashierWithOutlet($business, $outlet);

        Sanctum::actingAs($owner);
        $this->postJson('/api/v1/cash-sessions', ['outlet_id' => $outlet->id, 'opening_cash' => 50_000])
            ->assertCreated();

        Sanctum::actingAs($cashier);
        $this->postJson('/api/v1/cash-sessions', ['outlet_id' => $outlet->id, 'opening_cash' => 25_000])
            ->assertCreated();

        $this->assertDatabaseCount('cash_sessions', 2);
    }

    public function test_same_operator_can_reopen_after_closing(): void
    {
        [$owner, , $outlet] = $this->merchant();
        Sanctum::actingAs($owner);

        $id = $this->postJson('/api/v1/cash-sessions', ['outlet_id' => $outlet->id, 'opening_cash' => 10_000])
            ->assertCreated()->json('data.id');

        $this->postJson("/api/v1/cash-sessions/{$id}/close", ['actual_cash' => 10_000])
            ->assertOk()->assertJsonPath('data.status', CashSession::STATUS_CLOSED);

        $this->postJson('/api/v1/cash-sessions', ['outlet_id' => $outlet->id, 'opening_cash' => 4_000])
            ->assertCreated();
    }

    public function test_movements_are_recorded_as_ledger_rows(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        Sanctum::actingAs($owner);

        $id = $this->openSession($outlet->id, 500_000);

        $this->postJson("/api/v1/cash-sessions/{$id}/movements", [
            'type' => CashMovement::TYPE_CASH_IN,
            'amount' => 100_000,
            'reason' => 'Modal tambahan',
        ])->assertCreated()->assertJsonPath('data.amount', 100_000);

        $this->postJson("/api/v1/cash-sessions/{$id}/movements", [
            'type' => CashMovement::TYPE_CASH_OUT,
            'amount' => 50_000,
            'reason' => 'Beli gas',
        ])->assertCreated()->assertJsonPath('data.amount', -50_000);

        $this->postJson("/api/v1/cash-sessions/{$id}/movements", [
            'type' => CashMovement::TYPE_ADJUSTMENT,
            'amount' => -5_000,
            'reason' => 'Koreksi hitung',
        ])->assertCreated()->assertJsonPath('data.amount', -5_000);

        $show = $this->getJson("/api/v1/cash-sessions/{$id}")->assertOk();
        // Expected = 500.000 + 100.000 - 50.000 - 5.000 = 545.000.
        $show->assertJsonPath('data.expected_cash', 545_000);

        $this->assertDatabaseHas('cash_movements', [
            'cash_session_id' => $id,
            'business_id' => $business->id,
            'type' => CashMovement::TYPE_CASH_IN,
            'amount' => 100_000,
        ]);
    }

    public function test_cash_sale_checkout_records_movement_on_operator_session(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        $product = Product::factory()->for($business)->create(['price' => 30_000]);
        Sanctum::actingAs($owner);

        $sessionId = $this->openSession($outlet->id, 0);
        $idempotencyKey = fake()->uuid();

        $order = $this->postJson('/api/v1/orders', [
            'outlet_id' => $outlet->id,
            'idempotency_key' => $idempotencyKey,
            'payment_method' => Payment::METHOD_CASH,
            'amount_tendered' => 30_000,
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ])->assertCreated()->assertJsonPath('data.status', Order::STATUS_PAID);

        $this->assertDatabaseHas('cash_movements', [
            'cash_session_id' => $sessionId,
            'type' => CashMovement::TYPE_CASH_SALE,
            'amount' => 30_000,
            'membership_id' => $this->membershipId($owner),
        ]);

        // Replay dengan idempotency key yang sama: order existing (200),
        // tidak menambah movement.
        $this->postJson('/api/v1/orders', [
            'outlet_id' => $outlet->id,
            'idempotency_key' => $idempotencyKey,
            'payment_method' => Payment::METHOD_CASH,
            'amount_tendered' => 30_000,
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ])->assertOk();

        $this->assertDatabaseCount('cash_movements', 1);
    }

    public function test_cash_checkout_without_session_succeeds_without_movement(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        $product = Product::factory()->for($business)->create(['price' => 10_000]);
        Sanctum::actingAs($owner);

        $this->postJson('/api/v1/orders', [
            'outlet_id' => $outlet->id,
            'idempotency_key' => fake()->uuid(),
            'payment_method' => Payment::METHOD_CASH,
            'amount_tendered' => 10_000,
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ])->assertCreated();

        $this->assertDatabaseCount('cash_movements', 0);
    }

    public function test_movement_on_closed_session_is_rejected(): void
    {
        [$owner, , $outlet] = $this->merchant();
        Sanctum::actingAs($owner);

        $id = $this->openSession($outlet->id, 0);
        $this->closeSession($id, 0, CashSession::STATUS_CLOSED);

        $this->postJson("/api/v1/cash-sessions/{$id}/movements", [
            'type' => CashMovement::TYPE_CASH_IN,
            'amount' => 1_000,
        ])->assertUnprocessable()->assertJsonValidationErrors(['status']);
    }

    public function test_invalid_movement_type_and_amount_rejected(): void
    {
        [$owner, , $outlet] = $this->merchant();
        Sanctum::actingAs($owner);

        $id = $this->openSession($outlet->id, 0);

        $this->postJson("/api/v1/cash-sessions/{$id}/movements", [
            'type' => CashMovement::TYPE_CASH_SALE, // hanya dibuat otomatis dari checkout
            'amount' => 5_000,
        ])->assertUnprocessable()->assertJsonValidationErrors(['type']);

        $this->postJson("/api/v1/cash-sessions/{$id}/movements", [
            'type' => CashMovement::TYPE_CASH_IN,
            'amount' => 0,
        ])->assertUnprocessable()->assertJsonValidationErrors(['amount']);

        $this->postJson("/api/v1/cash-sessions/{$id}/movements", [
            'type' => CashMovement::TYPE_CASH_OUT,
            'amount' => -10, // arah keluar tidak boleh dari tanda; type sudah menentukan
        ])->assertUnprocessable()->assertJsonValidationErrors(['amount']);
    }

    public function test_close_computes_variance_and_moves_session_to_closed(): void
    {
        [$owner, , $outlet] = $this->merchant();
        Sanctum::actingAs($owner);

        $id = $this->openSession($outlet->id, 500_000);
        $this->postJson("/api/v1/cash-sessions/{$id}/movements", [
            'type' => CashMovement::TYPE_CASH_IN, 'amount' => 100_000,
        ]);
        $this->postJson("/api/v1/cash-sessions/{$id}/movements", [
            'type' => CashMovement::TYPE_CASH_OUT, 'amount' => 50_000,
        ]);

        // Contoh requirement: expected 550.000, actual 550.000 → variance 0.
        $response = $this->postJson("/api/v1/cash-sessions/{$id}/close", [
            'actual_cash' => 550_000,
        ])->assertOk()
            ->assertJsonPath('data.status', CashSession::STATUS_CLOSED)
            ->assertJsonPath('data.expected_cash', 550_000)
            ->assertJsonPath('data.actual_cash', 550_000)
            ->assertJsonPath('data.variance', 0);

        $closedAt = $response->json('data.closed_at');
        $this->assertNotNull($closedAt);

        // Ini menutup gap: closed session tidak punya tambah/kurang silent.
        $this->postJson("/api/v1/cash-sessions/{$id}/close", ['actual_cash' => 600_000])
            ->assertUnprocessable()->assertJsonValidationErrors(['status']);

        $this->assertDatabaseHas('cash_sessions', [
            'id' => $id,
            'actual_cash' => 550_000,
            'expected_cash' => 550_000,
            'variance' => 0,
        ]);
    }

    public function test_variance_note_is_stored_without_inferring_cause(): void
    {
        [$owner, , $outlet] = $this->merchant();
        Sanctum::actingAs($owner);

        $id = $this->openSession($outlet->id, 0);

        $this->postJson("/api/v1/cash-sessions/{$id}/close", [
            'actual_cash' => 0,
            'variance_note' => 'Uang digunakan membeli gas.',
        ])->assertOk()->assertJsonPath('data.variance_note', 'Uang digunakan membeli gas.');
    }

    public function test_cashier_without_reconcile_permission_cannot_post_refund_or_adjustment(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        $cashier = $this->cashierWithOutlet($business, $outlet);
        $sessionId = $this->openSession($outlet->id, 0, $owner);

        Sanctum::actingAs($cashier);
        $this->getJson("/api/v1/cash-sessions/{$sessionId}")
            ->assertOk(); // cash.read diizinkan untuk cashier

        $this->postJson("/api/v1/cash-sessions/{$sessionId}/movements", [
            'type' => CashMovement::TYPE_REFUND,
            'amount' => 5_000,
        ])->assertForbidden();

        $this->postJson("/api/v1/cash-sessions/{$sessionId}/movements", [
            'type' => CashMovement::TYPE_ADJUSTMENT,
            'amount' => -100,
        ])->assertForbidden();

        $this->assertDatabaseCount('cash_movements', 0);
    }

    public function test_user_without_access_cannot_operate_other_outlet_session(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        $otherOutlet = Outlet::factory()->for($business)->create();
        $sessionId = $this->openSession($outlet->id, 0, $owner);

        // Member dengan akses hanya outlet lain (bukan outlet session).
        $restricted = $this->cashierWithOutlet($business, $otherOutlet);

        Sanctum::actingAs($restricted);
        $this->getJson("/api/v1/cash-sessions/{$sessionId}")->assertForbidden();
        $this->postJson("/api/v1/cash-sessions/{$sessionId}/movements", [
            'type' => CashMovement::TYPE_CASH_IN, 'amount' => 1_000,
        ])->assertForbidden();
        $this->postJson("/api/v1/cash-sessions/{$sessionId}/close", ['actual_cash' => 0])
            ->assertForbidden();
    }

    public function test_other_business_session_is_not_visible(): void
    {
        [$owner, , $outlet] = $this->merchant();
        $sessionId = $this->openSession($outlet->id, 0, $owner);

        [$otherOwner] = $this->merchant();

        Sanctum::actingAs($otherOwner);
        $this->getJson("/api/v1/cash-sessions/{$sessionId}")->assertNotFound();

        // Attempt langsung checkout/mutation on other business session.
        $this->postJson("/api/v1/cash-sessions/{$sessionId}/movements", [
            'type' => CashMovement::TYPE_CASH_IN, 'amount' => 1_000,
        ])->assertNotFound();
    }

    public function test_list_is_scoped_and_paginated(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        $this->openSession($outlet->id, 1_000, $owner);

        $otherOutlet = Outlet::factory()->for($business)->create();
        $otherCashier = $this->cashierWithOutlet($business, $otherOutlet);
        $this->openSession($otherOutlet->id, 2_000, $otherCashier);

        [$foreignOwner, , $foreignOutlet] = $this->merchant();
        $this->openSession($foreignOutlet->id, 3_000, $foreignOwner);

        Sanctum::actingAs($owner);
        $items = $this->getJson('/api/v1/cash-sessions?per_page=10')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->json('data');

        $this->assertEquals(
            [1000, 2000],
            collect($items)->pluck('opening_cash')->sort()->values()->all(),
        );
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

    /**
     * Cashier hanya punya akses outlet yang diberikan secara eksplisit (D-05);
     * OutletAccess tidak punya factory, dibuat manual.
     */
    private function cashierWithOutlet($business, $outlet): User
    {
        $cashier = User::factory()->create();
        $m = BusinessMembership::factory()->for($cashier)->create([
            'business_id' => $business->id,
            'role' => BusinessMembership::ROLE_CASHIER,
        ]);
        OutletAccess::create(['membership_id' => $m->id, 'outlet_id' => $outlet->id]);

        return $cashier;
    }

    private function membershipId(User $user): int
    {
        return BusinessMembership::query()->where('user_id', $user->id)->firstOrFail()->id;
    }

    private function openSession(int $outletId, int $openingCash, ?User $as = null): int
    {
        if ($as !== null) {
            Sanctum::actingAs($as);
        }

        $response = $this->postJson('/api/v1/cash-sessions', [
            'outlet_id' => $outletId,
            'opening_cash' => $openingCash,
        ]);

        return (int) $response->assertCreated()->json('data.id');
    }

    private function closeSession(int $sessionId, int $actualCash, string $expectedStatus): void
    {
        $this->postJson("/api/v1/cash-sessions/{$sessionId}/close", ['actual_cash' => $actualCash])
            ->assertOk()
            ->assertJsonPath('data.status', $expectedStatus);
    }
}
