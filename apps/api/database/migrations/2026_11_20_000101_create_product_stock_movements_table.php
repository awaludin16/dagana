<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Ledger append-only: FK ke product/outlet boleh null agar histori
        // tetap ada bila master data dihapus setelah transaksi selesai.
        Schema::create('product_stock_movements', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('business_id')->constrained()->restrictOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('outlet_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('membership_id')->nullable()->constrained('business_memberships')->nullOnDelete();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->string('product_name');
            $table->integer('quantity_change');
            $table->string('type');
            $table->string('reason')->nullable();
            $table->timestamp('created_at');

            $table->index(['business_id', 'outlet_id', 'created_at']);
            $table->unique(['order_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_stock_movements');
    }
};
