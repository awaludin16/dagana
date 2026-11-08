<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Order item menyimpan snapshot nama dan harga pada saat transaksi,
     * sehingga perubahan catalog kemudian tidak mengubah histori order.
     */
    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->restrictOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->restrictOnDelete();
            $table->string('product_name'); // snapshot nama menu saat checkout
            $table->unsignedInteger('product_price'); // snapshot harga (IDR utuh) saat checkout
            $table->unsignedInteger('quantity');
            $table->unsignedInteger('total'); // product_price × quantity (snapshot)
            $table->timestamps();

            $table->index('product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
