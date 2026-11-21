<?php

namespace Tests\Feature\Api\V1;

use App\Models\Business;
use App\Models\BusinessMembership;
use App\Models\Category;
use App\Models\OrderItem;
use App\Models\Outlet;
use App\Models\OutletAccess;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\ProductStockMovement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_create_and_update_a_category(): void
    {
        [$owner] = $this->merchant();

        Sanctum::actingAs($owner);

        $created = $this->postJson('/api/v1/categories', [
            'name' => 'Minuman',
            'is_active' => true,
            'business_id' => 999, // client-supplied scope must be ignored
        ]);

        $created->assertCreated()->assertJsonPath('data.name', 'Minuman');
        $this->assertDatabaseHas('categories', ['name' => 'Minuman']);

        $category = Category::query()->firstOrFail();

        $this->patchJson("/api/v1/categories/{$category->id}", ['name' => 'Coffee'])
            ->assertOk()
            ->assertJsonPath('data.name', 'Coffee');

        $this->patchJson("/api/v1/categories/{$category->id}", ['is_active' => false])
            ->assertOk()
            ->assertJsonPath('data.is_active', false);

        $this->assertDatabaseHas('categories', [
            'id' => $category->id,
            'name' => 'Coffee',
            'is_active' => false,
        ]);
    }

    public function test_category_requires_a_name(): void
    {
        [$owner] = $this->merchant();

        Sanctum::actingAs($owner);

        $this->postJson('/api/v1/categories', [])->assertUnprocessable()
            ->assertJsonValidationErrors('name');

        $this->postJson('/api/v1/categories', ['name' => null])->assertUnprocessable()
            ->assertJsonValidationErrors('name');

        $this->assertDatabaseCount('categories', 0);
    }

    public function test_category_list_supports_search_and_pagination(): void
    {
        [$owner, $business] = $this->merchant();
        Category::factory()->for($business)->create(['name' => 'Minuman Dingin']);
        Category::factory()->for($business)->create(['name' => 'Minuman Hangat']);
        Category::factory()->for($business)->create(['name' => 'Makanan', 'is_active' => false]);

        Sanctum::actingAs($owner);

        $this->getJson('/api/v1/categories?q=MINUMAN&per_page=1')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Minuman Dingin')
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('meta.last_page', 2);

        $this->getJson('/api/v1/categories?is_active=false')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Makanan');
    }

    public function test_category_with_menus_cannot_be_deleted_but_empty_one_can(): void
    {
        [$owner, $business] = $this->merchant();
        $category = Category::factory()->for($business)->create();
        Product::factory()->for($business)->create(['category_id' => $category->id]);

        Sanctum::actingAs($owner);

        $this->deleteJson("/api/v1/categories/{$category->id}")->assertUnprocessable()
            ->assertJsonValidationErrors('category');
        $this->assertDatabaseHas('categories', ['id' => $category->id]);

        $product = Product::query()->firstOrFail();
        $this->deleteJson("/api/v1/products/{$product->id}")->assertNoContent();

        $this->deleteJson("/api/v1/categories/{$category->id}")->assertNoContent();
        $this->assertDatabaseCount('categories', 0);
    }

    public function test_owner_can_create_and_update_a_product(): void
    {
        [$owner, $business] = $this->merchant();
        $category = Category::factory()->for($business)->create(['name' => 'Minuman']);

        Sanctum::actingAs($owner);

        $response = $this->postJson('/api/v1/products', [
            'name' => 'Es Kopi Susu',
            'price' => 15000,
            'category_id' => $category->id,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.name', 'Es Kopi Susu')
            ->assertJsonPath('data.price', 15000)
            ->assertJsonPath('data.category_id', $category->id)
            ->assertJsonPath('data.category.name', 'Minuman')
            ->assertJsonPath('data.is_active', true)
            ->assertJsonPath('data.is_available', true);

        $product = Product::query()->firstOrFail();

        $this->patchJson("/api/v1/products/{$product->id}", [
            'name' => 'Es Kopi Susu Gula Aren',
            'price' => 17000,
            'is_active' => false,
            'is_available' => false,
        ])
            ->assertOk()
            ->assertJsonPath('data.is_active', false)
            ->assertJsonPath('data.is_available', false);

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'name' => 'Es Kopi Susu Gula Aren',
            'price' => 17000,
            'is_active' => false,
            'is_available' => false,
        ]);

        // Regression: PATCH response must keep the same shape as POST.
        $withCategory = Product::factory()->for($business)->create(['category_id' => $category->id]);
        $this->patchJson("/api/v1/products/{$withCategory->id}", ['price' => 12000])
            ->assertOk()
            ->assertJsonPath('data.category.name', 'Minuman');
    }

    public function test_outlet_specific_stock_controls_availability_without_touching_global_flag(): void
    {
        [$owner, $business, $outletA] = $this->merchant();
        $outletB = Outlet::factory()->for($business)->create();
        $product = Product::factory()->for($business)->create(['price' => 15000]);

        Sanctum::actingAs($owner);

        $this->patchJson("/api/v1/products/{$product->id}/stock", [
            'outlet_id' => $outletA->id,
            'quantity' => 0,
        ])
            ->assertOk()
            ->assertJsonPath('data.is_available', true)
            ->assertJsonPath('data.is_available_at_outlet', false)
            ->assertJsonPath('data.stock_quantity', 0);

        // Bisnis tetap penuh; hanya outlet A yang kehabisan.
        $this->getJson("/api/v1/products?outlet_id={$outletA->id}&is_available=true")
            ->assertOk()
            ->assertJsonCount(0, 'data');
        $this->getJson("/api/v1/products?outlet_id={$outletB->id}&is_available=true")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.is_available_at_outlet', true);
        $this->getJson('/api/v1/products')
            ->assertOk()
            ->assertJsonPath('data.0.is_available', true)
            ->assertJsonMissingPath('data.0.is_available_at_outlet');

        // Checkout menolak di outlet A, tetap jalan di outlet B.
        $this->postJson('/api/v1/orders', $this->checkoutPayload($outletA, $product))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('items');
        $this->postJson('/api/v1/orders', $this->checkoutPayload($outletB, $product))
            ->assertCreated();
        $this->assertDatabaseCount('orders', 1);

        // Mengisi stok di outlet A memulihkan penjualan.
        $this->patchJson("/api/v1/products/{$product->id}/stock", [
            'outlet_id' => $outletA->id,
            'quantity' => 2,
        ])->assertOk()->assertJsonPath('data.is_available_at_outlet', true);

        $this->postJson('/api/v1/orders', $this->checkoutPayload($outletA, $product))
            ->assertCreated();

        // Master switch Business tetap menang: global habis berarti semua outlet habis.
        $this->patchJson("/api/v1/products/{$product->id}", ['is_available' => false])->assertOk();
        $this->getJson("/api/v1/products?outlet_id={$outletB->id}&is_available=true")
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_cashier_can_update_stock_only_at_accessible_outlets(): void
    {
        [$owner, $business, $outletA] = $this->merchant();
        $outletB = Outlet::factory()->for($business)->create();
        $product = Product::factory()->for($business)->create();

        $cashier = User::factory()->create();
        $membership = BusinessMembership::factory()->for($cashier)->create([
            'business_id' => $business->id,
            'role' => BusinessMembership::ROLE_CASHIER,
        ]);
        OutletAccess::create(['membership_id' => $membership->id, 'outlet_id' => $outletA->id]);

        Sanctum::actingAs($cashier);

        // Cashier dapat mengubah stok di outlet yang ia akses (D-39)...
        $this->patchJson("/api/v1/products/{$product->id}/stock", [
            'outlet_id' => $outletA->id,
            'quantity' => 5,
        ])->assertOk()->assertJsonPath('data.stock_quantity', 5);

        // ...tetapi tidak pada outlet di luar aksesnya, dan tidak bocor keberadaannya.
        $this->patchJson("/api/v1/products/{$product->id}/stock", [
            'outlet_id' => $outletB->id,
            'quantity' => 5,
        ])->assertNotFound();
        $this->getJson("/api/v1/products?outlet_id={$outletB->id}")->assertNotFound();
        $this->assertDatabaseMissing('product_stocks', ['outlet_id' => $outletB->id]);

        // Hak stok tidak memberi hak mengubah master produk.
        $this->patchJson("/api/v1/products/{$product->id}", ['price' => 100])
            ->assertForbidden();

        // Outlet asing juga ditolak oleh validasi request (422) maupun 404.
        Sanctum::actingAs($owner);
        $this->patchJson("/api/v1/products/{$product->id}/stock", [
            'outlet_id' => 999999,
            'quantity' => 5,
        ])->assertUnprocessable()->assertJsonValidationErrors('outlet_id');
    }

    public function test_stock_is_optional_per_outlet_and_records_manual_adjustments(): void
    {
        [$owner, $business, $outletA] = $this->merchant();
        $product = Product::factory()->for($business)->create(['price' => 15000]);

        Sanctum::actingAs($owner);

        $response = $this->getJson("/api/v1/products/{$product->id}?outlet_id={$outletA->id}")->assertOk();
        $this->assertArrayHasKey('stock_quantity', $response->json('data'));
        $this->assertNull($response->json('data.stock_quantity'));
        $this->assertFalse($response->json('data.low_stock'));

        $this->patchJson("/api/v1/products/{$product->id}/stock", [
            'outlet_id' => $outletA->id,
            'quantity' => 5,
            'reason' => 'Stok awal',
        ])->assertOk()
            ->assertJsonPath('data.stock_quantity', 5)
            ->assertJsonPath('data.low_stock_threshold', ProductStock::DEFAULT_LOW_STOCK_THRESHOLD)
            ->assertJsonPath('data.low_stock', true);

        $this->assertDatabaseHas('product_stocks', [
            'business_id' => $business->id,
            'product_id' => $product->id,
            'outlet_id' => $outletA->id,
            'quantity' => 5,
            'low_stock_threshold' => ProductStock::DEFAULT_LOW_STOCK_THRESHOLD,
        ]);
        $this->assertDatabaseHas('product_stock_movements', [
            'product_id' => $product->id,
            'outlet_id' => $outletA->id,
            'quantity_change' => 5,
            'type' => ProductStockMovement::TYPE_ADJUSTMENT,
            'reason' => 'Stok awal',
        ]);

        $this->patchJson("/api/v1/products/{$product->id}/stock", [
            'outlet_id' => $outletA->id,
            'quantity' => 3,
        ])->assertOk()->assertJsonPath('data.stock_quantity', 3);
        $this->assertDatabaseHas('product_stock_movements', [
            'product_id' => $product->id,
            'quantity_change' => -2,
            'type' => ProductStockMovement::TYPE_ADJUSTMENT,
        ]);

        $this->getJson("/api/v1/products?outlet_id={$outletA->id}&is_available=true")
            ->assertOk()->assertJsonCount(1, 'data');

        // null mengembalikan menu ke kondisi opsional: tanpa baris stok.
        $this->patchJson("/api/v1/products/{$product->id}/stock", [
            'outlet_id' => $outletA->id,
            'quantity' => null,
        ])->assertOk();

        $response = $this->getJson("/api/v1/products/{$product->id}?outlet_id={$outletA->id}")->assertOk();
        $this->assertArrayHasKey('stock_quantity', $response->json('data'));
        $this->assertNull($response->json('data.stock_quantity'));
        $this->assertNull($response->json('data.low_stock_threshold'));
        $this->assertFalse($response->json('data.low_stock'));
        $this->assertDatabaseMissing('product_stocks', [
            'product_id' => $product->id,
            'outlet_id' => $outletA->id,
        ]);
        $this->assertDatabaseHas('product_stock_movements', [
            'product_id' => $product->id,
            'quantity_change' => -3,
            'reason' => 'Stok tidak lagi dipantau',
        ]);

        $this->patchJson("/api/v1/products/{$product->id}/stock", [
            'outlet_id' => $outletA->id,
            'quantity' => 0,
        ])->assertOk()
            ->assertJsonPath('data.stock_quantity', 0)
            ->assertJsonPath('data.is_available_at_outlet', false)
            ->assertJsonPath('data.low_stock', true);

        $this->getJson("/api/v1/products?outlet_id={$outletA->id}&is_available=true")
            ->assertOk()->assertJsonCount(0, 'data');
        $this->assertSame([], Product::query()->sellable($outletA->id)->pluck('id')->all());
    }

    public function test_stock_update_requires_outlet_access_and_valid_input(): void
    {
        [$owner, $business, $outletA] = $this->merchant();
        $outletB = Outlet::factory()->for($business)->create();
        $product = Product::factory()->for($business)->create();

        $cashier = User::factory()->create();
        $cashierMembership = BusinessMembership::factory()->for($cashier)->create([
            'business_id' => $business->id,
            'role' => BusinessMembership::ROLE_CASHIER,
        ]);
        OutletAccess::create(['membership_id' => $cashierMembership->id, 'outlet_id' => $outletA->id]);

        // Kasier kini dapat menyesuaikan stok di outlet yang ia akses (D-39).
        Sanctum::actingAs($cashier);
        $this->patchJson("/api/v1/products/{$product->id}/stock", [
            'outlet_id' => $outletA->id,
            'quantity' => 1,
        ])->assertOk();

        $manager = User::factory()->create();
        $managerMembership = BusinessMembership::factory()->for($manager)->create([
            'business_id' => $business->id,
            'role' => BusinessMembership::ROLE_MANAGER,
        ]);
        OutletAccess::create(['membership_id' => $managerMembership->id, 'outlet_id' => $outletA->id]);

        Sanctum::actingAs($manager);
        $this->patchJson("/api/v1/products/{$product->id}/stock", [
            'outlet_id' => $outletA->id,
            'quantity' => 2,
        ])->assertOk();
        $this->patchJson("/api/v1/products/{$product->id}/stock", [
            'outlet_id' => $outletB->id,
            'quantity' => 2,
        ])->assertNotFound();
        $this->getJson("/api/v1/products?outlet_id={$outletB->id}")->assertNotFound();
        $this->assertDatabaseMissing('product_stocks', ['outlet_id' => $outletB->id]);

        Sanctum::actingAs($owner);
        $this->patchJson("/api/v1/products/{$product->id}/stock", [
            'outlet_id' => 999999,
            'quantity' => 1,
        ])->assertUnprocessable()->assertJsonValidationErrors('outlet_id');
        $this->patchJson("/api/v1/products/{$product->id}/stock", [
            'outlet_id' => $outletA->id,
            'quantity' => -1,
        ])->assertUnprocessable()->assertJsonValidationErrors('quantity');
    }

    public function test_product_can_be_created_with_initial_stock_for_single_outlet(): void
    {
        [$owner, $business, $outletA] = $this->merchant();

        Sanctum::actingAs($owner);

        $created = $this->postJson('/api/v1/products', [
            'name' => 'Es Teh',
            'price' => 5000,
            'initial_stock' => 8,
            'initial_stock_outlet_id' => $outletA->id,
        ])->assertCreated()
            ->assertJsonPath('data.stock_quantity', 8)
            ->assertJsonPath('data.low_stock_threshold', ProductStock::DEFAULT_LOW_STOCK_THRESHOLD)
            ->assertJsonPath('data.low_stock', true);

        $productId = $created->json('data.id');
        $this->assertDatabaseHas('product_stocks', [
            'business_id' => $business->id,
            'product_id' => $productId,
            'outlet_id' => $outletA->id,
            'quantity' => 8,
            'low_stock_threshold' => ProductStock::DEFAULT_LOW_STOCK_THRESHOLD,
        ]);
        $this->assertDatabaseHas('product_stock_movements', [
            'product_id' => $productId,
            'outlet_id' => $outletA->id,
            'quantity_change' => 8,
            'type' => ProductStockMovement::TYPE_ADJUSTMENT,
            'reason' => 'Stok awal',
        ]);

        $this->postJson('/api/v1/products', [
            'name' => 'Tanpa Stok',
            'price' => 3000,
        ])->assertCreated();
        $untracked = Product::query()->where('name', 'Tanpa Stok')->firstOrFail();
        $this->assertArrayNotHasKey(
            'stock_quantity',
            $this->getJson("/api/v1/products/{$untracked->id}")->assertOk()->json('data'),
        );
        $this->assertDatabaseMissing('product_stocks', ['product_id' => $untracked->id]);

        $this->postJson('/api/v1/products', [
            'name' => 'Stok Tanpa Outlet',
            'price' => 3000,
            'initial_stock' => 4,
        ])->assertUnprocessable()->assertJsonValidationErrors('initial_stock_outlet_id');
    }

    public function test_low_stock_threshold_can_be_customized_and_requires_tracked_stock(): void
    {
        [$owner, $business, $outletA] = $this->merchant();
        $product = Product::factory()->for($business)->create();

        Sanctum::actingAs($owner);

        $this->patchJson("/api/v1/products/{$product->id}/stock", [
            'outlet_id' => $outletA->id,
            'quantity' => 12,
            'low_stock_threshold' => 3,
        ])->assertOk()
            ->assertJsonPath('data.low_stock_threshold', 3)
            ->assertJsonPath('data.low_stock', false);

        // Tanpa field threshold, nilai yang sudah diatur tidak boleh kembali ke default.
        $this->patchJson("/api/v1/products/{$product->id}/stock", [
            'outlet_id' => $outletA->id,
            'quantity' => 2,
        ])->assertOk()
            ->assertJsonPath('data.low_stock_threshold', 3)
            ->assertJsonPath('data.low_stock', true);
        $this->assertDatabaseHas('product_stocks', [
            'product_id' => $product->id,
            'quantity' => 2,
            'low_stock_threshold' => 3,
        ]);

        $this->patchJson("/api/v1/products/{$product->id}/stock", [
            'outlet_id' => $outletA->id,
            'quantity' => 2,
            'low_stock_threshold' => 0,
        ])->assertOk()
            ->assertJsonPath('data.low_stock_threshold', 0)
            ->assertJsonPath('data.low_stock', false);

        $this->patchJson("/api/v1/products/{$product->id}/stock", [
            'outlet_id' => $outletA->id,
            'quantity' => null,
            'low_stock_threshold' => 5,
        ])->assertUnprocessable()->assertJsonValidationErrors('low_stock_threshold');

        $this->patchJson("/api/v1/products/{$product->id}/stock", [
            'outlet_id' => $outletA->id,
            'quantity' => null,
        ])->assertOk();

        $this->patchJson("/api/v1/products/{$product->id}/stock", [
            'outlet_id' => $outletA->id,
            'quantity' => 4,
            'low_stock_threshold' => -1,
        ])->assertUnprocessable()->assertJsonValidationErrors('low_stock_threshold');
    }

    public function test_checkout_deducts_tracked_stock_and_is_idempotent(): void
    {
        [$owner, $business, $outletA] = $this->merchant();
        $outletB = Outlet::factory()->for($business)->create();
        $product = Product::factory()->for($business)->create(['price' => 1000]);

        Sanctum::actingAs($owner);
        $this->patchJson("/api/v1/products/{$product->id}/stock", [
            'outlet_id' => $outletA->id,
            'quantity' => 2,
            'reason' => 'Stok awal',
        ])->assertOk();

        // Kegagalan setelah stok divalidasi tidak boleh mengurangi stok.
        $insufficientCash = $this->checkoutPayload($outletA, $product);
        $insufficientCash['amount_tendered'] = 0;
        $this->postJson('/api/v1/orders', $insufficientCash)->assertUnprocessable();
        $this->assertDatabaseHas('product_stocks', [
            'product_id' => $product->id,
            'outlet_id' => $outletA->id,
            'quantity' => 2,
        ]);
        $this->assertSame(0, ProductStockMovement::query()
            ->where('type', ProductStockMovement::TYPE_SALE)
            ->count());

        $payload = $this->checkoutPayload($outletA, $product);
        $payload['items'] = [
            ['product_id' => $product->id, 'quantity' => 1],
            ['product_id' => $product->id, 'quantity' => 1],
        ];

        $first = $this->postJson('/api/v1/orders', $payload)->assertCreated();
        $orderId = $first->json('data.id');

        $this->assertDatabaseHas('product_stocks', [
            'product_id' => $product->id,
            'outlet_id' => $outletA->id,
            'quantity' => 0,
        ]);
        $this->assertDatabaseHas('product_stock_movements', [
            'order_id' => $orderId,
            'product_id' => $product->id,
            'outlet_id' => $outletA->id,
            'quantity_change' => -2,
            'type' => ProductStockMovement::TYPE_SALE,
        ]);
        // Dua baris item dengan menu sama menghasilkan satu movement agregat.
        $this->assertSame(1, ProductStockMovement::query()->where('order_id', $orderId)->count());

        $this->postJson('/api/v1/orders', $payload)
            ->assertOk()
            ->assertJsonPath('data.id', $orderId);
        $this->assertDatabaseHas('product_stocks', [
            'product_id' => $product->id,
            'outlet_id' => $outletA->id,
            'quantity' => 0,
        ]);
        $this->assertSame(1, ProductStockMovement::query()->where('order_id', $orderId)->count());

        $this->postJson('/api/v1/orders', $this->checkoutPayload($outletA, $product))
            ->assertUnprocessable()->assertJsonValidationErrors('items');
        $this->assertDatabaseCount('orders', 1);

        // Outlet tanpa baris stok tetap tanpa batas.
        $this->postJson('/api/v1/orders', $this->checkoutPayload($outletB, $product))->assertCreated();
        $this->assertDatabaseMissing('product_stocks', ['outlet_id' => $outletB->id]);
        $this->assertDatabaseCount('orders', 2);
    }

    public function test_product_with_order_history_cannot_be_deleted(): void
    {
        [$owner, $business] = $this->merchant();
        $product = Product::factory()->for($business)->create();
        OrderItem::factory()->create(['product_id' => $product->id]);

        Sanctum::actingAs($owner);

        $this->deleteJson("/api/v1/products/{$product->id}")
            ->assertUnprocessable()
            ->assertJsonValidationErrors('product');
        $this->assertDatabaseHas('products', ['id' => $product->id]);
    }

    public function test_product_without_history_can_be_deleted_with_its_stock(): void
    {
        [$owner, $business, $outlet] = $this->merchant();
        $product = Product::factory()->for($business)->create();

        ProductStock::create([
            'business_id' => $business->id,
            'product_id' => $product->id,
            'outlet_id' => $outlet->id,
            'quantity' => 4,
        ]);

        Sanctum::actingAs($owner);

        $this->deleteJson("/api/v1/products/{$product->id}")->assertNoContent();
        $this->assertDatabaseMissing('products', ['id' => $product->id]);
        $this->assertDatabaseMissing('product_stocks', ['product_id' => $product->id]);
    }

    public function test_product_validation_rejects_invalid_input(): void
    {
        [$owner] = $this->merchant();

        Sanctum::actingAs($owner);

        $this->postJson('/api/v1/products', ['price' => 15000])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('name');

        $this->postJson('/api/v1/products', ['name' => 'Es Teh', 'price' => 'seribu'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('price');

        $this->postJson('/api/v1/products', ['name' => 'Es Teh', 'price' => -1000])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('price');

        $this->postJson('/api/v1/products', [
            'name' => 'Es Teh',
            'price' => 5000,
            'is_active' => 'aktif',
        ])->assertUnprocessable()->assertJsonValidationErrors('is_active');

        $this->assertDatabaseCount('products', 0);
    }

    public function test_product_category_must_belong_to_the_same_business(): void
    {
        [$owner] = $this->merchant();
        [$foreignOwner, $foreignBusiness, $foreignOutlet] = $this->merchant();
        $foreignCategory = Category::factory()->for($foreignBusiness)->create();

        Sanctum::actingAs($owner);

        $this->postJson('/api/v1/products', [
            'name' => 'Es Teh',
            'price' => 5000,
            'category_id' => $foreignCategory->id,
        ])->assertUnprocessable()->assertJsonValidationErrors('category_id');
    }

    public function test_product_list_supports_pagination_and_filters(): void
    {
        [$owner, $business] = $this->merchant();
        $drinks = Category::factory()->for($business)->create();
        $snacks = Category::factory()->for($business)->create();

        Product::factory()->for($business)->createMany([
            ['name' => 'Es Kopi Susu', 'price' => 15000, 'category_id' => $drinks->id],
            ['name' => 'Es Teh Tawar', 'price' => 8000, 'category_id' => $drinks->id],
            ['name' => 'Pisang Goreng', 'price' => 10000, 'category_id' => null],
            ['name' => 'Keripik Singkong', 'price' => 9000, 'category_id' => $snacks->id, 'is_active' => false],
            ['name' => 'Cireng Beku', 'price' => 7000, 'category_id' => $snacks->id, 'is_available' => false],
            ['name' => 'Roti Manis', 'price' => 11000, 'category_id' => $snacks->id, 'is_active' => false, 'is_available' => false],
        ]);
        // 111 total records keeps the per_page cap provable (max is 100).
        Product::factory()->for($business)->count(105)->create(['category_id' => null]);

        Sanctum::actingAs($owner);

        $this->getJson('/api/v1/products?is_active=true&is_available=true&per_page=200')
            ->assertOk()
            ->assertJsonCount(100, 'data') // capped at MAX_PER_PAGE
            ->assertJsonPath('meta.total', 108); // 3 named + 105 factory rows

        $this->getJson('/api/v1/products?per_page=2&page=2')
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $this->getJson('/api/v1/products?q=es+teh')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Es Teh Tawar');

        $this->getJson("/api/v1/products?category_id={$drinks->id}")
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_inactive_and_unavailable_products_are_not_sellable(): void
    {
        [$owner, $business] = $this->merchant();
        $active = Product::factory()->for($business)->create(['name' => 'Aktif']);
        Product::factory()->for($business)->create(['name' => 'Nonaktif', 'is_active' => false]);
        Product::factory()->for($business)->create(['name' => 'Habis', 'is_available' => false]);

        Sanctum::actingAs($owner);

        $this->assertSame(
            [$active->id],
            Product::query()->sellable()->orderBy('id')->pluck('id')->all(),
        );
    }

    public function test_catalog_is_scoped_to_the_authenticated_business(): void
    {
        [$owner] = $this->merchant();
        [$foreignOwner, $foreignBusiness, $foreignOutlet] = $this->merchant();
        $foreignCategory = Category::factory()->for($foreignBusiness)->create(['name' => 'Kategori Asing']);
        $foreignProduct = Product::factory()->for($foreignBusiness)->create(['name' => 'Menu Asing']);

        Sanctum::actingAs($owner);

        $this->getJson('/api/v1/categories')->assertOk()->assertJsonCount(0, 'data');
        $this->getJson('/api/v1/products')->assertOk()->assertJsonCount(0, 'data');

        foreach ([
            "/api/v1/categories/{$foreignCategory->id}",
            "/api/v1/products/{$foreignProduct->id}",
        ] as $path) {
            $this->getJson($path)->assertNotFound();
            $this->patchJson($path, ['name' => 'Injeksi'])->assertNotFound();
            $this->deleteJson($path)->assertNotFound();
        }

        $this->assertDatabaseHas('categories', [
            'id' => $foreignCategory->id,
            'name' => 'Kategori Asing',
        ]);
        $this->assertDatabaseHas('products', [
            'id' => $foreignProduct->id,
            'name' => 'Menu Asing',
        ]);

        // The category validation rule must not unlock foreign categories either.
        $this->postJson('/api/v1/products', [
            'name' => 'Es Teh',
            'price' => 5000,
            'category_id' => $foreignCategory->id,
        ])->assertUnprocessable()->assertJsonValidationErrors('category_id');
    }

    public function test_cashier_can_read_catalog_but_cannot_change_it(): void
    {
        [$owner, $business] = $this->merchant();
        $cashier = User::factory()->create();
        BusinessMembership::factory()->for($cashier)->create([
            'business_id' => $business->id,
            'role' => BusinessMembership::ROLE_CASHIER,
        ]);

        Sanctum::actingAs($cashier);

        $this->getJson('/api/v1/categories')->assertOk();
        $this->getJson('/api/v1/products')->assertOk();

        $this->postJson('/api/v1/categories', ['name' => 'X'])->assertForbidden();
        $this->postJson('/api/v1/products', ['name' => 'Es Teh', 'price' => 1000])->assertForbidden();

        $category = Category::factory()->for($business)->create();
        $this->patchJson("/api/v1/categories/{$category->id}", ['name' => 'Y'])->assertForbidden();
        $this->deleteJson("/api/v1/categories/{$category->id}")->assertForbidden();

        $product = Product::factory()->for($business)->create();
        $this->patchJson("/api/v1/products/{$product->id}", ['price' => 2000])->assertForbidden();
        $this->deleteJson("/api/v1/products/{$product->id}")->assertForbidden();
    }

    /**
     * @return array<string, mixed>
     */
    private function checkoutPayload(Outlet $outlet, Product $product): array
    {
        return [
            'outlet_id' => $outlet->id,
            'idempotency_key' => fake()->uuid(),
            'payment_method' => 'cash',
            'amount_tendered' => 100000,
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ];
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
