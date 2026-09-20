<?php

namespace Tests\Feature;

use App\Models\Outlet;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use App\Support\Rls;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Testing\TestResponse;
use Tests\Concerns\CreatesTenant;
use Tests\TestCase;

class InventoryManagementTest extends TestCase
{
    use CreatesTenant, RefreshDatabase;

    /**
     * Membuat produk + 1 variant lewat API (pola sama CatalogManagementTest).
     *
     * @return array{product: array<string, mixed>, variant: array<string, mixed>}
     */
    private function createProductViaApi(string $token, string $tenantId, string $sku = 'INV-001'): array
    {
        $response = $this->withToken($token)
            ->postJson('/api/v1/catalog/products', [
                'name' => 'Produk '.$sku,
                'variants' => [
                    ['sku' => $sku, 'price' => 15000, 'cost_price' => 7000],
                ],
            ], $this->tenantHeader($tenantId))
            ->assertCreated();

        $product = $response->json('data');

        return ['product' => $product, 'variant' => $product['variants'][0]];
    }

    private function outletHeader(string $outletId): array
    {
        return ['X-Outlet-Context' => $outletId];
    }

    private function adjustViaApi(string $token, string $tenantId, string $outletId, array $payload): TestResponse
    {
        return $this->withToken($token)
            ->postJson('/api/v1/inventory/adjustments', $payload, array_merge(
                $this->tenantHeader($tenantId),
                $this->outletHeader($outletId),
            ));
    }

    public function test_adjustment_increases_stock_and_creates_ledger(): void
    {
        ['user' => $user, 'tenant' => $tenant, 'outlet' => $outlet] = $this->createTenantWithOwner();
        $token = $this->loginAs($user);
        $variant = $this->createProductViaApi($token, $tenant->id)['variant'];

        $this->adjustViaApi($token, $tenant->id, $outlet->id, [
            'product_variant_id' => $variant['id'],
            'quantity' => 10,
            'reason' => 'CORRECTION',
        ])
            ->assertCreated()
            ->assertJsonPath('data.balance', '10.00')
            ->assertJsonPath('data.adjustment.diff', '10.00');

        $this->assertDatabaseHas('stocks', [
            'outlet_id' => $outlet->id,
            'product_variant_id' => $variant['id'],
            'quantity' => '10.00',
        ]);
        $this->assertDatabaseHas('stock_movements', [
            'outlet_id' => $outlet->id,
            'product_variant_id' => $variant['id'],
            'quantity' => '10.00',
            'movement_type' => 'ADJUSTMENT',
        ]);
        $this->assertDatabaseHas('stock_adjustments', [
            'product_variant_id' => $variant['id'],
            'system_qty' => '0.00',
            'counted_qty' => '10.00',
        ]);
    }

    public function test_adjustment_decreases_stock_and_rejects_when_insufficient(): void
    {
        ['user' => $user, 'tenant' => $tenant, 'outlet' => $outlet] = $this->createTenantWithOwner();
        $token = $this->loginAs($user);
        $variant = $this->createProductViaApi($token, $tenant->id)['variant'];

        $this->adjustViaApi($token, $tenant->id, $outlet->id, [
            'product_variant_id' => $variant['id'],
            'quantity' => 10,
            'reason' => 'CORRECTION',
        ])->assertCreated();

        $this->adjustViaApi($token, $tenant->id, $outlet->id, [
            'product_variant_id' => $variant['id'],
            'quantity' => -4,
            'reason' => 'DAMAGED',
        ])
            ->assertCreated()
            ->assertJsonPath('data.balance', '6.00');

        $this->adjustViaApi($token, $tenant->id, $outlet->id, [
            'product_variant_id' => $variant['id'],
            'quantity' => -7,
            'reason' => 'DAMAGED',
        ])->assertUnprocessable();

        $this->assertDatabaseHas('stocks', [
            'outlet_id' => $outlet->id,
            'product_variant_id' => $variant['id'],
            'quantity' => '6.00',
        ]);
        $this->assertDatabaseCount('stock_movements', 2);
    }

