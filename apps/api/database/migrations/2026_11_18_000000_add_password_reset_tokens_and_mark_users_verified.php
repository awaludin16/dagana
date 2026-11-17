<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tabel bisa sudah ada dari scaffold sebelumnya di DB lama; guard agar
        // migration tetap aman dijalankan ulang.
        if (! Schema::hasTable('password_reset_tokens')) {
            Schema::create('password_reset_tokens', function (Blueprint $table) {
                $table->string('email')->primary();
                $table->string('token');
                $table->timestamp('created_at')->nullable();
            });
        }

        // User yang terdaftar sebelum fitur verifikasi email tidak diwajibkan
        // memverifikasi ulang (grandfathered); akun baru yang self-register
        // harus memverifikasi (keputusan email 2026-11-18).
        DB::table('users')->whereNull('email_verified_at')->update(['email_verified_at' => now()]);
    }

    public function down(): void
    {
        Schema::dropIfExists('password_reset_tokens');
    }
};
