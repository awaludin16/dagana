<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Keputusan Product Owner (2026-11-16): phone dan seluruh komponen alamat
// outlet wajib diisi. Data lama yang masih kosong di-backfill string kosong
// agar constraint NOT NULL bisa diterapkan; data development saja.
return new class extends Migration
{
    private const COLUMNS = [
        'phone' => ['type' => 'string', 'length' => 30],
        'street' => ['type' => 'string', 'length' => null],
        'village' => ['type' => 'string', 'length' => null],
        'district' => ['type' => 'string', 'length' => null],
        'regency' => ['type' => 'string', 'length' => null],
        'province' => ['type' => 'string', 'length' => null],
        'postal_code' => ['type' => 'string', 'length' => 10],
    ];

    public function up(): void
    {
        foreach (array_keys(self::COLUMNS) as $column) {
            DB::table('outlets')->whereNull($column)->update([$column => '']);
        }

        Schema::table('outlets', function (Blueprint $table) {
            foreach (self::COLUMNS as $column => $definition) {
                $table->string($column, $definition['length'] ?? null)->change();
            }
        });
    }

    public function down(): void
    {
        Schema::table('outlets', function (Blueprint $table) {
            foreach (self::COLUMNS as $column => $definition) {
                $table->string($column, $definition['length'] ?? null)->nullable()->change();
            }
        });
    }
};
