<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ledger kas append-only: setiap arus kas (sale, cash in/out, refund,
     * adjustment) punya baris sendiri; saldo tidak pernah diubah tanpa riwayat.
     * `amount` bersifat bertanda: arus masuk positif, arus keluar (out, refund)
     * negatif, adjustment mengikuti arusnya.
     */
    public function up(): void
    {
        Schema::create('cash_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cash_session_id')->constrained('cash_sessions')->restrictOnDelete();
            $table->foreignId('business_id')->constrained()->restrictOnDelete();
            $table->foreignId('outlet_id')->constrained()->restrictOnDelete();
            $table->foreignId('membership_id')->nullable()->constrained('business_memberships')->restrictOnDelete();
            $table->string('type', 20);
            $table->index('type');
            $table->integer('amount');
            $table->string('reason', 1000)->nullable();
            $table->timestamps();

            $table->index(['cash_session_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cash_movements');
    }
};
