<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Pencatatan pembayaran terkait order. Metode MVP: cash, qr_payment,
     * bank_transfer, debit, credit. Gateway provider tertentu belum diintegrasikan;
     * status PAID untuk non-cash hanya diperoleh melalui jalur konfirmasi server-side.
     */
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->restrictOnDelete();
            $table->foreignId('business_id')->constrained()->restrictOnDelete();
            $table->foreignId('outlet_id')->constrained()->restrictOnDelete();
            $table->foreignId('membership_id')->nullable()->constrained('business_memberships')->restrictOnDelete();
            $table->string('method', 20);
            $table->index('method');
            $table->string('status', 20);
            $table->index('status');
            $table->unsignedInteger('amount');
            $table->string('reference', 255)->nullable(); // referensi provider / internal
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->index(['business_id', 'created_at']);
            $table->index(['business_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
