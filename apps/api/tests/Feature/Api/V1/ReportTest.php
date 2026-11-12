<?php

namespace Tests\Feature\Api\V1;

use App\Models\BusinessMembership;
use App\Models\CashMovement;
use App\Models\CashSession;
use App\Models\InventoryItem;
use App\Models\Order;
use App\Models\Outlet;
use App\Models\OutletAccess;
use App\Models\Payment;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Phase 7 — Reporting: agregat dibandingkan dengan fixture yang dihitung
 * manual, definisi paid vs pending/failed, batas periode, permission,
 * serta isolasi business/outlet.
 */
class ReportTest extends TestCase
{
    use RefreshDatabase;

    private const DAY1 = '2026-11-01';

    private const DAY2 = '2026-11-02';

    private const DAY3 = '2026-11-03';

    public function test_daily_sales_matches_manual_fixture(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        $ownerMembership = $this->membershipId($owner);
        $cashier = $this->cashierWithOutlet($business, $outlet);

        // Hari 1: cash 100rb (owner) + qr 50rb (cashier). Hari 2: cash 30rb.
        // Di luar fixture: PENDING 70rb, CANCELLED 20rb (payment FAILED),
        // PAID 5rb pada hari ke-3 (di luar rentang query).
        $this->paidOrder($business->id, $outlet->id, $ownerMembership, Payment::METHOD_CASH, 100_000, self::DAY1.' 10:00:00');
        $this->paidOrder($business->id, $outlet->id, $this->membershipId($cashier), Payment::METHOD_QR_PAYMENT, 50_000, self::DAY1.' 12:00:00');
        $this->paidOrder($business->id, $outlet->id, $ownerMembership, Payment::METHOD_CASH, 30_000, self::DAY2.' 09:00:00');
        $this->paidOrder($business->id, $outlet->id, $ownerMembership, Payment::METHOD_CASH, 5_000, self::DAY3.' 09:00:00');
        $this->orderWithPayment($business->id, $outlet->id, $ownerMembership, Order::STATUS_PENDING, Payment::STATUS_PENDING, 70_000, Payment::METHOD_QR_PAYMENT, self::DAY1);
        $this->orderWithPayment($business->id, $outlet->id, $ownerMembership, Order::STATUS_CANCELLED, Payment::STATUS_FAILED, 20_000, Payment::METHOD_CASH, self::DAY2);

        Sanctum::actingAs($owner);

        $response = $this->getJson('/api/v1/reports/sales?from='.self::DAY1.'&to='.self::DAY2);

        $response->assertOk()
            ->assertJsonPath('data.summary.sales_total', 180_000)
            ->assertJsonPath('data.summary.transactions', 3)
            ->assertJsonCount(2, 'data.days')
            ->assertJsonPath('data.days.0.date', self::DAY1)
            ->assertJsonPath('data.days.0.sales_total', 150_000)
            ->assertJsonPath('data.days.0.transactions', 2)
            ->assertJsonPath('data.days.0.average_order_value', 75_000)
            ->assertJsonPath('data.days.1.sales_total', 30_000)
            ->assertJsonPath('data.days.1.transactions', 1);
    }

