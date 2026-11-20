<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * D-36: hapus seluruh modul inventory bahan baku beserta datanya.
     * Migration pembuat tabel lama sengaja dibiarkan sebagai arsip skema.
     */
    public function up(): void
    {
        DB::table('membership_permission_overrides')
            ->where('permission', 'like', 'inventory.%')
            ->delete();

        Schema::dropIfExists('stock_movements');
        Schema::dropIfExists('inventory_items');
    }

    public function down(): void
    {
        // Data yang dihapus tidak dapat dipulihkan; rollback hanya tidak melakukan apa pun.
    }
};
