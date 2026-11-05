<?php

namespace Tests\Feature\Api\V1;

use App\Models\Business;
use App\Models\BusinessMembership;
use App\Models\Category;
use App\Models\Outlet;
use App\Models\Product;
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
