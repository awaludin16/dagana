<?php

namespace Tests\Concerns;

use App\Models\Outlet;
use App\Models\Tenant;
use App\Models\User;
use App\Support\Rls;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RolesSeeder;
use Illuminate\Support\Facades\DB;

/**
 * Helper membangun tenant + OWNER + outlet untuk test.
 */
trait CreatesTenant
{
    /**
     * @return array{user: User, tenant: Tenant, outlet: Outlet}
     */
    protected function createTenantWithOwner(string $email = 'owner@example.test', string $slug = 'tenant'): array
    {
        // RefreshDatabase hanya migrasi; katalog permission (global) perlu
        // tersedia agar matriks role → permission (RolesSeeder) dapat disinkron.
        $this->seed(PermissionSeeder::class);

        $user = User::factory()->create(['email' => $email]);

        $tenant = DB::transaction(function () use ($slug) {
            $tenant = Tenant::create([
                'name' => 'Tenant '.$slug,
                'slug' => $slug,
                'status' => 'ACTIVE',
            ]);

            // Konteks RLS agar insert role/outlet (tabel ber-tenant) lolos policy.
            Rls::setTenantContext($tenant->id);

            RolesSeeder::runForTenant($tenant);

            $outlet = Outlet::create([
                'tenant_id' => $tenant->id,
                'name' => 'Outlet '.$slug,
                'business_type' => 'retail',
                'status' => 'ACTIVE',
            ]);

            $tenant->setRelation('outlet', $outlet);

            return $tenant;
        });

        $outlet = $tenant->getRelation('outlet');

        $user->memberships()->create([
            'tenant_id' => $tenant->id,
            'role_id' => $tenant->roles()->where('code', 'OWNER')->value('id'),
            'status' => 'ACTIVE',
        ]);

        $user->outletAssignments()->create([
            'tenant_id' => $tenant->id,
            'outlet_id' => $outlet->id,
            'status' => 'ACTIVE',
        ]);

        return ['user' => $user, 'tenant' => $tenant, 'outlet' => $outlet];
    }

    protected function loginAs(User $user): string
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        return $response->json('data.access_token');
    }

    protected function tenantHeader(string $tenantId): array
    {
        return ['X-Tenant-Context' => $tenantId];
    }
}
