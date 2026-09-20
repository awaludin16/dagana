<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Inventory (docs/ERD.md §Inventory + docs/API-Specification.md §4.5).
 *
 * Prinsip PRD §12: stock hanya berubah melalui `stock_movements` (append-only
 * ledger, quantity bertanda) — `stocks` adalah ringkasan materialized yang
 * diperbarui dalam transaksi yang sama.
 *
 * Semua tabel men-*denormalisasi* `tenant_id` (pola sama seperti
 * `product_variants`) agar isolasi tenant konsisten lewat satu policy RLS.
 */
return new class extends Migration
{
    /** Tabel inventori baru yang dilindungi RLS tenant_id (PostgreSQL). */
    private const INVENTORY_TABLES = [
        'stocks',
        'stock_movements',
        'stock_receivings',
        'stock_receiving_items',
        'stock_opnames',
        'stock_adjustments',
        'low_stock_rules',
    ];

    public function up(): void
    {
        Schema::create('stocks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('outlet_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('product_variant_id')->constrained()->cascadeOnDelete();
            $table->decimal('quantity', 15, 2)->default(0);
            $table->timestamps();

            $table->unique(['outlet_id', 'product_variant_id']);
            $table->index(['tenant_id']);
            $table->index(['product_variant_id']);
        });

        // Append-only ledger. quantity bertanda: + masuk, − keluar.
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('outlet_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('product_variant_id')->constrained()->cascadeOnDelete();
            $table->decimal('quantity', 15, 2);
            $table->string('movement_type'); // ADJUSTMENT | OPNAME | RECEIVING | SALE
            $table->string('reference_type')->nullable(); // jenis dokumen asal
            $table->uuid('reference_id')->nullable(); // id dokumen asal
            $table->string('reason')->nullable();
            $table->string('note')->nullable();
            $table->foreignUuid('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['tenant_id']);
            $table->index(['outlet_id', 'product_variant_id']);
            $table->index(['movement_type']);
            $table->index(['created_at']);
        });

        Schema::create('stock_receivings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('outlet_id')->constrained()->cascadeOnDelete();
            $table->timestamp('received_at')->nullable();
            $table->string('note')->nullable();
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['tenant_id']);
        });

        Schema::create('stock_receiving_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('stock_receiving_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('product_variant_id')->constrained()->cascadeOnDelete();
            $table->decimal('quantity', 15, 2);
            $table->decimal('cost_price', 15, 2)->default(0);
            $table->timestamps();

            $table->index(['tenant_id']);
            $table->index(['stock_receiving_id']);
        });

        Schema::create('stock_opnames', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('outlet_id')->constrained()->cascadeOnDelete();
            $table->timestamp('started_at');
            $table->timestamp('completed_at')->nullable();
            $table->string('status')->default('IN_PROGRESS'); // IN_PROGRESS | COMPLETED | CANCELLED
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['tenant_id']);
            $table->index(['outlet_id', 'status']);
        });

        Schema::create('stock_adjustments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('outlet_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('product_variant_id')->constrained()->cascadeOnDelete();
            $table->decimal('system_qty', 15, 2);
            $table->decimal('counted_qty', 15, 2);
            $table->decimal('diff', 15, 2);
            $table->string('reason')->nullable();
            $table->foreignUuid('stock_opname_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['tenant_id']);
            $table->index(['stock_opname_id']);
        });

        Schema::create('low_stock_rules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('product_variant_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('outlet_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('threshold', 15, 2);
            $table->timestamps();

            // null outlet_id = berlaku untuk seluruh outlet tenant. Keunikan
            // untuk (variant, outlet-null) dijaga di lapisan aplikasi karena
            // PostgreSQL memperlakukan NULL sebagai unik.
            $table->unique(['tenant_id', 'product_variant_id', 'outlet_id'], 'low_stock_rules_unique');
            $table->index(['tenant_id']);
        });

        $this->enableRls();
    }

    public function down(): void
    {
        $this->disableRls();

        Schema::dropIfExists('low_stock_rules');
        Schema::dropIfExists('stock_adjustments');
        Schema::dropIfExists('stock_opnames');
        Schema::dropIfExists('stock_receiving_items');
        Schema::dropIfExists('stock_receivings');
        Schema::dropIfExists('stock_movements');
        Schema::dropIfExists('stocks');
    }

    private function enableRls(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        foreach (self::INVENTORY_TABLES as $table) {
            DB::statement("ALTER TABLE {$table} ENABLE ROW LEVEL SECURITY;");
            DB::statement("DROP POLICY IF EXISTS tenant_isolation ON {$table};");
            DB::statement(
                "CREATE POLICY tenant_isolation ON {$table}
                    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);"
            );
        }
    }

    private function disableRls(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        foreach (self::INVENTORY_TABLES as $table) {
            DB::statement("DROP POLICY IF EXISTS tenant_isolation ON {$table};");
            DB::statement("ALTER TABLE {$table} DISABLE ROW LEVEL SECURITY;");
        }
    }
};
