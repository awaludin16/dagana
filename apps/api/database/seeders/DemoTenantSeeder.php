<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Outlet;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
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

        $outlet = Outlet::firstOrCreate(
            ['tenant_id' => $tenant->id, 'name' => 'Bandung'],
            ['address' => 'Jl. Braga No. 12, Bandung', 'business_type' => 'restaurant'],
        );

        $user = User::firstOrCreate(
            ['email' => self::DEMO_EMAIL],
            ['name' => 'Owner Demo', 'password' => 'password'],
        );

        DB::transaction(function () use ($tenant, $outlet, $user): void {
            // Set konteks RLS agar insert katalog & roles tidak ditolak policy.
            Rls::setTenantContext($tenant->id);

            RolesSeeder::runForTenant($tenant);

            $ownerRole = Role::where('tenant_id', $tenant->id)->where('code', 'OWNER')->first();
            $this->firstCreateMembership($user, $tenant, $ownerRole);
            $this->firstCreateAssignment($user, $tenant, $outlet);

            $this->createDemoCatalog($tenant);
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
            'sku' => 'KPG-BDG-001',
            'barcode' => '899'.Str::random(10),
            'unit' => 'cup',
            'price' => 18000,
            'cost_price' => 9000,
            'status' => 'ACTIVE',
        ]);
    }
}
