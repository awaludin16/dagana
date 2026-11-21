<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_stocks', function (Blueprint $table): void {
            $table->unsignedInteger('low_stock_threshold')->nullable()->after('quantity');
        });

        // Baris yang sudah dipantau sebelum kolom ini ada memakai default D-38.
        DB::table('product_stocks')
            ->whereNull('low_stock_threshold')
            ->update(['low_stock_threshold' => 10]);
    }

    public function down(): void
    {
        Schema::table('product_stocks', function (Blueprint $table): void {
            $table->dropColumn('low_stock_threshold');
        });
    }
};
