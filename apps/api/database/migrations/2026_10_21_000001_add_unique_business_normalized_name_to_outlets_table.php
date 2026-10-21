<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private const INDEX_NAME = 'outlets_business_normalized_name_unique';

    public function up(): void
    {
        DB::statement(
            'CREATE UNIQUE INDEX '.self::INDEX_NAME.' ON outlets (business_id, LOWER(TRIM(name)))',
        );
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS '.self::INDEX_NAME);
    }
};
