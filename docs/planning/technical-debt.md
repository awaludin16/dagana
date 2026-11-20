# Dagana — Technical Debt Ledger

Daftar masalah teknis yang sudah ada tetapi **tidak diselesaikan pada task/fase aktif**. Setiap entri dicatat agar tidak lupa, tidak dianggap bagian scope fase berjalan, dan dapat dieksekusi sebagai task terpisah.

## Cara membaca

- **Kategori:** Bug, Style/Lint, Konfigurasi, Performa, dsb.
- **Status:** Terbuka / Selesai.
- Entri dianggap selesai ketika penyebab diperiksa, perubahan formatting terbukti tidak mengubah perilaku, dan test/format ulang dijalankan ulang dengan hasil tercatat.

---

## TD-001 — Pint gagal pada file committed (2026-11-08, dieksekusi 2026-11-13)

**Kategori:** Style/Lint (pre-existing, berasal dari commit lama, bukan pekerjaan Phase 4).

**Detail awal (2026-11-08):** `vendor/bin/pint --test` melaporkan 4 style issue pada file yang sudah ter-commit:

| File | Rule |
|---|---|
| `apps/api/app/Http/Middleware/ForceJsonResponse.php` | `blank_line_before_statement` |
| `apps/api/bootstrap/app.php` | `function_declaration`, `no_multiline_whitespace_around_double_arrow`, `concat_space` |
| `apps/api/config/database.php` | `concat_space` |
| `apps/api/config/session.php` | `concat_space` |

**Update audit (2026-11-13):** pemeriksaan ulang menemukan daftar berkembang menjadi 7 file; 3 file tambahan berasal dari Phase 7 (Reporting):

| File | Rule |
|---|---|
| `apps/api/app/Domain/Report/ReportService.php` | `function_declaration` |
| `apps/api/app/Http/Controllers/Api/V1/ReportController.php` | `function_declaration`, lainnya |
| `apps/api/app/Http/Requests/Report/ReportDateRangeRequest.php` | `concat_space`, `unary_operator_spacing` |

**Instruksi Product Owner:** buat task terpisah untuk (1) memeriksa penyebab gagal — kode atau konfigurasi Pint, (2) memastikan perubahan formatting tidak mengubah perilaku aplikasi, (3) menjalankan ulang formatter dan test terkait. Agent Phase 4 tidak boleh me-refactor keempat file ini tanpa alasan yang berkaitan dengan pekerjaannya.

**Batasan:** lakukan hanya formatting (`pint`), bukan refactor; jalankan `vendor/bin/pint <file>` per file, lalu `php artisan test` untuk membuktikan tidak ada perubahan perilaku.

**Status:** Selesai (2026-11-13). Eksekusi sesuai batasan: `pint` dijalankan pada 7 file (formatting saja, diff 26 baris), `pint --test` khusus 7 file lalu seluruh proyek lulus (151 file), dan `php artisan test` dijalankan ulang: 126 passed (907 assertions), identik dengan sebelum perubahan format.

## TD-002 — DELETE outlet dengan data historis mengembalikan 500 (2026-11-13)

**Kategori:** Bug (error handling), ditemukan saat audit Phase 1.

**Detail:** `DeleteOutletAction` hanya menjaga invariant "minimal satu outlet per Business". Outlet yang sudah punya order atau data kas tetap coba dihapus dan baru ditolak oleh FK `restrictOnDelete` di database, sehingga client menerima error 500 (QueryException) alih-alih 422 yang jelas. Integritas data aman (history tidak bisa terhapus), tapi kontrak error tidak konsisten dengan konvensi validasi API.

**Instruksi Product Owner:** tambahkan guard eksplisit di `DeleteOutletAction` (tolak 422 bila outlet memiliki order/cash session), atau putuskan outlet berriwayat tidak boleh dihapus dan gunakan deaktivasi. Tambahkan test untuk kedua jalur.

**Status:** Selesai. Guard eksplisit ditambahkan di `DeleteOutletAction`: outlet dengan data di `orders`, `payments`, `cash_sessions`, atau `cash_movements` ditolak 422 dengan pesan jelas sebelum FK melarang. Test terkait: `test_outlet_with_order_history_cannot_be_deleted` (jalur cash menempuh mekanisme guard yang sama). Pemeriksaan lama pada guard dihapus oleh D-36. Verifikasi terbaru: suite backend 143 passed / 946 assertions dan `pint --test` lulus.
