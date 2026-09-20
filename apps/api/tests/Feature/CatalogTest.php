<?php

namespace Tests\Feature;

use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesTenant;
use Tests\TestCase;

class CatalogTest extends TestCase
{
    use CreatesTenant, RefreshDatabase;

    public function test_create_and_list_product_with_variants(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createTenantWithOwner();
        $token = $this->loginAs($user);

        $category = Category::create(['tenant_id' => $tenant->id, 'name' => 'Minuman', 'sort_order' => 1]);

        $response = $this->withToken($token)
            ->postJson('/api/v1/catalog/products', [
                'name' => 'Kopi Susu',
                'category_id' => $category->id,
                'variants' => [
                    ['sku' => 'KS-001', 'barcode' => '8990001', 'unit' => 'cup',
                        'price' => 18000, 'cost_price' => 9000],
                    ['sku' => 'KS-002', 'barcode' => '8990002', 'unit' => 'botol',
                        'price' => 22000, 'cost_price' => 11000],
                ],
            ], $this->tenantHeader($tenant->id))
            ->assertCreated();

        $productId = $response->json('data.id');
        $this->assertCount(2, $response->json('data.variants'));

        $this->withToken($token)
            ->getJson('/api/v1/catalog/products', $this->tenantHeader($tenant->id))
            ->assertOk()
            ->assertJsonPath('data.0.variants.0.sku', 'KS-001');

        $this->withToken($token)
            ->getJson("/api/v1/catalog/products/{$productId}", $this->tenantHeader($tenant->id))
            ->assertOk();
    }

    public function test_duplicate_sku_is_rejected(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createTenantWithOwner();
        $token = $this->loginAs($user);

        $this->withToken($token)
            ->postJson('/api/v1/catalog/products', [
                'name' => 'A',
                'variants' => [['sku' => 'DUP-1', 'price' => 1000]],
            ], $this->tenantHeader($tenant->id))
            ->assertCreated();

        $this->withToken($token)
            ->postJson('/api/v1/catalog/products', [
                'name' => 'B',
                'variants' => [['sku' => 'DUP-1', 'price' => 1000]],
            ], $this->tenantHeader($tenant->id))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('variants.0.sku');
    }

    public function test_create_category_and_tenant_scope(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createTenantWithOwner();
        $token = $this->loginAs($user);

        $this->withToken($token)
            ->postJson('/api/v1/catalog/categories', ['name' => 'Makanan'],
                $this->tenantHeader($tenant->id))
            ->assertCreated();

        $this->withToken($token)
            ->getJson('/api/v1/catalog/categories', $this->tenantHeader($tenant->id))
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_product_permission_is_required(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createTenantWithOwner('cashier@example.test', 'tenant');

        // Ganti role user menjadi CASHIER tanpa permissions.create produk.
        $user->memberships()->update([
            'role_id' => $tenant->roles()->where('code', 'CASHIER')->value('id'),
        ]);

        $token = $this->loginAs($user);

        $this->withToken($token)
            ->postJson('/api/v1/catalog/products', [
                'name' => 'Dilarang',
                'variants' => [['sku' => 'NO-1', 'price' => 1000]],
            ], $this->tenantHeader($tenant->id))
            ->assertForbidden();
    }
}
