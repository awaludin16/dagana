<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Business only keeps its name; contact and address belong to Outlet.
     */
    public function up(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->dropColumn(['phone', 'street', 'district', 'regency', 'province', 'postal_code']);
        });

        Schema::table('outlets', function (Blueprint $table) {
            $table->string('village')->nullable()->after('street');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('outlets', function (Blueprint $table) {
            $table->dropColumn('village');
        });

        Schema::table('businesses', function (Blueprint $table) {
            $table->string('phone', 30)->nullable();
            $table->string('street')->nullable();
            $table->string('district')->nullable();
            $table->string('regency')->nullable();
            $table->string('province')->nullable();
            $table->string('postal_code', 10)->nullable();
        });
    }
};