    public function test_payment_report_never_counts_pending_or_failed_as_paid(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        $membershipId = $this->membershipId($owner);

        $this->paidOrder($business->id, $outlet->id, $membershipId, Payment::METHOD_CASH, 100_000, self::DAY1.' 10:00:00');
        $this->paidOrder($business->id, $outlet->id, $membershipId, Payment::METHOD_QR_PAYMENT, 50_000, self::DAY1.' 12:00:00');
        $this->orderWithPayment($business->id, $outlet->id, $membershipId, Order::STATUS_PENDING, Payment::STATUS_PENDING, 70_000, Payment::METHOD_QR_PAYMENT, self::DAY1);
        $this->orderWithPayment($business->id, $outlet->id, $membershipId, Order::STATUS_CANCELLED, Payment::STATUS_FAILED, 20_000, Payment::METHOD_CASH, self::DAY2);

        Sanctum::actingAs($owner);

        $response = $this->getJson('/api/v1/reports/payments?from='.self::DAY1.'&to='.self::DAY2);

        // by_method hanya PAID: cash 100rb, qr 50rb.
        $response->assertOk()
            ->assertJsonCount(2, 'data.by_method')
            ->assertJsonPath('data.by_method.0.method', Payment::METHOD_CASH)
            ->assertJsonPath('data.by_method.0.transactions', 1)
            ->assertJsonPath('data.by_method.0.total', 100_000)
            ->assertJsonPath('data.by_method.1.method', Payment::METHOD_QR_PAYMENT)
            ->assertJsonPath('data.by_method.1.total', 50_000);

        // by_status memisahkan semua bucket; PENDING/FAILED tidak menyatu ke paid.
        $status = collect($response->json('data.by_status'))->pluck('total', 'status');
        $this->assertSame(150_000, $status[Payment::STATUS_PAID]);
        $this->assertSame(70_000, $status[Payment::STATUS_PENDING] ?? null);
        $this->assertSame(20_000, $status[Payment::STATUS_FAILED] ?? null);
    }

    public function test_operator_report_aggregates_paid_orders_per_operator(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        $ownerMembership = $this->membershipId($owner);
        $cashier = $this->cashierWithOutlet($business, $outlet);
        $cashierMembership = $this->membershipId($cashier);

        $this->paidOrder($business->id, $outlet->id, $ownerMembership, Payment::METHOD_CASH, 100_000, self::DAY1.' 10:00:00');
        $this->paidOrder($business->id, $outlet->id, $ownerMembership, Payment::METHOD_CASH, 30_000, self::DAY2.' 09:00:00');
        $this->paidOrder($business->id, $outlet->id, $cashierMembership, Payment::METHOD_QR_PAYMENT, 50_000, self::DAY1.' 12:00:00');
        $this->orderWithPayment($business->id, $outlet->id, $cashierMembership, Order::STATUS_PENDING, Payment::STATUS_PENDING, 70_000, Payment::METHOD_QR_PAYMENT, self::DAY1);

        Sanctum::actingAs($owner);

        $response = $this->getJson('/api/v1/reports/operators?from='.self::DAY1.'&to='.self::DAY2);

        // Owner (130rb) di atas cashier (50rb); PENDING tidak dihitung.
        $response->assertOk()
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('data.0.membership_id', $ownerMembership)
            ->assertJsonPath('data.0.transactions', 2)
            ->assertJsonPath('data.0.sales_total', 130_000)
            ->assertJsonPath('data.1.membership_id', $cashierMembership)
            ->assertJsonPath('data.1.sales_total', 50_000);
    }

