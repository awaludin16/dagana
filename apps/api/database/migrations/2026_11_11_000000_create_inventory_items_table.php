<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Basic inventory item dimiliki satu Outlet. Kuantitas disimpan sebagai
     * integer pada base unit item; unit conversion dan costing belum termasuk
     * scope Phase 6 (D-09/D-10).
     */
    public function up(): void
    {
        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->restrictOnDelete();
            $table->foreignId('outlet_id')->constrained()->restrictOnDelete();
            $table->string('name');
            $table->string('unit', 20);
            $table->unsignedInteger('low_stock_threshold')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['business_id', 'outlet_id', 'is_active']);
            $table->index(['outlet_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_items');
    }
};
