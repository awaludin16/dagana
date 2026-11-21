<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('product_outlet_availabilities');
    }

    public function down(): void
    {
        Schema::create('product_outlet_availabilities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->foreignId('outlet_id')->constrained()->restrictOnDelete();
            $table->boolean('is_available');
            $table->timestamps();

            $table->unique(['product_id', 'outlet_id']);
        });
    }
};
