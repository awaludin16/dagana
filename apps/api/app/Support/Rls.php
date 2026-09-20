<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

/**
 * Helper menetapkan konteks RLS di dalam transaksi aktif.
 *
 * PostgreSQL menuntut konteks berada di transaksi yang sama dengan query
 * (`SET LOCAL`). Driver lain (SQLite untuk tes lokal) mengabaikan pemanggilan
 * ini — isolasi tetap dijaga di lapisan aplikasi.
 */
class Rls
{
    public static function setTenantContext(?string $tenantId): void
    {
        self::set('app.current_tenant_id', $tenantId);
    }

    public static function setOutletContext(?string $outletId): void
    {
        self::set('app.current_outlet_id', $outletId);
    }

    protected static function set(string $key, ?string $value): void
    {
        if (DB::getDriverName() !== 'pgsql' || $value === null) {
            return;
        }

        DB::statement('SELECT set_config(?, ?, true)', [$key, $value]);
    }
}
