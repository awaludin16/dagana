# Dagana — Technical Debt Ledger

Daftar masalah teknis yang sudah ada tetapi **tidak diselesaikan pada task/fase aktif**. Setiap entri dicatat agar tidak lupa, tidak dianggap bagian scope fase berjalan, dan dapat dieksekusi sebagai task terpisah.

## Cara membaca

- **Kategori:** Bug, Style/Lint, Konfigurasi, Performa, dsb.
- **Status:** Terbuka / Selesai.
- Entri dianggap selesai ketika penyebab diperiksa, perubahan formatting terbukti tidak mengubah perilaku, dan test/format ulang dijalankan ulang dengan hasil tercatat.

---

## TD-001 — Pint gagal pada 4 file committed (2026-11-08)

**Kategori:** Style/Lint (pre-existing, berasal dari commit lama, bukan pekerjaan Phase 4).

**Detail:** `vendor/bin/pint --test` melaporkan 4 style issue pada file yang sudah ter-commit:

| File | Rule |
|---|---|
| `apps/api/app/Http/Middleware/ForceJsonResponse.php` | `blank_line_before_statement` |
| `apps/api/bootstrap/app.php` | `function_declaration`, `no_multiline_whitespace_around_double_arrow`, `concat_space` |
| `apps/api/config/database.php` | `concat_space` |
| `apps/api/config/session.php` | `concat_space` |

**Instruksi Product Owner:** buat task terpisah untuk (1) memeriksa penyebab gagal — kode atau konfigurasi Pint, (2) memastikan perubahan formatting tidak mengubah perilaku aplikasi, (3) menjalankan ulang formatter dan test terkait. Agent Phase 4 tidak boleh me-refactor keempat file ini tanpa alasan yang berkaitan dengan pekerjaannya.

**Batasan:** lakukan hanya formatting (`pint`), bukan refactor; jalankan `vendor/bin/pint <file>` per file, lalu `php artisan test` untuk membuktikan tidak ada perubahan perilaku.

**Status:** Terbuka.