    public function test_cash_reconciliation_matches_cash_session_arithmetic(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        $membershipId = $this->membershipId($owner);

        // Manual: opening 100rb + cash sale 100rb + cash in 50rb - cash out 20rb
        // = expected 230rb; actual 225rb → variance -5rb.
        $session = CashSession::create([
            'business_id' => $business->id,
            'outlet_id' => $outlet->id,
            'operator_membership_id' => $membershipId,
            'status' => CashSession::STATUS_CLOSED,
            'opening_cash' => 100_000,
            'actual_cash' => 225_000,
            'expected_cash' => 230_000,
            'variance' => -5_000,
            'variance_note' => 'kembalian kurang',
            'opened_at' => self::DAY1.' 08:00:00',
            'closed_at' => self::DAY1.' 21:00:00',
            'closed_by_membership_id' => $membershipId,
        ]);
        foreach ([CashMovement::TYPE_CASH_SALE => 100_000, CashMovement::TYPE_CASH_IN => 50_000, CashMovement::TYPE_CASH_OUT => 20_000] as $type => $amount) {
            CashMovement::create([
                'cash_session_id' => $session->id,
                'business_id' => $business->id,
                'outlet_id' => $outlet->id,
                'membership_id' => $membershipId,
                'type' => $type,
                'amount' => $type === CashMovement::TYPE_CASH_OUT ? -1 * $amount : $amount,
            ]);
        }

        // Session terbuka pada hari ke-2: variance masih null.
        CashSession::create([
            'business_id' => $business->id,
            'outlet_id' => $outlet->id,
            'operator_membership_id' => $membershipId,
            'status' => CashSession::STATUS_OPEN,
            'opening_cash' => 10_000,
            'opened_at' => self::DAY2.' 08:00:00',
        ]);

        Sanctum::actingAs($owner);

        $response = $this->getJson('/api/v1/reports/cash?from='.self::DAY1.'&to='.self::DAY2);

        $response->assertOk()->assertJsonPath('meta.total', 2);
        $data = collect($response->json('data'));
        $closed = $data->firstWhere('status', CashSession::STATUS_CLOSED);
        $open = $data->firstWhere('status', CashSession::STATUS_OPEN);

        $this->assertSame(100_000, $closed['opening_cash']);
        $this->assertSame(230_000, $closed['expected_cash']);
        $this->assertSame(225_000, $closed['actual_cash']);
        $this->assertSame(-5_000, $closed['variance']);
        $this->assertSame([['type' => CashMovement::TYPE_CASH_SALE, 'amount' => 100_000], ['type' => CashMovement::TYPE_CASH_IN, 'amount' => 50_000], ['type' => CashMovement::TYPE_CASH_OUT, 'amount' => -20_000]], $closed['movements_by_type']);
        $this->assertSame(null, $open['actual_cash']);
        $this->assertSame(null, $open['variance']);
        $this->assertSame(10_000, $open['expected_cash']);
    }

    public function test_inventory_report_reconciles_with_ledger_and_flags_low_stock(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        $membershipId = $this->membershipId($owner);

        $milk = InventoryItem::create(['business_id' => $business->id, 'outlet_id' => $outlet->id, 'name' => 'Milk', 'unit' => 'ml', 'low_stock_threshold' => 50]);
        $syrup = InventoryItem::create(['business_id' => $business->id, 'outlet_id' => $outlet->id, 'name' => 'Syrup', 'unit' => 'ml', 'low_stock_threshold' => 5]);

        // Manual: Milk saldo penuh = +100 -30 -2 = 68; dalam rentang hari1-2 = +70.
        // Syrup saldo = +2 → low stock.
        $this->stockMovement($business->id, $outlet->id, $milk, $membershipId, 100, self::DAY1);
        $this->stockMovement($business->id, $outlet->id, $milk, $membershipId, -30, self::DAY2);
        $this->stockMovement($business->id, $outlet->id, $milk, $membershipId, -2, self::DAY3);
        $this->stockMovement($business->id, $outlet->id, $syrup, $membershipId, 2, self::DAY1);

        Sanctum::actingAs($owner);

        $response = $this->getJson('/api/v1/reports/inventory?from='.self::DAY1.'&to='.self::DAY2);

        $response->assertOk()->assertJsonPath('meta.total', 2);
        $data = collect($response->json('data'));
        $milkRow = $data->firstWhere('name', 'Milk');
        $syrupRow = $data->firstWhere('name', 'Syrup');

        $this->assertSame(68, $milkRow['current_stock']);
        $this->assertFalse($milkRow['is_low_stock']);
        $this->assertSame(2, $milkRow['movements_count']);
        $this->assertSame(70, $milkRow['movements_net']);
        $this->assertSame(2, $syrupRow['current_stock']);
        $this->assertTrue($syrupRow['is_low_stock']);

        // Filter low_stock=true hanya mengembalikan item di bawah ambang.
        $this->getJson('/api/v1/reports/inventory?from='.self::DAY1.'&to='.self::DAY2.'&low_stock=true')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.name', 'Syrup');
    }

