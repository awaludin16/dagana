<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('outlet_accesses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('membership_id')->constrained('business_memberships')->cascadeOnDelete();
            $table->foreignId('outlet_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['membership_id', 'outlet_id']);
            $table->index('outlet_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('outlet_accesses');
    }
};
