<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\Concerns\CreatesTenant;
use Tests\TestCase;

class TenantIsolationTest extends TestCase
{
    use CreatesTenant, RefreshDatabase;

    public function test_tenant_b_cannot_see_or_read_tenant_a_products(): void
    {
        ['user' => $userA, 'tenant' => $tenantA] = $this->createTenantWithOwner('a@example.test', 'tenant-a');
        ['user' => $userB, 'tenant' => $tenantB] = $this->createTenantWithOwner('b@example.test', 'tenant-b');

        // Owner A membuat produk.
        $tokenA = $this->loginAs($userA);
        $created = $this->withToken($tokenA)
            ->postJson('/api/v1/catalog/products', [
                'name' => 'Produk Rahasia A',
                'variants' => [
                    ['sku' => 'SKU-A-001', 'price' => 10000],
                ],
            ], $this->tenantHeader($tenantA->id))
            ->assertCreated();

        $productAId = $created->json('data.id');

        // Owner B tidak melihat produk A.
        $tokenB = $this->loginAs($userB);

        $this->withToken($tokenB)
            ->getJson('/api/v1/catalog/products', $this->tenantHeader($tenantB->id))
            ->assertOk()
            ->assertJsonMissing(['id' => $productAId]);

        // Owner B membaca produk A → 404 (RLS / scope backend).
        $this->withToken($tokenB)
            ->getJson("/api/v1/catalog/products/{$productAId}", $this->tenantHeader($tenantB->id))
            ->assertNotFound();

        // Owner B membuat produk dengan SKU yang sama → sukses (tenant terpisah).
        $this->withToken($tokenB)
            ->postJson('/api/v1/catalog/products', [
                'name' => 'Produk B',
                'variants' => [
                    ['sku' => 'SKU-A-001', 'price' => 20000],
                ],
            ], $this->tenantHeader($tenantB->id))
            ->assertCreated();
    }

    public function test_tenant_b_cannot_see_tenant_a_categories(): void
    {
        ['user' => $userA, 'tenant' => $tenantA] = $this->createTenantWithOwner('a@example.test', 'tenant-a');
        ['user' => $userB, 'tenant' => $tenantB] = $this->createTenantWithOwner('b@example.test', 'tenant-b');

        $tokenA = $this->loginAs($userA);
        $this->withToken($tokenA)
            ->postJson('/api/v1/catalog/categories', ['name' => 'Kategori A'],
                $this->tenantHeader($tenantA->id))
            ->assertCreated();

        $tokenB = $this->loginAs($userB);
        $this->withToken($tokenB)
            ->getJson('/api/v1/catalog/categories', $this->tenantHeader($tenantB->id))
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_user_without_membership_cannot_use_tenant_scope(): void
    {
        ['user' => $user] = $this->createTenantWithOwner('owner@example.test', 'tenant-a');

        // Header menunjuk tenant yang tidak pernah menjadi scope user → ditolak.
        $token = $this->loginAs($user);

        $this->withToken($token)
            ->getJson('/api/v1/catalog/products', $this->tenantHeader((string) Str::uuid()))
            ->assertForbidden();
    }
}
