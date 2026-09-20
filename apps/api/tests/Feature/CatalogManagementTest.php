<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Role;
use App\Models\User;
use App\Support\Rls;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\Concerns\CreatesTenant;
use Tests\TestCase;

class CatalogManagementTest extends TestCase
{
    use CreatesTenant, RefreshDatabase;

    /**
     * Membuat produk lewat API (payload & status default dibakukan di sini).
     *
     * @return array<string, mixed>
     */
    private function createProductViaApi(string $token, string $tenantId, array $overrides = []): array
    {
        $response = $this->withToken($token)
            ->postJson('/api/v1/catalog/products', array_merge([
                'name' => 'Kopi Susu',
                'variants' => [
                    ['sku' => 'KS-001', 'price' => 18000, 'cost_price' => 9000],
                    ['sku' => 'KS-002', 'price' => 22000, 'unit' => 'botol'],
                ],
            ], $overrides), $this->tenantHeader($tenantId))
            ->assertCreated();

        return $response->json('data');
    }

    /**
     * @return array<string, mixed>
     */
    private function createCategoryViaApi(string $token, string $tenantId, array $payload): array
    {
        $response = $this->withToken($token)
            ->postJson('/api/v1/catalog/categories', $payload, $this->tenantHeader($tenantId))
            ->assertCreated();

        return $response->json('data');
    }

    public function test_update_product_metadata_keeps_variants(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createTenantWithOwner();
        $token = $this->loginAs($user);

        $product = $this->createProductViaApi($token, $tenant->id);

        $this->withToken($token)
            ->putJson("/api/v1/catalog/products/{$product['id']}", [
                'name' => 'Kopi Susu Aren',
                'description' => 'Deskripsi baru.',
                'status' => 'ACTIVE',
            ], $this->tenantHeader($tenant->id))
            ->assertOk()
            ->assertJsonPath('data.name', 'Kopi Susu Aren')
            ->assertJsonPath('data.description', 'Deskripsi baru.');

        $this->assertDatabaseCount('product_variants', 2);
        $this->assertDatabaseHas('product_variants', ['sku' => 'KS-001']);
    }

    public function test_update_product_replaces_variants(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createTenantWithOwner();
        $token = $this->loginAs($user);

        $product = $this->createProductViaApi($token, $tenant->id);

        $this->withToken($token)
            ->putJson("/api/v1/catalog/products/{$product['id']}", [
                'name' => 'Kopi Susu',
                'variants' => [
                    ['sku' => 'KS-BARU', 'price' => 25000, 'cost_price' => 12000],
                ],
            ], $this->tenantHeader($tenant->id))
            ->assertOk()
            ->assertJsonCount(1, 'data.variants')
            ->assertJsonPath('data.variants.0.sku', 'KS-BARU');

        $this->assertDatabaseCount('product_variants', 1);
        $this->assertDatabaseMissing('product_variants', ['sku' => 'KS-001']);
    }

    public function test_update_product_allows_keeping_own_sku(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createTenantWithOwner();
        $token = $this->loginAs($user);

        $product = $this->createProductViaApi($token, $tenant->id);

        // SKU milik produk sendiri tidak boleh dianggap duplikat saat replace.
        $this->withToken($token)
            ->putJson("/api/v1/catalog/products/{$product['id']}", [
                'name' => 'Kopi Susu',
                'variants' => [
                    ['sku' => 'KS-001', 'price' => 19000],
                ],
            ], $this->tenantHeader($tenant->id))
            ->assertOk();
    }

    public function test_update_product_rejects_sku_used_by_another_product(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createTenantWithOwner();
        $token = $this->loginAs($user);

        $this->createProductViaApi($token, $tenant->id);
        $second = $this->createProductViaApi($token, $tenant->id, [
            'name' => 'Teh Tarik',
            'variants' => [['sku' => 'TT-001', 'price' => 9000]],
        ]);

        $this->withToken($token)
            ->putJson("/api/v1/catalog/products/{$second['id']}", [
                'name' => 'Teh Tarik',
                'variants' => [['sku' => 'KS-001', 'price' => 9000]],
            ], $this->tenantHeader($tenant->id))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('variants.0.sku');
    }

    public function test_add_variant_to_product(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createTenantWithOwner();
        $token = $this->loginAs($user);

        $product = $this->createProductViaApi($token, $tenant->id);

        $this->withToken($token)
            ->postJson("/api/v1/catalog/products/{$product['id']}/variants", [
                'sku' => 'KS-003',
                'barcode' => '8990003',
                'unit' => 'cup',
                'price' => 20000,
            ], $this->tenantHeader($tenant->id))
            ->assertCreated()
            ->assertJsonPath('data.sku', 'KS-003');

        // SKU milik variant lain di tenant yang sama → ditolak.
        $this->withToken($token)
            ->postJson("/api/v1/catalog/products/{$product['id']}/variants", [
                'sku' => 'KS-001',
                'price' => 10000,
            ], $this->tenantHeader($tenant->id))
            ->assertUnprocessable();
    }