    public function test_adjust_quantity_zero_is_rejected(): void
    {
        ['user' => $user, 'tenant' => $tenant, 'outlet' => $outlet] = $this->createTenantWithOwner();
        $token = $this->loginAs($user);
        $variant = $this->createProductViaApi($token, $tenant->id)['variant'];

        $this->adjustViaApi($token, $tenant->id, $outlet->id, [
            'product_variant_id' => $variant['id'],
            'quantity' => 0,
            'reason' => 'CORRECTION',
        ])->assertUnprocessable();
    }

    public function test_mutation_requires_outlet_context(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createTenantWithOwner();
        $token = $this->loginAs($user);
        $variant = $this->createProductViaApi($token, $tenant->id)['variant'];

        $this->withToken($token)
            ->postJson('/api/v1/inventory/adjustments', [
                'product_variant_id' => $variant['id'],
                'quantity' => 5,
                'reason' => 'CORRECTION',
            ], $this->tenantHeader($tenant->id))
            ->assertUnprocessable()
            ->assertJsonPath('error.code', 'UNPROCESSABLE');
    }

    public function test_receiving_adds_stock_and_records_reference(): void
    {
        ['user' => $user, 'tenant' => $tenant, 'outlet' => $outlet] = $this->createTenantWithOwner();
        $token = $this->loginAs($user);
        $variant = $this->createProductViaApi($token, $tenant->id)['variant'];

        $response = $this->withToken($token)
            ->postJson('/api/v1/inventory/receivings', [
                'note' => 'Kiriman supplier.',
                'items' => [
                    ['product_variant_id' => $variant['id'], 'quantity' => 25, 'cost_price' => 6500],
                ],
            ], array_merge(
                $this->tenantHeader($tenant->id),
                $this->outletHeader($outlet->id),
            ))
            ->assertCreated();

        $receiving = $response->json('data.receiving');

        $this->assertDatabaseHas('stock_receivings', ['id' => $receiving['id']]);
        $this->assertDatabaseHas('stock_receiving_items', [
            'stock_receiving_id' => $receiving['id'],
            'product_variant_id' => $variant['id'],
            'quantity' => '25.00',
            'cost_price' => '6500.00',
        ]);
        $this->assertDatabaseHas('stock_movements', [
            'outlet_id' => $outlet->id,
            'product_variant_id' => $variant['id'],
            'quantity' => '25.00',
            'movement_type' => 'RECEIVING',
            'reference_type' => 'RECEIVING',
            'reference_id' => $receiving['id'],
        ]);
        $this->assertDatabaseHas('stocks', [
            'outlet_id' => $outlet->id,
            'product_variant_id' => $variant['id'],
            'quantity' => '25.00',
        ]);
    }

    public function test_opname_flow_adjust_and_complete_syncs_stock(): void
    {
        ['user' => $user, 'tenant' => $tenant, 'outlet' => $outlet] = $this->createTenantWithOwner();
        $token = $this->loginAs($user);
        $variant = $this->createProductViaApi($token, $tenant->id)['variant'];

        $this->adjustViaApi($token, $tenant->id, $outlet->id, [
            'product_variant_id' => $variant['id'],
            'quantity' => 50,
            'reason' => 'CORRECTION',
        ])->assertCreated();

        $opnameId = $this->withToken($token)
            ->postJson('/api/v1/inventory/opnames', [], array_merge(
                $this->tenantHeader($tenant->id),
                $this->outletHeader($outlet->id),
            ))
            ->assertCreated()
            ->assertJsonPath('data.status', 'IN_PROGRESS')
            ->json('data.id');

        $this->withToken($token)
            ->postJson("/api/v1/inventory/opnames/{$opnameId}/adjustments", [
                'product_variant_id' => $variant['id'],
                'counted_qty' => 40,
            ], array_merge(
                $this->tenantHeader($tenant->id),
                $this->outletHeader($outlet->id),
            ))
            ->assertCreated()
            ->assertJsonPath('data.system_qty', '50.00')
            ->assertJsonPath('data.counted_qty', '40.00')
            ->assertJsonPath('data.diff', '-10.00');

        $this->withToken($token)
            ->postJson("/api/v1/inventory/opnames/{$opnameId}/complete", [], array_merge(
                $this->tenantHeader($tenant->id),
                $this->outletHeader($outlet->id),
            ))
            ->assertOk()
            ->assertJsonPath('data.status', 'COMPLETED')
            ->assertJsonPath('data.movements_count', 1);

        $this->assertDatabaseHas('stocks', [
            'outlet_id' => $outlet->id,
            'product_variant_id' => $variant['id'],
            'quantity' => '40.00',
        ]);
        $this->assertDatabaseHas('stock_movements', [
            'product_variant_id' => $variant['id'],
            'quantity' => '-10.00',
            'movement_type' => 'OPNAME',
            'reference_type' => 'OPNAME',
            'reference_id' => $opnameId,
        ]);
        $this->assertDatabaseHas('stock_opnames', ['id' => $opnameId, 'status' => 'COMPLETED']);
    }

