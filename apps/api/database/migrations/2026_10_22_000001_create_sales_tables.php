<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('business_id')->constrained()->restrictOnDelete();
            $table->foreignId('outlet_id')->constrained()->restrictOnDelete();
            $table->foreignId('actor_user_id')->constrained('users')->restrictOnDelete();
            $table->string('source')->default('POS');
            $table->string('status')->default('PENDING_PAYMENT');
            $table->string('idempotency_key', 128);
            $table->char('request_hash', 64);
            $table->unsignedBigInteger('total');
            $table->timestamps();

            $table->unique(['business_id', 'outlet_id', 'idempotency_key']);
            $table->index(['business_id', 'outlet_id', 'created_at']);
            $table->index(['business_id', 'outlet_id', 'status', 'created_at']);
        });

        Schema::create('order_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('menu_id')->nullable()->constrained()->nullOnDelete();
            $table->string('menu_name', 150);
            $table->unsignedInteger('quantity');
            $table->unsignedBigInteger('unit_price');
            $table->unsignedBigInteger('total');
            $table->timestamps();

            $table->index(['order_id', 'id']);
        });

        Schema::create('payments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('order_id')->unique()->constrained()->restrictOnDelete();
            $table->string('method');
            $table->unsignedBigInteger('amount');
            $table->string('status')->default('PENDING');
            $table->string('reference')->nullable();
            $table->foreignId('actor_user_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('confirmed_by_user_id')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
    }
};
