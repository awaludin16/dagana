<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;

/**
 * Matriks role → permission (docs/Authentication-RBAC.md §6).
 */
class RolesSeeder
{
    /**
     * code role => list permission
     *
     * @return array<string, list<string>>
     */
    public static function matrix(): array
    {
        $all = array_keys(PermissionSeeder::CATALOG);

        return [
            'OWNER' => $all,
            'MANAGER' => [
                'outlets.read', 'users.read', 'roles.read',
                'categories.read', 'categories.create', 'categories.update',
                'products.read', 'products.create', 'products.update',
                'inventory.read', 'inventory.adjust', 'inventory.stock_opname', 'inventory.receiving',
                'orders.read', 'orders.create', 'orders.cancel', 'orders.refund',
                'payments.read', 'payments.create', 'payments.refund',
                'tables.read', 'tables.create', 'tables.update',
                'menu.read', 'menu.update',
                'customers.read', 'customers.create', 'customers.update',
                'reports.read', 'audit_logs.read',
            ],
            'CASHIER' => [
                'products.read',
                'inventory.read',
                'orders.read', 'orders.create',
                'payments.read', 'payments.create',
                'tables.read',
                'menu.read',
                'customers.read', 'customers.create',
            ],
            'INVENTORY' => [
                'products.read',
                'inventory.read', 'inventory.adjust', 'inventory.stock_opname', 'inventory.receiving',
                'orders.read',
                'payments.read',
                'customers.read',
            ],
        ];
    }

    /**
     * Membuat role built-in berikut permission-nya untuk satu tenant.
     */
    public static function runForTenant(Tenant $tenant): void
    {
        foreach (self::matrix() as $code => $permissions) {
            $role = Role::updateOrCreate(
                ['tenant_id' => $tenant->id, 'code' => $code],
                ['name' => self::displayName($code)],
            );

            $role->permissions()->sync(
                Permission::whereIn('code', $permissions)->pluck('id'),
            );
        }
    }

    public static function displayName(string $code): string
    {
        return match ($code) {
            'OWNER' => 'Owner',
            'MANAGER' => 'Manager',
            'CASHIER' => 'Kasir',
            'INVENTORY' => 'Staff Inventory',
            default => $code,
        };
    }
}
