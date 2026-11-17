<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // D-04 revisi (2026-11-17): Owner dapat menambahkan izin di luar preset
        // role. Preset tidak pernah tersimpan di sini, jadi tidak bisa dicabut.
        Schema::create('membership_permission_overrides', function (Blueprint $table) {
            $table->id();
            $table->foreignId('membership_id')->constrained('business_memberships')->cascadeOnDelete();
            $table->string('permission', 50);
            $table->timestamps();

            $table->unique(['membership_id', 'permission']);
            $table->index('permission');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('membership_permission_overrides');
    }
};
