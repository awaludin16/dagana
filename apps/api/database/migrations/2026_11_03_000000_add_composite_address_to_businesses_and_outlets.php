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
        foreach (['businesses', 'outlets'] as $table) {
            Schema::table($table, function (Blueprint $table) {
                $table->string('street')->nullable();
                $table->string('district')->nullable();
                $table->string('regency')->nullable();
                $table->string('province')->nullable();
                $table->string('postal_code', 10)->nullable();
            });

            // Keep any existing free-text address as the street line.
            DB::table($table)->whereNotNull('address')->update(['street' => DB::raw('address')]);

            Schema::table($table, function (Blueprint $table) {
                $table->dropColumn('address');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        foreach (['businesses', 'outlets'] as $table) {
            Schema::table($table, function (Blueprint $table) {
                $table->text('address')->nullable();
            });

            DB::table($table)->whereNotNull('street')->update(['address' => DB::raw('street')]);

            Schema::table($table, function (Blueprint $table) {
                $table->dropColumn(['street', 'district', 'regency', 'province', 'postal_code']);
            });
        }
    }
};
