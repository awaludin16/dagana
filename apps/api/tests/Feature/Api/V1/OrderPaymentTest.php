<?php

namespace Tests\Feature\Api\V1;

use App\Models\Business;
use App\Models\BusinessMembership;
use App\Models\Order;
use App\Models\Outlet;
use App\Models\Payment;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OrderPaymentTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_create_order_with_cash_payment(): void
    {
        [$owner, $business, $outlet] = $this->merchant();

        $coffee = Product::factory()->for($business)->create([
            'name' => 'Es Kopi Susu',
            'price' => 15000,
            'is_active' => true,
            'is_available' => true,
        ]);
        $teh = Product::factory()->for($business)->create([
            'name' => 'Es Teh',
            'price' => 8000,
            'is_active' => true,
            'is_available' => true,
        ]);

        Sanctum::actingAs($owner);

        $response = $this->postJson('/api/v1/orders', [
            'outlet_id' => $outlet->id,
            'idempotency_key' => fake()->uuid(),
            'payment_method' => 'cash',
            'amount_tendered' => 40000,
            'items' => [
                ['product_id' => $coffee->id, 'quantity' => 2],
                ['product_id' => $teh->id, 'quantity' => 1],
            ],
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.status', Order::STATUS_PAID)
            ->assertJsonPath('data.total_amount', 38000)
            ->assertJsonPath('data.payment.method', Payment::METHOD_CASH)
            ->assertJsonPath('data.payment.status', Payment::STATUS_PAID)
            ->assertJsonPath('data.payment.amount', 38000)
            ->assertJsonPath('data.payment.amount_tendered', 40000)
            ->assertJsonPath('data.payment.change_amount', 2000)
            ->assertJsonPath('data.payment.qr_code_payload', null)
            ->assertJsonCount(2, 'data.items')
            ->assertJsonPath('data.items.0.product_name', 'Es Kopi Susu')
            ->assertJsonPath('data.items.0.product_price', 15000)
            ->assertJsonPath('data.items.0.quantity', 2)
            ->assertJsonPath('data.items.0.total', 30000)
            ->assertJsonPath('data.items.1.product_name', 'Es Teh')
            ->assertJsonPath('data.items.1.product_price', 8000)
            ->assertJsonPath('data.items.1.quantity', 1)
            ->assertJsonPath('data.items.1.total', 8000);

        $this->assertDatabaseHas('orders', [
            'id' => $response->json('data.id'),
            'business_id' => $business->id,
            'outlet_id' => $outlet->id,
            'status' => Order::STATUS_PAID,
            'total_amount' => 38000,
        ]);
        $this->assertDatabaseHas('order_items', [
            'order_id' => $response->json('data.id'),
            'product_id' => $coffee->id,
            'product_name' => 'Es Kopi Susu',
            'product_price' => 15000,
            'quantity' => 2,
        ]);
        $this->assertDatabaseHas('order_items', [
            'order_id' => $response->json('data.id'),
            'product_id' => $teh->id,
            'product_name' => 'Es Teh',
            'product_price' => 8000,
            'quantity' => 1,
        ]);
        $this->assertDatabaseHas('payments', [
            'order_id' => $response->json('data.id'),
            'method' => Payment::METHOD_CASH,
            'status' => Payment::STATUS_PAID,
            'amount' => 38000,
            'amount_tendered' => 40000,
            'change_amount' => 2000,
            // Cash langsung dikonfirmasi operator yang melakukan checkout.
            'confirmed_by' => $this->membershipId($owner),
            'paid_at' => $response->json('data.payment.paid_at'),
        ]);
    }

    /**
     * @return int ID membership dari user
     */
    private function membershipId(User $user): int
    {
        return BusinessMembership::query()->where('user_id', $user->id)->firstOrFail()->id;
    }

    public function test_non_cash_payment_mulai_dengan_status_pending(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        $coffee = Product::factory()->for($business)->create(['price' => 15000]);

        Sanctum::actingAs($owner);

        $this->postJson('/api/v1/orders', [
            'outlet_id' => $outlet->id,
            'idempotency_key' => fake()->uuid(),
            'payment_method' => 'bank_transfer',
            'items' => [['product_id' => $coffee->id, 'quantity' => 1]],
        ])->assertCreated()
            ->assertJsonPath('data.status', Order::STATUS_PENDING)
            ->assertJsonPath('data.payment.status', Payment::STATUS_PENDING)
            ->assertJsonPath('data.payment.amount_tendered', null)
            ->assertJsonPath('data.payment.change_amount', null)
            ->assertJsonPath('data.payment.qr_code_payload', null);

        $orderId = Order::query()->latest('id')->first()->id;
        $payment = Payment::query()->where('order_id', $orderId)->firstOrFail();
        $this->assertNull($payment->paid_at);
    }

    public function test_checkout_cash_menolak_nominal_kurang_dan_tidak_membuat_transaksi(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        $coffee = Product::factory()->for($business)->create(['price' => 15000]);

        Sanctum::actingAs($owner);

        $this->postJson('/api/v1/orders', [
            'outlet_id' => $outlet->id,
            'idempotency_key' => fake()->uuid(),
            'payment_method' => 'cash',
            'amount_tendered' => 14999,
            'items' => [['product_id' => $coffee->id, 'quantity' => 1]],
        ])->assertUnprocessable()->assertJsonValidationErrors('amount_tendered');

        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('payments', 0);
    }

    public function test_checkout_cash_mewajibkan_nominal_dan_non_cash_melarang_nominal(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        $coffee = Product::factory()->for($business)->create(['price' => 15000]);

        Sanctum::actingAs($owner);

        $base = [
            'outlet_id' => $outlet->id,
            'idempotency_key' => fake()->uuid(),
            'items' => [['product_id' => $coffee->id, 'quantity' => 1]],
        ];

        $this->postJson('/api/v1/orders', [...$base, 'payment_method' => 'cash'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('amount_tendered');

        $this->postJson('/api/v1/orders', [
            ...$base,
            'payment_method' => 'qr_payment',
            'amount_tendered' => 15000,
        ])->assertUnprocessable()->assertJsonValidationErrors('amount_tendered');
    }

    public function test_checkout_total_dihitung_ulang_dari_catalog_bukan_dari_client(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        $coffee = Product::factory()->for($business)->create(['price' => 15000]);

        Sanctum::actingAs($owner);

        // Klien tidak dapat menyertakan harga; total dihitung ulang dari katalog.
        $this->postJson('/api/v1/orders', [
            'outlet_id' => $outlet->id,
            'idempotency_key' => fake()->uuid(),
            'payment_method' => 'cash',
            'amount_tendered' => 100000,
            'items' => [['product_id' => $coffee->id, 'quantity' => 3]],
        ])->assertCreated()->assertJsonPath('data.total_amount', 45000);
    }

    public function test_checkout_tolak_menu_tidak_aktif_dan_tidak_tersedia(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        $inactive = Product::factory()->for($business)->create(['is_active' => false, 'price' => 15000]);
        $unavailable = Product::factory()->for($business)->create(['is_available' => false, 'price' => 15000]);

        Sanctum::actingAs($owner);

        $this->postJson('/api/v1/orders', [
            'outlet_id' => $outlet->id,
            'idempotency_key' => fake()->uuid(),
            'payment_method' => 'cash',
            'amount_tendered' => 100000,
            'items' => [['product_id' => $inactive->id, 'quantity' => 1]],
        ])->assertUnprocessable()->assertJsonValidationErrors('items');

        $this->postJson('/api/v1/orders', [
            'outlet_id' => $outlet->id,
            'idempotency_key' => fake()->uuid(),
            'payment_method' => 'cash',
            'amount_tendered' => 100000,
            'items' => [['product_id' => $unavailable->id, 'quantity' => 1]],
        ])->assertUnprocessable()->assertJsonValidationErrors('items');

        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('payments', 0);
    }

    public function test_checkout_tolak_input_item_tidak_valid(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        $coffee = Product::factory()->for($business)->create(['price' => 15000]);

        Sanctum::actingAs($owner);

        // Kuantitas nol ditolak validasi.
        $this->postJson('/api/v1/orders', [
            'outlet_id' => $outlet->id,
            'idempotency_key' => fake()->uuid(),
            'payment_method' => 'cash',
            'amount_tendered' => 100000,
            'items' => [['product_id' => $coffee->id, 'quantity' => 0]],
        ])->assertUnprocessable()->assertJsonValidationErrors(['items.0.quantity']);

        // Produk yang tidak ada ditolak pada proses checkout (semua perubahan dibatalkan).
        $this->postJson('/api/v1/orders', [
            'outlet_id' => $outlet->id,
            'idempotency_key' => fake()->uuid(),
            'payment_method' => 'cash',
            'amount_tendered' => 100000,
            'items' => [['product_id' => 999999, 'quantity' => 1]],
        ])->assertUnprocessable()->assertJsonValidationErrors('items');

        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('order_items', 0);
        $this->assertDatabaseCount('payments', 0);
    }

    public function test_order_menyimpan_snapshot_harga_dan_nama_setelah_catalog_ubah(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        $coffee = Product::factory()->for($business)->create([
            'name' => 'Es Kopi Susu',
            'price' => 15000,
        ]);

        Sanctum::actingAs($owner);

        $created = $this->postJson('/api/v1/orders', [
            'outlet_id' => $outlet->id,
            'idempotency_key' => fake()->uuid(),
            'payment_method' => 'cash',
            'amount_tendered' => 100000,
            'items' => [['product_id' => $coffee->id, 'quantity' => 2]],
        ])->assertCreated()->json('data');

        $orderId = $created['id'];

        // Harga katalog diubah setelah transaksi.
        $coffee->update(['name' => 'Es Kopi Susu Baru', 'price' => 25000]);

        $this->getJson("/api/v1/orders/{$orderId}")
            ->assertOk()
            ->assertJsonPath('data.total_amount', 30000)
            ->assertJsonPath('data.items.0.product_name', 'Es Kopi Susu')
            ->assertJsonPath('data.items.0.product_price', 15000)
            ->assertJsonPath('data.items.0.total', 30000);

        // Katalog saat ini tidak mencerminkan histori transaksi.
        $this->assertDatabaseHas('products', ['id' => $coffee->id, 'price' => 25000]);
        $this->assertDatabaseHas('order_items', [
            'order_id' => $orderId,
            'product_name' => 'Es Kopi Susu',
            'product_price' => 15000,
        ]);
    }

    public function test_idempotency_key_sama_tidak_membuat_transaksi_ganda(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        $coffee = Product::factory()->for($business)->create(['price' => 15000]);
        $key = fake()->uuid();

        Sanctum::actingAs($owner);

        $payload = [
            'outlet_id' => $outlet->id,
            'idempotency_key' => $key,
            'payment_method' => 'cash',
            'amount_tendered' => 100000,
            'items' => [['product_id' => $coffee->id, 'quantity' => 1]],
        ];

        $first = $this->postJson('/api/v1/orders', $payload)->assertCreated()->json('data');
        $second = $this->postJson('/api/v1/orders', $payload)->assertOk()->json('data');

        $this->assertSame($first['id'], $second['id']);
        $this->assertSame($first['total_amount'], $second['total_amount']);

        $this->assertDatabaseCount('orders', 1);
        $this->assertDatabaseCount('order_items', 1);
        $this->assertDatabaseCount('payments', 1);
        $this->assertDatabaseHas('orders', ['idempotency_key' => $key]);
    }

    public function test_checkout_ditolah_tanpa_autentikasi(): void
    {
        $this->postJson('/api/v1/orders', [
            'outlet_id' => 1,
            'idempotency_key' => 'bukan-uuid', // tanpa autentikasi saja sudah ditolak sebelum validasi lebih jauh
            'payment_method' => 'cash',
            'amount_tendered' => 100000,
            'items' => [],
        ])->assertUnauthorized();
    }

    public function test_cashier_tanpa_akses_outlet_tidak_bisa_checkout_atau_lihat_order(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        $foreignOutlet = Outlet::factory()->for($business)->create(['name' => 'Lain']);
        $coffee = Product::factory()->for($business)->create(['price' => 15000]);

        $cashier = User::factory()->create();
        BusinessMembership::factory()->for($cashier)->create([
            'business_id' => $business->id,
            'role' => BusinessMembership::ROLE_CASHIER,
        ]);
        // Cashier tidak memiliki OutletAccess untuk outlet apa pun.

        Sanctum::actingAs($cashier);

        $this->postJson('/api/v1/orders', [
            'outlet_id' => $outlet->id,
            'idempotency_key' => fake()->uuid(),
            'payment_method' => 'cash',
            'amount_tendered' => 100000,
            'items' => [['product_id' => $coffee->id, 'quantity' => 1]],
        ])->assertForbidden();

        $order = Order::factory()->for($business)->create([
            'outlet_id' => $outlet->id,
            'status' => Order::STATUS_PAID,
            'total_amount' => 15000,
        ]);

        $this->getJson("/api/v1/orders/{$order->id}")->assertForbidden();
    }

    public function test_order_dari_business_lain_tidak_bisa_diakses(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        [$foreignOwner, $foreignBusiness, $foreignOutlet] = $this->merchant();
        $coffee = Product::factory()->for($foreignBusiness)->create(['price' => 15000]);

        Sanctum::actingAs($foreignOwner);

        $foreignOrder = $this->postJson('/api/v1/orders', [
            'outlet_id' => $foreignOutlet->id,
            'idempotency_key' => fake()->uuid(),
            'payment_method' => 'cash',
            'amount_tendered' => 100000,
            'items' => [['product_id' => $coffee->id, 'quantity' => 1]],
        ])->assertCreated()->json('data');

        Sanctum::actingAs($owner);

        // Order milik business lain: 404 (tidak membocorkan keberadaan).
        $this->getJson("/api/v1/orders/{$foreignOrder['id']}")->assertNotFound();

        // Daftar order owner tidak mencakup order business lain.
        $this->getJson('/api/v1/orders')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_konfirmasi_pembayaran_pending_ke_paid(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        $coffee = Product::factory()->for($business)->create(['price' => 15000]);

        Sanctum::actingAs($owner);

        $orderData = $this->postJson('/api/v1/orders', [
            'outlet_id' => $outlet->id,
            'idempotency_key' => fake()->uuid(),
            'payment_method' => 'qr_payment',
            'items' => [['product_id' => $coffee->id, 'quantity' => 1]],
        ])->assertCreated()->json('data');

        $payment = Payment::query()->where('order_id', $orderData['id'])->firstOrFail();
        $this->assertSame(Payment::STATUS_PENDING, $payment->status);
        $this->assertSame(Order::STATUS_PENDING, Order::query()->find($orderData['id'])->status);

        $this->postJson("/api/v1/payments/{$payment->id}/confirm")
            ->assertOk()
            ->assertJsonPath('data.status', Payment::STATUS_PAID);

        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => Payment::STATUS_PAID,
        ]);
        $this->assertDatabaseHas('orders', [
            'id' => $orderData['id'],
            'status' => Order::STATUS_PAID,
        ]);
    }

    public function test_tidak_bisa_konfirmasi_pembayaran_bukan_pending(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        $coffee = Product::factory()->for($business)->create(['price' => 15000]);

        Sanctum::actingAs($owner);

        $orderData = $this->postJson('/api/v1/orders', [
            'outlet_id' => $outlet->id,
            'idempotency_key' => fake()->uuid(),
            'payment_method' => 'cash',
            'amount_tendered' => 100000,
            'items' => [['product_id' => $coffee->id, 'quantity' => 1]],
        ])->assertCreated()->json('data');

        $payment = Payment::query()->where('order_id', $orderData['id'])->firstOrFail();

        // Sudah PAID: konfirmasi ulang ditolak (idempotensi aman, tidak duplikat).
        $this->postJson("/api/v1/payments/{$payment->id}/confirm")->assertUnprocessable();
        $this->assertDatabaseCount('payments', 1);
    }

    public function test_owner_dapat_membatalkan_order_pending_tanpa_pembayaran_paid(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        $coffee = Product::factory()->for($business)->create(['price' => 15000]);

        Sanctum::actingAs($owner);

        $orderData = $this->postJson('/api/v1/orders', [
            'outlet_id' => $outlet->id,
            'idempotency_key' => fake()->uuid(),
            'payment_method' => 'bank_transfer',
            'items' => [['product_id' => $coffee->id, 'quantity' => 1]],
        ])->assertCreated()->json('data');

        $this->postJson("/api/v1/orders/{$orderData['id']}/cancel")->assertNoContent();
        $this->assertDatabaseHas('orders', ['id' => $orderData['id'], 'status' => Order::STATUS_CANCELLED]);
    }

    public function test_tidak_bisa_membatalkan_order_yang_sudah_dibayar(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        $coffee = Product::factory()->for($business)->create(['price' => 15000]);

        Sanctum::actingAs($owner);

        $orderData = $this->postJson('/api/v1/orders', [
            'outlet_id' => $outlet->id,
            'idempotency_key' => fake()->uuid(),
            'payment_method' => 'cash',
            'amount_tendered' => 100000,
            'items' => [['product_id' => $coffee->id, 'quantity' => 1]],
        ])->assertCreated()->json('data');

        $this->postJson("/api/v1/orders/{$orderData['id']}/cancel")->assertUnprocessable();
        $this->assertDatabaseHas('orders', ['id' => $orderData['id'], 'status' => Order::STATUS_PAID]);
    }

    public function test_konfirmasi_pembayaran_mencatat_aktor_dan_waktu(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        $coffee = Product::factory()->for($business)->create(['price' => 15000]);

        Sanctum::actingAs($owner);

        $orderData = $this->postJson('/api/v1/orders', [
            'outlet_id' => $outlet->id,
            'idempotency_key' => fake()->uuid(),
            'payment_method' => 'qr_payment',
            'items' => [['product_id' => $coffee->id, 'quantity' => 1]],
        ])->assertCreated()->json('data');

        $payment = Payment::query()->where('order_id', $orderData['id'])->firstOrFail();

        // Pembayaran non-tunai belum punya aktor konfirmasi sebelum berhasil.
        $this->assertNull($payment->confirmed_by);

        $this->postJson("/api/v1/payments/{$payment->id}/confirm")->assertOk();

        $payment->refresh();
        $this->assertNotNull($payment->paid_at);
        $this->assertSame($this->membershipId($owner), $payment->confirmed_by);
    }

    public function test_idempotency_key_harus_uuid(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        $coffee = Product::factory()->for($business)->create(['price' => 15000]);

        Sanctum::actingAs($owner);

        $this->postJson('/api/v1/orders', [
            'outlet_id' => $outlet->id,
            'idempotency_key' => 'bukan-uuid',
            'payment_method' => 'cash',
            'amount_tendered' => 100000,
            'items' => [['product_id' => $coffee->id, 'quantity' => 1]],
        ])->assertUnprocessable()->assertJsonValidationErrors(['idempotency_key']);

        $this->assertDatabaseCount('orders', 0);
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
