<?php

namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    /**
     * Katalog permission global (PRD §17 + docs/Authentication-RBAC.md §5.2).
     *
     * @var array<string, string> code => deskripsi
     */
    public const CATALOG = [
        'tenants.read' => 'Melihat tenant',
        'tenants.update' => 'Memperbarui tenant',

        'outlets.read' => 'Melihat outlet',
        'outlets.create' => 'Membuat outlet',
        'outlets.update' => 'Memperbarui outlet',
        'outlets.delete' => 'Menghapus outlet',

        'users.read' => 'Melihat user',
        'users.create' => 'Membuat user',
        'users.update' => 'Memperbarui user',
        'users.delete' => 'Menghapus user',

        'roles.read' => 'Melihat role',
        'roles.update' => 'Memperbarui role',

        'categories.read' => 'Melihat kategori',
        'categories.create' => 'Membuat kategori',
        'categories.update' => 'Memperbarui kategori',
        'categories.delete' => 'Menghapus kategori',

        'products.read' => 'Melihat produk',
        'products.create' => 'Membuat produk',
        'products.update' => 'Memperbarui produk',
        'products.delete' => 'Menghapus produk',

        'inventory.read' => 'Melihat stok & movement',
        'inventory.adjust' => 'Melakukan stock adjustment',
        'inventory.stock_opname' => 'Melakukan stock opname',
        'inventory.receiving' => 'Menerima barang masuk',

        'orders.read' => 'Melihat order',
        'orders.create' => 'Membuat order',
        'orders.cancel' => 'Membatalkan order',
        'orders.refund' => 'Melakukan refund',

        'payments.read' => 'Melihat payment',
        'payments.create' => 'Membuat payment',
        'payments.refund' => 'Refund payment',

        'tables.read' => 'Melihat table',
        'tables.create' => 'Membuat table',
        'tables.update' => 'Memperbarui table',

        'menu.read' => 'Melihat menu',
        'menu.update' => 'Memperbarui menu',

        'customers.read' => 'Melihat customer',
        'customers.create' => 'Membuat customer',
        'customers.update' => 'Memperbarui customer',

        'reports.read' => 'Melihat laporan',
        'audit_logs.read' => 'Melihat audit log',
    ];

    public function run(): void
    {
        foreach (self::CATALOG as $code => $description) {
            Permission::firstOrCreate(['code' => $code], ['description' => $description]);
        }
    }
}
