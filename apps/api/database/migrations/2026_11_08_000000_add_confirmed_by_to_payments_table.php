<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Audit trail konfirmasi pembayaran manual: mencatat anggota yang
     * memverifikasi dan mengonfirmasi pembayaran non-tunai menjadi PAID.
     */
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->foreignId('confirmed_by')->nullable()->after('membership_id')
                ->constrained('business_memberships')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('confirmed_by');
        });
    }
};