    public function test_delete_product_is_soft_inactive(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createTenantWithOwner();
        $token = $this->loginAs($user);

        $product = $this->createProductViaApi($token, $tenant->id);

        $this->withToken($token)
            ->deleteJson("/api/v1/catalog/products/{$product['id']}", [], $this->tenantHeader($tenant->id))
            ->assertOk()
            ->assertJsonPath('data.status', 'INACTIVE');

        $this->assertDatabaseHas('products', ['id' => $product['id'], 'status' => 'INACTIVE']);
        $this->assertDatabaseCount('product_variants', 2);
    }

    public function test_product_index_filters_by_category_and_status(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createTenantWithOwner();
        $token = $this->loginAs($user);

        $category = $this->createCategoryViaApi($token, $tenant->id, ['name' => 'Minuman']);
        $product = $this->createProductViaApi($token, $tenant->id, [
            'name' => 'Kopi Susu',
            'category_id' => $category['id'],
        ]);

        $this->withToken($token)
            ->getJson('/api/v1/catalog/products?category='.$category['id'], $this->tenantHeader($tenant->id))
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $product['id']);

        // Pencarian nama case-insensitive (cakupan PostgreSQL & SQLite).
        $this->withToken($token)
            ->getJson('/api/v1/catalog/products?search=kopi', $this->tenantHeader($tenant->id))
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $product['id']);

        $this->withToken($token)
            ->getJson('/api/v1/catalog/products?search=kebab', $this->tenantHeader($tenant->id))
            ->assertOk()
            ->assertJsonCount(0, 'data');

        $this->withToken($token)
            ->deleteJson("/api/v1/catalog/products/{$product['id']}", [], $this->tenantHeader($tenant->id))
            ->assertOk();

        $this->withToken($token)
            ->getJson('/api/v1/catalog/products?status=INACTIVE', $this->tenantHeader($tenant->id))
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_update_category_scoped_to_tenant(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createTenantWithOwner();
        ['tenant' => $otherTenant] = $this->createTenantWithOwner('other@example.test', 'tenant-lain');
        $token = $this->loginAs($user);

        $category = $this->createCategoryViaApi($token, $tenant->id, ['name' => 'Minuman', 'sort_order' => 1]);

        $this->withToken($token)
            ->putJson("/api/v1/catalog/categories/{$category['id']}", [
                'name' => 'Minuman & Es',
                'sort_order' => 2,
            ], $this->tenantHeader($tenant->id))
            ->assertOk()
            ->assertJsonPath('data.name', 'Minuman & Es');

        $foreignCategory = Category::create(['tenant_id' => $otherTenant->id, 'name' => 'Lain']);

        $this->withToken($token)
            ->putJson("/api/v1/catalog/categories/{$foreignCategory['id']}", [
                'name' => 'Rahasia',
            ], $this->tenantHeader($tenant->id))
            ->assertNotFound();
    }

    public function test_create_category_rejects_parent_from_other_tenant(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createTenantWithOwner();
        ['tenant' => $otherTenant] = $this->createTenantWithOwner('other@example.test', 'tenant-lain');
        $token = $this->loginAs($user);

        $foreignParent = Category::create(['tenant_id' => $otherTenant->id, 'name' => 'Rahasia']);

        $this->withToken($token)
            ->postJson('/api/v1/catalog/categories', [
                'name' => 'Nasi',
                'parent_id' => $foreignParent->id,
            ], $this->tenantHeader($tenant->id))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('parent_id');
    }

    public function test_delete_category_orphans_children_and_detaches_products(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createTenantWithOwner();
        $token = $this->loginAs($user);

        $parent = $this->createCategoryViaApi($token, $tenant->id, ['name' => 'Makanan']);
        $child = $this->createCategoryViaApi($token, $tenant->id, [
            'name' => 'Nasi',
            'parent_id' => $parent['id'],
        ]);
        $product = $this->createProductViaApi($token, $tenant->id, ['category_id' => $parent['id']]);

        $this->withToken($token)
            ->deleteJson("/api/v1/catalog/categories/{$parent['id']}", [], $this->tenantHeader($tenant->id))
            ->assertOk();

        $this->assertDatabaseMissing('categories', ['id' => $parent['id']]);
        $this->assertDatabaseHas('categories', ['id' => $child['id'], 'parent_id' => null]);
        $this->assertDatabaseHas('products', ['id' => $product['id'], 'category_id' => null]);
    }

    public function test_delete_product_forbidden_for_manager_without_delete_permission(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createTenantWithOwner();
        $token = $this->loginAs($user);

        $product = $this->createProductViaApi($token, $tenant->id);

        $manager = User::factory()->create(['email' => 'manager@example.test']);
        DB::transaction(function () use ($manager, $tenant): void {
            Rls::setTenantContext($tenant->id);
            $managerRoleId = Role::where('tenant_id', $tenant->id)->where('code', 'MANAGER')->value('id');
            $manager->memberships()->create([
                'tenant_id' => $tenant->id,
                'role_id' => $managerRoleId,
                'status' => 'ACTIVE',
            ]);
        });

        $managerToken = $this->loginAs($manager);

        $this->withToken($managerToken)
            ->deleteJson("/api/v1/catalog/products/{$product['id']}", [], $this->tenantHeader($tenant->id))
            ->assertForbidden();

        $this->assertDatabaseHas('products', ['id' => $product['id'], 'status' => 'ACTIVE']);
    }
}