    public function test_opname_blocks_second_active_and_completed_opname_closed(): void
    {
        ['user' => $user, 'tenant' => $tenant, 'outlet' => $outlet] = $this->createTenantWithOwner();
        $token = $this->loginAs($user);
        $variant = $this->createProductViaApi($token, $tenant->id)['variant'];

        $headers = array_merge($this->tenantHeader($tenant->id), $this->outletHeader($outlet->id));

        $opnameId = $this->withToken($token)
            ->postJson('/api/v1/inventory/opnames', [], $headers)
            ->assertCreated()
            ->json('data.id');

        // Opname kedua di outlet yang sama saat masih berjalan → ditolak.
        $this->withToken($token)
            ->postJson('/api/v1/inventory/opnames', [], $headers)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('outlet_id');

        $this->withToken($token)
            ->postJson("/api/v1/inventory/opnames/{$opnameId}/complete", [], $headers)
            ->assertOk();

        // Opname yang sudah selesai tidak bisa ditambah hasil hitung / ditutup lagi.
        $this->withToken($token)
            ->postJson("/api/v1/inventory/opnames/{$opnameId}/adjustments", [
                'product_variant_id' => $variant['id'],
                'counted_qty' => 10,
            ], $headers)
            ->assertUnprocessable();

        $this->withToken($token)
            ->postJson("/api/v1/inventory/opnames/{$opnameId}/complete", [], $headers)
            ->assertUnprocessable();
    }

    public function test_opname_adjustment_is_upserted_per_variant(): void
    {
        ['user' => $user, 'tenant' => $tenant, 'outlet' => $outlet] = $this->createTenantWithOwner();
        $token = $this->loginAs($user);
        $variant = $this->createProductViaApi($token, $tenant->id)['variant'];

        $headers = array_merge($this->tenantHeader($tenant->id), $this->outletHeader($outlet->id));

        $this->adjustViaApi($token, $tenant->id, $outlet->id, [
            'product_variant_id' => $variant['id'],
            'quantity' => 50,
            'reason' => 'CORRECTION',
        ])->assertCreated();

        $opnameId = $this->withToken($token)
            ->postJson('/api/v1/inventory/opnames', [], $headers)
            ->json('data.id');

        $adjustmentUrl = "/api/v1/inventory/opnames/{$opnameId}/adjustments";
        $this->withToken($token)->postJson($adjustmentUrl, [
            'product_variant_id' => $variant['id'],
            'counted_qty' => 30,
        ], $headers)->assertCreated();

        // Input ulang varian yang sama → baris diperbarui, bukan ganda.
        $this->withToken($token)->postJson($adjustmentUrl, [
            'product_variant_id' => $variant['id'],
            'counted_qty' => 25,
        ], $headers)
            ->assertCreated()
            ->assertJsonPath('data.diff', '-25.00');

        // Hanya 1 baris hasil opname (baris direct-adjustment terpisah, opname_id null).
        $this->assertSame(1, DB::table('stock_adjustments')->where('stock_opname_id', $opnameId)->count());
        $this->assertDatabaseHas('stock_adjustments', [
            'stock_opname_id' => $opnameId,
            'product_variant_id' => $variant['id'],
            'diff' => '-25.00',
        ]);
    }