    public function test_empty_period_returns_zeroed_sales_and_empty_breakdowns(): void
    {
        [$owner, $business, $outlet] = $this->merchant();

        Sanctum::actingAs($owner);

        $this->getJson('/api/v1/reports/sales?from='.self::DAY1.'&to='.self::DAY2)
            ->assertOk()
            ->assertJsonPath('data.summary.sales_total', 0)
            ->assertJsonPath('data.summary.transactions', 0)
            ->assertJsonCount(2, 'data.days')
            ->assertJsonPath('data.days.0.sales_total', 0)
            ->assertJsonPath('data.days.1.transactions', 0);

        $this->getJson('/api/v1/reports/payments?from='.self::DAY1.'&to='.self::DAY2)
            ->assertOk()
            ->assertJsonCount(0, 'data.by_method')
            ->assertJsonCount(0, 'data.by_status');

        $this->getJson('/api/v1/reports/operators?from='.self::DAY1.'&to='.self::DAY2)
            ->assertOk()
            ->assertJsonPath('meta.total', 0);

        // Tanpa item inventory: laporan kosong, bukan error.
        $this->getJson('/api/v1/reports/inventory?from='.self::DAY1.'&to='.self::DAY2)
            ->assertOk()
            ->assertJsonPath('meta.total', 0);
    }

    public function test_other_business_data_never_leaks_into_reports(): void
    {
        [$ownerA, $businessA, $outletA] = $this->merchant();
        $ownerB = User::factory()->create();
        $membershipB = BusinessMembership::factory()->for($ownerB)->create();
        $businessB = $membershipB->business;
        $outletB = Outlet::factory()->for($businessB)->create();

        $this->paidOrder($businessA->id, $outletA->id, $this->membershipId($ownerA), Payment::METHOD_CASH, 123_000, self::DAY1.' 10:00:00');
        $this->paidOrder($businessB->id, $outletB->id, $membershipB->id, Payment::METHOD_CASH, 999_000, self::DAY1.' 10:00:00');

        Sanctum::actingAs($ownerA);

        $this->getJson('/api/v1/reports/sales?from='.self::DAY1.'&to='.self::DAY1)
            ->assertOk()
            ->assertJsonPath('data.summary.sales_total', 123_000);

        $this->getJson('/api/v1/reports/payments?from='.self::DAY1.'&to='.self::DAY1)
            ->assertOk()
            ->assertJsonPath('data.by_method.0.total', 123_000);

        $this->getJson('/api/v1/reports/operators?from='.self::DAY1.'&to='.self::DAY1)
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.sales_total', 123_000);
    }

    public function test_report_scope_limits_operator_to_accessible_outlets(): void
    {
        [$owner, $business, $outletA] = $this->merchant();
        $outletB = Outlet::factory()->for($business)->create();
        $ownerMembership = $this->membershipId($owner);

        $this->paidOrder($business->id, $outletA->id, $ownerMembership, Payment::METHOD_CASH, 10_000, self::DAY1.' 10:00:00');
        $this->paidOrder($business->id, $outletB->id, $ownerMembership, Payment::METHOD_CASH, 40_000, self::DAY1.' 11:00:00');

        // Owner melihat semua outlet dalam business (50rb). Manager dengan
        // reports.read tetap dibatasi outlet yang diberi akses saja (D-05).
        $manager = $this->memberWithOutlet($business, $outletA, BusinessMembership::ROLE_MANAGER);
        Sanctum::actingAs($owner);
        $this->getJson('/api/v1/reports/sales?from='.self::DAY1.'&to='.self::DAY1)
            ->assertOk()
            ->assertJsonPath('data.summary.sales_total', 50_000);

        Sanctum::actingAs($manager);
        $this->getJson('/api/v1/reports/sales?from='.self::DAY1.'&to='.self::DAY1)
            ->assertOk()
            ->assertJsonPath('data.summary.sales_total', 10_000);

        // Outlet tanpa akses ditolak walaupun masih dalam business yang sama.
        $this->getJson('/api/v1/reports/sales?from='.self::DAY1.'&to='.self::DAY1.'&outlet_id='.$outletB->id)
            ->assertForbidden();
    }

