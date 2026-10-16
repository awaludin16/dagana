<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('membership_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('membership_id')->constrained()->cascadeOnDelete();
            $table->string('permission');
            $table->string('effect');
            $table->timestamps();

            // Satu permission hanya boleh punya satu override per membership;
            // `effect` menentukan apakah ia menambah atau mencabut.
            $table->unique(['membership_id', 'permission']);
            $table->index(['membership_id', 'effect']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('membership_permissions');
    }
};