    public function test_stocks_low_stock_filter_and_status(): void
    {
        ['user' => $user, 'tenant' => $tenant, 'outlet' => $outlet] = $this->createTenantWithOwner();
        $token = $this->loginAs($user);

        $variants = [
            'A' => $this->createProductViaApi($token, $tenant->id, 'LOW-A')['variant'],
            'B' => $this->createProductViaApi($token, $tenant->id, 'LOW-B')['variant'],
            'C' => $this->createProductViaApi($token, $tenant->id, 'LOW-C')['variant'],
        ];

        $this->adjustViaApi($token, $tenant->id, $outlet->id, [
            'product_variant_id' => $variants['A']['id'], 'quantity' => 100, 'reason' => 'CORRECTION',
        ])->assertCreated();
        // B pernah ada stok lalu habis → baris stok tersisa dengan quantity 0.
        foreach (['B' => ['3', '-3'], 'C' => ['5']] as $key => $quantities) {
            foreach ($quantities as $quantity) {
                $this->adjustViaApi($token, $tenant->id, $outlet->id, [
                    'product_variant_id' => $variants[$key]['id'],
                    'quantity' => $quantity,
                    'reason' => 'CORRECTION',
                ])->assertCreated();
            }
        }

        $headers = array_merge($this->tenantHeader($tenant->id), $this->outletHeader($outlet->id));

        // B tanpa stok; C di bawah threshold 10 → keduanya "low".
        foreach (['B' => 'LOW-B', 'C' => 'LOW-C'] as $key => $sku) {
            $this->withToken($token)->postJson('/api/v1/inventory/low-stock-rules', [
                'product_variant_id' => $variants[$key]['id'],
                'threshold' => 10,
            ], $headers)->assertCreated();
        }

        $lowIds = collect($this->withToken($token)
            ->getJson('/api/v1/inventory/stocks?low_stock=true', $headers)
            ->assertOk()
            ->json('data'))
            ->pluck('variant.sku')
            ->all();

        $this->assertContains('LOW-B', $lowIds);
        $this->assertContains('LOW-C', $lowIds);
        $this->assertNotContains('LOW-A', $lowIds);

        // Status per baris pada daftar penuh.
        $rows = collect($this->withToken($token)
            ->getJson('/api/v1/inventory/stocks', $headers)
            ->assertOk()
            ->json('data'))
            ->keyBy('variant.sku');

        $this->assertSame('in_stock', $rows['LOW-A']['stock_status']);
        $this->assertSame('out_of_stock', $rows['LOW-B']['stock_status']);
        $this->assertSame('low_stock', $rows['LOW-C']['stock_status']);
    }

    public function test_low_stock_rule_crud_and_duplicate_rejected(): void
    {
        ['user' => $user, 'tenant' => $tenant, 'outlet' => $outlet] = $this->createTenantWithOwner();
        $token = $this->loginAs($user);
        $variant = $this->createProductViaApi($token, $tenant->id)['variant'];

        $headers = array_merge($this->tenantHeader($tenant->id), $this->outletHeader($outlet->id));

        $ruleId = $this->withToken($token)
            ->postJson('/api/v1/inventory/low-stock-rules', [
                'product_variant_id' => $variant['id'],
                'threshold' => 10,
            ], $headers)
            ->assertCreated()
            ->assertJsonPath('data.outlet_id', null)
            ->json('data.id');

        // Duplikat (varian + outlet yang sama, termasuk seluruh-outlet) → 422.
        $this->withToken($token)
            ->postJson('/api/v1/inventory/low-stock-rules', [
                'product_variant_id' => $variant['id'],
                'threshold' => 8,
            ], $headers)
            ->assertUnprocessable();

        $this->withToken($token)
            ->patchJson("/api/v1/inventory/low-stock-rules/{$ruleId}", [
                'threshold' => 5,
            ], $headers)
            ->assertOk()
            ->assertJsonPath('data.threshold', '5.00');

        $list = $this->withToken($token)->getJson('/api/v1/inventory/low-stock-rules', $headers)->assertOk();
        $this->assertCount(1, $list->json('data'));
    }

