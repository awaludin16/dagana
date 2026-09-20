<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * RLS baseline (keputusan D1: shared schema + tenant_id + Postgres RLS).
 *
 * - Hanya berjalan di PostgreSQL (SQLite untuk tes lokal melewati ini).
 * - Setiap request, middleware TenantScope menjalankan:
 *     SELECT set_config('app.current_tenant_id', :tenant, true)
 *   di dalam transaksi; policy di bawah menggunakan setting tersebut.
 *
 * @see docs/Authentication-RBAC.md §8
 */
return new class extends Migration
{
    /**
     * Tabel bisnis yang dilindungi RLS oleh tenant_id.
     *
     * Catatan: `memberships` & `outlet_assignments` SENGAJA tidak masuk RLS —
     * endpoint /auth/me & /auth/switch-tenant perlu membaca keanggotaan
     * lintas-tenant, dan validasi keanggotaan sudah dilakukan secara eksplisit
     * oleh aplikasi (middleware TenantScope/OutletScope).
     */
    private const TENANT_TABLES = [
        'outlets',
        'roles',
        'categories',
        'products',
        'modifier_groups',
        'audit_logs',
    ];

    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('CREATE SCHEMA IF NOT EXISTS dagana;');

        DB::statement(<<<'SQL'
            CREATE OR REPLACE FUNCTION dagana.set_tenant_context(p_tenant uuid)
            RETURNS void
            LANGUAGE plpgsql
            AS $$
            BEGIN
                PERFORM set_config('app.current_tenant_id', p_tenant::text, true);
            END;
            $$;
        SQL);

        foreach (self::TENANT_TABLES as $table) {
            DB::statement("ALTER TABLE {$table} ENABLE ROW LEVEL SECURITY;");
            DB::statement("DROP POLICY IF EXISTS tenant_isolation ON {$table};");
            DB::statement(
                "CREATE POLICY tenant_isolation ON {$table}
                    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);"
            );
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        foreach (self::TENANT_TABLES as $table) {
            DB::statement("DROP POLICY IF EXISTS tenant_isolation ON {$table};");
            DB::statement("ALTER TABLE {$table} DISABLE ROW LEVEL SECURITY;");
        }
    }
};