    public function test_cashier_without_reports_read_permission_is_rejected(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        $cashier = $this->cashierWithOutlet($business, $outlet);

        Sanctum::actingAs($cashier);

        foreach (['sales', 'payments', 'operators', 'cash', 'inventory'] as $report) {
            $this->getJson("/api/v1/reports/{$report}?from=".self::DAY1.'&to='.self::DAY1)
                ->assertForbidden();
        }
    }

    public function test_date_range_validation_bounds_report_queries(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        Sanctum::actingAs($owner);

        // Parameter wajib.
        $this->getJson('/api/v1/reports/sales')->assertUnprocessable();
        $this->getJson('/api/v1/reports/sales?from='.self::DAY1)->assertUnprocessable();

        // from > to ditolak.
        $this->getJson('/api/v1/reports/sales?from='.self::DAY2.'&to='.self::DAY1)->assertUnprocessable();

        // Rentang melebihi 92 hari ditolak.
        $this->getJson('/api/v1/reports/sales?from=2026-01-01&to=2026-06-30')->assertUnprocessable();

        // Batas 92 hari masih diterima.
        $this->getJson('/api/v1/reports/sales?from=2026-08-01&to=2026-10-31')->assertOk();
    }

    /**
     * Order PAID + satu payment PAID pada tanggal tertentu; created_at payment
     * disamakan dengan tanggal paid agar basis created_at dan paid_at konsisten
     * pada fixture.
     */
    private function paidOrder(int $businessId, int $outletId, int $membershipId, string $method, int $total, string $paidAt): void
    {
        $this->orderWithPayment($businessId, $outletId, $membershipId, Order::STATUS_PAID, Payment::STATUS_PAID, $total, $method, $paidAt, $paidAt);
    }

    private function orderWithPayment(
        int $businessId,
        int $outletId,
        int $membershipId,
        string $orderStatus,
        string $paymentStatus,
        int $total,
        string $method,
        string $paymentDate,
        ?string $paidAt = null,
    ): void {
        $order = Order::factory()->create([
            'business_id' => $businessId,
            'outlet_id' => $outletId,
            'membership_id' => $membershipId,
            'status' => $orderStatus,
            'total_amount' => $total,
        ]);

        $payment = Payment::factory()->create([
            'order_id' => $order->id,
            'business_id' => $businessId,
            'outlet_id' => $outletId,
            'membership_id' => $membershipId,
            'method' => $method,
            'status' => $paymentStatus,
            'amount' => $total,
            'paid_at' => $paidAt ?? $paymentDate,
        ]);
        $payment->created_at = $paymentDate;
        $payment->saveQuietly();
    }

    private function stockMovement(int $businessId, int $outletId, InventoryItem $item, int $membershipId, int $change, string $date): void
    {
        $movement = StockMovement::create([
            'business_id' => $businessId,
            'outlet_id' => $outletId,
            'inventory_item_id' => $item->id,
            'membership_id' => $membershipId,
            'type' => StockMovement::TYPE_ADJUSTMENT,
            'quantity_change' => $change,
            'reason' => 'fixture',
            'idempotency_key' => fake()->unique()->uuid(),
        ]);
        $movement->created_at = $date.' 10:00:00';
        $movement->saveQuietly();
    }

    private function merchant(): array
    {
        $owner = User::factory()->create();
        $membership = BusinessMembership::factory()->for($owner)->create();
        $outlet = Outlet::factory()->for($membership->business)->create();

        return [$owner, $membership->business, $outlet];
    }

    private function cashierWithOutlet($business, $outlet): User
    {
        return $this->memberWithOutlet($business, $outlet, BusinessMembership::ROLE_CASHIER);
    }

    private function memberWithOutlet($business, $outlet, string $role): User
    {
        $member = User::factory()->create();
        $m = BusinessMembership::factory()->for($member)->create([
            'business_id' => $business->id,
            'role' => $role,
        ]);
        OutletAccess::create(['membership_id' => $m->id, 'outlet_id' => $outlet->id]);

        return $member;
    }

    private function membershipId(User $user): int
    {
        return BusinessMembership::query()->where('user_id', $user->id)->firstOrFail()->id;
    }
}