    public function test_movements_list_filters_and_paginates(): void
    {
        ['user' => $user, 'tenant' => $tenant, 'outlet' => $outlet] = $this->createTenantWithOwner();
        $token = $this->loginAs($user);
        $variant = $this->createProductViaApi($token, $tenant->id)['variant'];

        $headers = array_merge($this->tenantHeader($tenant->id), $this->outletHeader($outlet->id));

        $this->adjustViaApi($token, $tenant->id, $outlet->id, [
            'product_variant_id' => $variant['id'], 'quantity' => 8, 'reason' => 'CORRECTION',
        ])->assertCreated();
        $this->withToken($token)->postJson('/api/v1/inventory/receivings', [
            'items' => [['product_variant_id' => $variant['id'], 'quantity' => 3]],
        ], $headers)->assertCreated();

        $types = collect($this->withToken($token)
            ->getJson('/api/v1/inventory/stock-movements', $headers)
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->json('data'))
            ->pluck('movement_type')
            ->sort()
            ->values()
            ->all();

        $this->assertSame(['ADJUSTMENT', 'RECEIVING'], $types);

        $this->withToken($token)
            ->getJson('/api/v1/inventory/stock-movements?movement_type=ADJUSTMENT', $headers)
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.quantity', '8.00');
    }

    public function test_stock_isolation_across_outlets_and_tenants(): void
    {
        ['user' => $user, 'tenant' => $tenant, 'outlet' => $outlet] = $this->createTenantWithOwner();
        $token = $this->loginAs($user);
        $variant = $this->createProductViaApi($token, $tenant->id)['variant'];

        $outlet2 = DB::transaction(function () use ($tenant, $user) {
            Rls::setTenantContext($tenant->id);
            $outlet = Outlet::create([
                'tenant_id' => $tenant->id,
                'name' => 'Outlet 2',
                'business_type' => 'retail',
                'status' => 'ACTIVE',
            ]);
            $user->outletAssignments()->create([
                'tenant_id' => $tenant->id,
                'outlet_id' => $outlet->id,
                'status' => 'ACTIVE',
            ]);

            return $outlet;
        });

        $this->adjustViaApi($token, $tenant->id, $outlet->id, [
            'product_variant_id' => $variant['id'], 'quantity' => 10, 'reason' => 'CORRECTION',
        ])->assertCreated();
        $this->adjustViaApi($token, $tenant->id, $outlet2->id, [
            'product_variant_id' => $variant['id'], 'quantity' => 3, 'reason' => 'CORRECTION',
        ])->assertCreated();

        // Balance per outlet tidak saling memengaruhi.
        $perOutlet = $this->withToken($token)
            ->getJson("/api/v1/inventory/stocks/{$variant['id']}", $this->tenantHeader($tenant->id))
            ->assertOk()
            ->json('data.stocks');

        $quantities = collect($perOutlet)->keyBy('outlet_id');
        $this->assertSame('10.00', $quantities[$outlet->id]['quantity']);
        $this->assertSame('3.00', $quantities[$outlet2->id]['quantity']);

        // Varian milik tenant lain tidak dapat diakses/dipakai mutasi.
        ['user' => $foreignOwner, 'tenant' => $otherTenant] = $this->createTenantWithOwner('other@example.test', 'tenant-lain');
        $foreignToken = $this->loginAs($foreignOwner);
        $foreignVariant = $this->createProductViaApi($foreignToken, $otherTenant->id, 'FOREIGN')['variant'];

        $this->withToken($token)
            ->getJson("/api/v1/inventory/stocks/{$foreignVariant['id']}", $this->tenantHeader($tenant->id))
            ->assertNotFound();

        $this->adjustViaApi($token, $tenant->id, $outlet->id, [
            'product_variant_id' => $foreignVariant['id'], 'quantity' => 5, 'reason' => 'CORRECTION',
        ])->assertUnprocessable();
    }

