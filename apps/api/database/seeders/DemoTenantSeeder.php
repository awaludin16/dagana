<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\LowStockRule;
use App\Models\Outlet;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Role;
use App\Models\StockMovement;
use App\Models\Tenant;
use App\Models\User;
use App\Services\StockService;
use App\Support\Rls;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Data demo Phase 0: satu merchant (OWNER) + outlet + katalog contoh.
 *
 * Kredensial:
 *     email: owner@dagana.test
 *     password: password
 */
class DemoTenantSeeder extends Seeder
{
    public const DEMO_EMAIL = 'owner@dagana.test';

    public function run(): void
    {
        $tenant = Tenant::firstOrCreate(
            ['slug' => 'demo-cafe'],
            ['name' => 'Demo Cafe', 'status' => 'ACTIVE', 'plan' => 'free'],
        );

        DB::transaction(function () use ($tenant): void {
            // Set konteks RLS agar insert katalog, roles, & outlet tidak ditolak policy.
            Rls::setTenantContext($tenant->id);

            $outlet = Outlet::firstOrCreate(
                ['tenant_id' => $tenant->id, 'name' => 'Bandung'],
                ['address' => 'Jl. Braga No. 12, Bandung', 'business_type' => 'restaurant'],
            );

            $user = User::firstOrCreate(
                ['email' => self::DEMO_EMAIL],
                ['name' => 'Owner Demo', 'password' => 'password'],
            );

            RolesSeeder::runForTenant($tenant);

            $ownerRole = Role::where('tenant_id', $tenant->id)->where('code', 'OWNER')->first();
            $this->firstCreateMembership($user, $tenant, $ownerRole);
            $this->firstCreateAssignment($user, $tenant, $outlet);

            $this->createDemoCatalog($tenant);
            $this->seedDemoStock($tenant, $outlet, $user);
        });
    }

    private function firstCreateMembership(User $user, Tenant $tenant, ?Role $role): void
    {
        $existing = $user->memberships()->where('tenant_id', $tenant->id)->first();
        if ($existing) {
            return;
        }

        $user->memberships()->create([
            'tenant_id' => $tenant->id,
            'role_id' => $role?->id,
            'status' => 'ACTIVE',
        ]);
    }

    private function firstCreateAssignment(User $user, Tenant $tenant, Outlet $outlet): void
    {
        $existing = $user->outletAssignments()
            ->where('tenant_id', $tenant->id)
            ->where('outlet_id', $outlet->id)
            ->first();
        if ($existing) {
            return;
        }

        $user->outletAssignments()->create([
            'tenant_id' => $tenant->id,
            'outlet_id' => $outlet->id,
            'status' => 'ACTIVE',
        ]);
    }

    private function createDemoCatalog(Tenant $tenant): void
    {
        if (Category::where('tenant_id', $tenant->id)->exists()) {
            return;
        }

        $category = Category::create([
            'tenant_id' => $tenant->id,
            'name' => 'Minuman',
            'sort_order' => 1,
        ]);

        $product = Product::create([
            'tenant_id' => $tenant->id,
            'category_id' => $category->id,
            'name' => 'Kopi Susu Gula Aren',
            'description' => 'Espresso dengan gula aren dan susu segar.',
            'status' => 'ACTIVE',
        ]);

        ProductVariant::create([
            'product_id' => $product->id,
            'tenant_id' => $tenant->id,
            'sku' => 'KPG-BDG-001',
            'barcode' => '899'.Str::random(10),
            'unit' => 'cup',
            'price' => 18000,
            'cost_price' => 9000,
            'status' => 'ACTIVE',
        ]);

        $water = Product::create([
            'tenant_id' => $tenant->id,
            'category_id' => $category->id,
            'name' => 'Air Mineral',
            'status' => 'ACTIVE',
        ]);

        ProductVariant::create([
            'product_id' => $water->id,
            'tenant_id' => $tenant->id,
            'sku' => 'AMN-BDG-001',
            'barcode' => '899'.Str::random(10),
            'unit' => 'botol',
            'price' => 5000,
            'cost_price' => 2500,
            'status' => 'ACTIVE',
        ]);
    }

    /**
     * Stok awal demo: melalui StockService (jalur resmi — ledger append-only).
     */
    private function seedDemoStock(Tenant $tenant, Outlet $outlet, User $user): void
    {
        if (StockMovement::where('tenant_id', $tenant->id)->exists()) {
            return;
        }

        $service = app(StockService::class);
        $actorId = (string) $user->id;

        $sugarMilk = ProductVariant::where('tenant_id', $tenant->id)->where('sku', 'KPG-BDG-001')->first();
        $water = ProductVariant::where('tenant_id', $tenant->id)->where('sku', 'AMN-BDG-001')->first();

        if ($sugarMilk) {
            $service->move($sugarMilk, (string) $outlet->id, 120, 'RECEIVING', 'RECEIVING', null, 'Stock awal', 'Seed demo', $actorId);
            LowStockRule::firstOrCreate(
                ['tenant_id' => $tenant->id, 'product_variant_id' => $sugarMilk->id, 'outlet_id' => null],
                ['threshold' => 30],
            );
        }

        if ($water) {
            $service->move($water, (string) $outlet->id, 5, 'RECEIVING', 'RECEIVING', null, 'Stock awal', 'Seed demo', $actorId);
            LowStockRule::firstOrCreate(
                ['tenant_id' => $tenant->id, 'product_variant_id' => $water->id, 'outlet_id' => null],
                ['threshold' => 20],
            );
        }
    }
}
