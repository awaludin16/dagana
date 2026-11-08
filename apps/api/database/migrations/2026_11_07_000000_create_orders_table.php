<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Order adalah akar transaksi inti (Order Engine). Semua order scoped
     * ke Business dan Outlet; idempotency_key mencegah duplikasi saat retry checkout.
     */
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->restrictOnDelete();
            $table->foreignId('outlet_id')->constrained()->restrictOnDelete();
            $table->foreignId('membership_id')->constrained('business_memberships')->restrictOnDelete();
            $table->string('source', 10)->default('POS');
            $table->index('source');
            $table->string('status', 20)->default('PENDING');
            $table->index('status');
            $table->unsignedInteger('total_amount');
            $table->string('idempotency_key', 255)->unique();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['business_id', 'created_at']);
            $table->index(['business_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