    public function test_inventory_permissions_by_role(): void
    {
        ['user' => $user, 'tenant' => $tenant, 'outlet' => $outlet] = $this->createTenantWithOwner();
        $token = $this->loginAs($user);
        $variant = $this->createProductViaApi($token, $tenant->id)['variant'];

        $cashier = $this->addRoleUser($tenant, $outlet, 'CASHIER', 'cashier@example.test');
        $stockStaff = $this->addRoleUser($tenant, $outlet, 'INVENTORY', 'inventory@example.test');

        $headers = array_merge($this->tenantHeader($tenant->id), $this->outletHeader($outlet->id));

        // Kasir hanya boleh baca stok, bukan adjust.
        $cashierToken = $this->loginAs($cashier);
        $this->withToken($cashierToken)
            ->postJson('/api/v1/inventory/adjustments', [
                'product_variant_id' => $variant['id'], 'quantity' => 5, 'reason' => 'CORRECTION',
            ], $headers)
            ->assertForbidden();
        $this->withToken($cashierToken)
            ->getJson('/api/v1/inventory/stocks', $headers)
            ->assertOk();

        // Staff Inventory boleh adjust.
        $this->withToken($this->loginAs($stockStaff))
            ->postJson('/api/v1/inventory/adjustments', [
                'product_variant_id' => $variant['id'], 'quantity' => 5, 'reason' => 'CORRECTION',
            ], $headers)
            ->assertCreated();
    }

    public function test_active_opname_endpoint(): void
    {
        ['user' => $user, 'tenant' => $tenant, 'outlet' => $outlet] = $this->createTenantWithOwner();
        $token = $this->loginAs($user);

        $headers = array_merge($this->tenantHeader($tenant->id), $this->outletHeader($outlet->id));

        // Belum ada opname berjalan.
        $this->withToken($token)
            ->getJson('/api/v1/inventory/opnames/active', $headers)
            ->assertOk()
            ->assertJsonPath('data', null);

        $opnameId = $this->withToken($token)
            ->postJson('/api/v1/inventory/opnames', [], $headers)
            ->json('data.id');

        // Setelah dimulai → tampil sebagai opname aktif.
        $this->withToken($token)
            ->getJson('/api/v1/inventory/opnames/active', $headers)
            ->assertOk()
            ->assertJsonPath('data.id', $opnameId);

        $this->withToken($token)
            ->postJson("/api/v1/inventory/opnames/{$opnameId}/complete", [], $headers)
            ->assertOk();

        // Setelah selesai → tidak ada lagi yang aktif.
        $this->withToken($token)
            ->getJson('/api/v1/inventory/opnames/active', $headers)
            ->assertOk()
            ->assertJsonPath('data', null);
    }

    private function addRoleUser(Tenant $tenant, Outlet $outlet, string $roleCode, string $email): User
    {
        $user = User::factory()->create(['email' => $email]);

        DB::transaction(function () use ($user, $tenant, $outlet, $roleCode): void {
            Rls::setTenantContext($tenant->id);
            $roleId = Role::where('tenant_id', $tenant->id)->where('code', $roleCode)->value('id');
            $user->memberships()->create([
                'tenant_id' => $tenant->id,
                'role_id' => $roleId,
                'status' => 'ACTIVE',
            ]);
            $user->outletAssignments()->create([
                'tenant_id' => $tenant->id,
                'outlet_id' => $outlet->id,
                'status' => 'ACTIVE',
            ]);
        });

        return $user;
    }
}
