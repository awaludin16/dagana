<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('business_memberships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->restrictOnDelete();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->string('role', 20);
            $table->string('status', 20)->default('ACTIVE');
            $table->timestamps();

            // MVP: one user belongs to exactly one business.
            $table->unique('user_id');
            $table->index(['business_id', 'role']);
        });

        // MVP: one business has exactly one owner.
        DB::statement(
            "CREATE UNIQUE INDEX business_memberships_one_owner_per_business
             ON business_memberships (business_id)
             WHERE role = 'OWNER'"
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('business_memberships');
    }
};
