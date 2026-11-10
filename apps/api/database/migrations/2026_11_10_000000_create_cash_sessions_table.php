<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Cash Session adalah konteks tanggung jawab kas per operator per outlet
     * (D-06). Satu operator hanya boleh memiliki satu session aktif pada satu
     * outlet (D-07); batas itu diproteksi partial unique index di database agar
     * request bersamaan tidak meloloskan dua session.
     */
    public function up(): void
    {
        Schema::create('cash_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->restrictOnDelete();
            $table->foreignId('outlet_id')->constrained()->restrictOnDelete();
            $table->foreignId('operator_membership_id')->constrained('business_memberships')->restrictOnDelete();
            $table->string('status', 20);
            $table->index('status');
            $table->unsignedInteger('opening_cash');
            $table->unsignedInteger('actual_cash')->nullable();
            $table->integer('expected_cash')->nullable();
            $table->integer('variance')->nullable(); // actual_cash - expected_cash, bisa minus
            $table->text('variance_note')->nullable();
            $table->timestamp('opened_at');
            $table->timestamp('closed_at')->nullable();
            $table->foreignId('closed_by_membership_id')->nullable()->constrained('business_memberships')->restrictOnDelete();
            $table->timestamps();

            $table->index(['business_id', 'outlet_id', 'status']);
        });

        DB::statement(
            "CREATE UNIQUE INDEX cash_sessions_unique_active_operator
            ON cash_sessions (business_id, outlet_id, operator_membership_id)
            WHERE status = 'OPEN'"
        );
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS cash_sessions_unique_active_operator');
        Schema::dropIfExists('cash_sessions');
    }
};
