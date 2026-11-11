<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ledger stok append-only. Saldo tidak disimpan terpisah: saldo item
     * adalah penjumlahan quantity_change sehingga selalu dapat direkonsiliasi.
     * amount bertanda: masuk positif, keluar negatif.
     */
    public function up(): void
    {
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->restrictOnDelete();
            $table->foreignId('outlet_id')->constrained()->restrictOnDelete();
            $table->foreignId('inventory_item_id')->constrained()->restrictOnDelete();
            $table->foreignId('membership_id')->nullable()->constrained('business_memberships')->restrictOnDelete();
            $table->string('type', 20);
            $table->integer('quantity_change');
            $table->string('reason', 1000);
            $table->uuid('idempotency_key');
            $table->timestamps();

            // Retry adjustment dengan key sama tidak boleh membuat movement ganda.
            $table->unique(['business_id', 'idempotency_key']);
            $table->index(['inventory_item_id', 'created_at']);
            $table->index(['business_id', 'outlet_id', 'created_at']);
        });

        DB::statement(
            'ALTER TABLE stock_movements
            ADD CONSTRAINT stock_movements_quantity_change_not_zero
            CHECK (quantity_change <> 0)'
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
