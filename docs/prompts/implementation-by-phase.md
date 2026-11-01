# Dagana — Prompt Implementasi Backend & Frontend per Fase

Dokumen ini berisi **dua prompt untuk setiap fase (Phase 0–12)**: satu untuk coding agent Backend dan satu untuk coding agent Frontend. Total terdapat 26 prompt. Setiap prompt dapat disalin secara mandiri dan diberikan kepada agent yang mengerjakan repository Dagana.

## Cara menggunakan

1. Pastikan dokumentasi sudah ditempatkan sesuai struktur pada `docs/README.md`. Dokumen acuan minimal: `PRD-Dagana.md`, requirement spesifik fase di `docs/requirements/`, dokumen architecture yang relevan di `docs/architecture/`, `AGENTS.md`, `docs/engineering/engineering-standards.md`, `docs/planning/phase-targets.md`, dan `docs/planning/decision-log.md`.
2. Jalankan fase sesuai dependency. Jangan otomatis menjalankan seluruh fase sekaligus.
3. Untuk setiap fase, jalankan prompt Backend terlebih dahulu bila frontend membutuhkan endpoint/kontrak baru. Setelah kontrak API tersedia atau dikonfirmasi, jalankan prompt Frontend.
4. Satu fase boleh dibagi menjadi task atau pull request kecil. Pilih satu unit pekerjaan yang dapat diuji dan direview.
5. Project Dagana dimulai ulang dari baseline baru. Untuk repository kosong, scaffold workspace sesuai Phase 0. Jika repository berisi kode/perubahan pengguna, jangan hapus atau overwrite; laporkan kondisinya dan minta persetujuan sebelum tindakan destruktif.

## Aturan umum yang berlaku untuk semua prompt

- Ikuti `AGENTS.md` dan standar engineering di repository. Gunakan Bahasa Indonesia untuk komunikasi dan laporan.
- Gunakan `PRD-Dagana.md` untuk arah dan batas produk, dokumen relevan di `docs/requirements/` untuk behavior fitur, dan `docs/planning/phase-targets.md` untuk target serta acceptance criteria. Jangan diam-diam menambah, mengurangi, atau mengubah flow bisnis.
- Baca `docs/planning/decision-log.md`. Bedakan keputusan yang telah disetujui, rekomendasi baseline, dan gate yang masih menunggu Product Owner.
- Jangan mengarang formula, tarif, payment gateway, aturan stok, atau kebijakan yang belum diputuskan. Laporkan blocker secara spesifik.
- Model MVP: satu User hanya terhubung ke satu Business; satu Business dapat memiliki banyak Outlet. Role hanya `OWNER`, `MANAGER`, dan `CASHIER`.
- Authorization tenant dan outlet harus ditegakkan backend untuk request, query, export, job, event, dan realtime channel. Frontend permission gating hanya untuk UX, bukan security boundary.
- Gunakan Laravel modular monolith untuk backend. Business logic berada pada Service/Action sesuai `AGENTS.md`; controller tetap tipis. Frontend memakai TypeScript dan mengikuti batas platform Web vs Flutter.
- Gunakan migration untuk perubahan schema. Jangan mengubah migration yang mungkin sudah dijalankan pada environment bersama; buat migration baru.
- Soft delete/archive/deactivation untuk master data yang memiliki histori. Jangan hard-delete completed orders, payments, cash movements, stock movements, atau audit logs.
- Uji happy path dan failure path. Jangan menyatakan test, build, atau acceptance criteria lulus bila belum benar-benar diverifikasi.
- Jangan melakukan commit, push, merge, reset, clean, atau operasi Git destruktif tanpa instruksi eksplisit.

---

## Phase 0 — Foundation

### Prompt Backend

```text
Kita akan mengerjakan **Dagana Phase 0 — Foundation** dari sisi Backend.

Sebelum mengubah kode:
1. Baca `AGENTS.md` dan `docs/README.md`. Lalu baca `PRD-Dagana.md`, requirement spesifik fase di `docs/requirements/`, `docs/planning/phase-targets.md`, `docs/engineering/engineering-standards.md`, serta bagian relevan `docs/planning/decision-log.md` dan `docs/architecture/` sesuai dampak task.
2. Periksa struktur repository, branch, status Git, implementasi, test, dan kontrak API yang sudah ada. Jangan berasumsi repository masih kosong.
3. Cocokkan task dengan target serta acceptance criteria Phase 0. Identifikasi dependency, file yang akan terdampak, dan risiko kompatibilitas.
4. Jika ada konflik requirement, keputusan yang belum disetujui, atau dependency yang belum tersedia, jelaskan terlebih dahulu. Jangan memilih kebijakan bisnis sendiri.
5. Gunakan inti konsep skill `ponytail`. jika diperlukan, cari skill yang dibutuhkan menggunakan skill `find-skills` sesuai kubutuhan task.

**Tujuan:** menyiapkan fondasi repository dan environment development.

Kerjakan pemeriksaan dan konfigurasi backend yang memang diperlukan oleh struktur repository aktual: Laravel API pada `apps/api`, Docker Compose untuk API, PostgreSQL, dan Redis, environment example, health check, koneksi antarlayanan, volume database persisten, serta perintah test/lint awal. Cocokkan dahulu struktur aktual; jangan memindahkan atau mengganti aplikasi yang sudah ada tanpa alasan kuat.

**Batasan:** jangan membangun modul bisnis, jangan men-deploy ke production, jangan menambahkan service/infrastruktur yang belum dibutuhkan. PHP/Composer harus mengikuti constraint dependency yang tercatat pada `composer.json` dan lockfile. Jangan hardcode `localhost` untuk koneksi antar-container.

**Instruksi implementasi:**
- Pecah pekerjaan menjadi langkah kecil yang dapat direview. Implementasikan hanya scope Phase 0; jangan mengerjakan fase berikutnya kecuali ada dependency minimum yang wajib.
- Pertahankan pola arsitektur, penamaan, response/API contract, design system, dan convention yang sudah dipakai repository. Hindari duplikasi logic dan abstraksi berlebihan.
- Tambahkan/perbarui automated test untuk behavior yang berubah. Untuk Frontend, tambahkan test komponen/alur penting dan verifikasi aksesibilitas dasar; untuk Backend, tambahkan unit/feature test sesuai lapisan.
- Jalankan test, formatter, linter, type-check, build, migration/health check yang relevan. Catat command dan hasil aktual; tandai yang terhalang environment sebagai belum terverifikasi.
- Perbarui dokumentasi API, development, atau ADR bila kontrak/keputusan berubah. Jangan menyimpan secret atau data nyata di repository/log.

**Format laporan akhir wajib:**
1. Ringkasan perubahan dan alasan.
2. File/module utama yang dibuat atau diubah.
3. Acceptance criteria Phase 0: status `Lulus`, `Gagal`, `Belum diuji`, atau `Terhalang`, disertai bukti singkat.
4. Daftar command test/check yang dijalankan dan hasil aktual.
5. Keputusan/gate yang masih menunggu persetujuan, risiko, dan pekerjaan lanjutan.
6. Konfirmasi bahwa `git diff` dan `git status` sudah diperiksa. Jangan commit/push tanpa instruksi.

Mulai dengan audit dan rencana singkat, lalu implementasikan task terkecil yang paling tepat untuk fase ini. Berkomunikasilah dalam Bahasa Indonesia.
```

### Prompt Frontend

```text
Kita akan mengerjakan **Dagana Phase 0 — Foundation** dari sisi Frontend.

Sebelum mengubah kode:
1. Baca `AGENTS.md` dan `docs/README.md`. Lalu baca `PRD-Dagana.md`, requirement spesifik fase di `docs/requirements/`, `docs/planning/phase-targets.md`, `docs/engineering/engineering-standards.md`, serta bagian relevan `docs/planning/decision-log.md` dan `docs/architecture/` sesuai dampak task.
2. Periksa struktur repository, branch, status Git, implementasi, test, dan kontrak API yang sudah ada. Jangan berasumsi repository masih kosong.
3. Cocokkan task dengan target serta acceptance criteria Phase 0. Identifikasi dependency, file yang akan terdampak, dan risiko kompatibilitas.
4. Jika ada konflik requirement, keputusan yang belum disetujui, atau dependency yang belum tersedia, jelaskan terlebih dahulu. Jangan memilih kebijakan bisnis sendiri.
5. Gunakan inti konsep skill `ponytail`, skill `ui-ux-pro-max` untuk implementasi frontend. jika diperlukan, cari skill yang dibutuhkan menggunakan skill `find-skills` sesuai kubutuhan task.

**Tujuan:** menyiapkan fondasi frontend di dalam monorepo sesuai struktur aktual.

Untuk repository baru/kosong, inisialisasi scaffold workspace `apps/api`, `apps/admin-web`, `apps/customer-web`, dan `apps/pos-mobile` dari awal sesuai stack yang ditetapkan. Jangan menyalin kode, migration, dump database, secret, atau build artifact project lama tanpa persetujuan eksplisit. Jika repository ternyata berisi pekerjaan pengguna, jangan hapus atau overwrite; laporkan dan minta persetujuan sebelum tindakan destruktif. Web menggunakan React + TypeScript + Vite, Tailwind CSS, shadcn/ui, dan TanStack Query. Mobile menggunakan Flutter + Dart + go_router. Siapkan konfigurasi environment berbasis contoh, routing dasar, struktur folder minimal, lint/format/type-check/test, serta dokumentasi cara menjalankan masing-masing app.

**Batasan:** jangan memasukkan seluruh dependency rekomendasi sekaligus. Untuk dependency Flutter/native gunakan `flutter pub add` dan periksa kompatibilitas. Jangan mengimpor komponen shadcn/ui ke Flutter. Belum perlu membuat halaman bisnis.

**Instruksi implementasi:**
- Pecah pekerjaan menjadi langkah kecil yang dapat direview. Implementasikan hanya scope Phase 0; jangan mengerjakan fase berikutnya kecuali ada dependency minimum yang wajib.
- Pertahankan pola arsitektur, penamaan, response/API contract, design system, dan convention yang sudah dipakai repository. Hindari duplikasi logic dan abstraksi berlebihan.
- Tambahkan/perbarui automated test untuk behavior yang berubah. Untuk Frontend, tambahkan test komponen/alur penting dan verifikasi aksesibilitas dasar; untuk Backend, tambahkan unit/feature test sesuai lapisan.
- Jalankan test, formatter, linter, type-check, build, migration/health check yang relevan. Catat command dan hasil aktual; tandai yang terhalang environment sebagai belum terverifikasi.
- Perbarui dokumentasi API, development, atau ADR bila kontrak/keputusan berubah. Jangan menyimpan secret atau data nyata di repository/log.

**Format laporan akhir wajib:**
1. Ringkasan perubahan dan alasan.
2. File/module utama yang dibuat atau diubah.
3. Acceptance criteria Phase 0: status `Lulus`, `Gagal`, `Belum diuji`, atau `Terhalang`, disertai bukti singkat.
4. Daftar command test/check yang dijalankan dan hasil aktual.
5. Keputusan/gate yang masih menunggu persetujuan, risiko, dan pekerjaan lanjutan.
6. Konfirmasi bahwa `git diff` dan `git status` sudah diperiksa. Jangan commit/push tanpa instruksi.

Mulai dengan audit dan rencana singkat, lalu implementasikan task terkecil yang paling tepat untuk fase ini. Berkomunikasilah dalam Bahasa Indonesia.
```

---

## Phase 1 — Identity, Business, Outlet

### Prompt Backend

```text
Kita akan mengerjakan **Dagana Phase 1 — Identity, Business, Outlet** dari sisi Backend.

Sebelum mengubah kode:
1. Baca `AGENTS.md` dan `docs/README.md`. Lalu baca `PRD-Dagana.md`, requirement spesifik fase di `docs/requirements/`, `docs/planning/phase-targets.md`, `docs/engineering/engineering-standards.md`, serta bagian relevan `docs/planning/decision-log.md` dan `docs/architecture/` sesuai dampak task.
2. Periksa struktur repository, branch, status Git, implementasi, test, dan kontrak API yang sudah ada. Jangan berasumsi repository masih kosong.
3. Cocokkan task dengan target serta acceptance criteria Phase 1. Identifikasi dependency, file yang akan terdampak, dan risiko kompatibilitas.
4. Jika ada konflik requirement, keputusan yang belum disetujui, atau dependency yang belum tersedia, jelaskan terlebih dahulu. Jangan memilih kebijakan bisnis sendiri.
5. Gunakan inti konsep skill `ponytail`, skill `ui-ux-pro-max` untuk implementasi frontend. jika diperlukan, cari skill yang dibutuhkan menggunakan skill `find-skills` sesuai kubutuhan task.

**Tujuan:** membangun API identitas dan onboarding merchant.

Implementasikan registrasi, login, logout, endpoint profil pengguna, pembuatan satu Business, pembuatan Outlet pertama, serta read/update pengaturan dasar Business dan Outlet sesuai PRD. Model wajib mengikuti aturan MVP: satu User hanya boleh terhubung ke tepat satu Business; satu Business dapat memiliki banyak Outlet. Pastikan pembuatan Business, Outlet, dan relasi awal yang diperlukan berjalan atomik. Tambahkan migration, foreign key, unique constraint, validation/Form Request, API resource/response, authorization scope, dan feature tests.

**Pemeriksaan wajib:** kegagalan onboarding tidak meninggalkan record parsial; user tidak dapat membaca/mengubah Business atau Outlet milik user lain; profil tidak membocorkan hash password atau secret. Jangan membuat business switching atau multi-business membership.

**Instruksi implementasi:**
- Pecah pekerjaan menjadi langkah kecil yang dapat direview. Implementasikan hanya scope Phase 1; jangan mengerjakan fase berikutnya kecuali ada dependency minimum yang wajib.
- Pertahankan pola arsitektur, penamaan, response/API contract, design system, dan convention yang sudah dipakai repository. Hindari duplikasi logic dan abstraksi berlebihan.
- Tambahkan/perbarui automated test untuk behavior yang berubah. Untuk Frontend, tambahkan test komponen/alur penting dan verifikasi aksesibilitas dasar; untuk Backend, tambahkan unit/feature test sesuai lapisan.
- Jalankan test, formatter, linter, type-check, build, migration/health check yang relevan. Catat command dan hasil aktual; tandai yang terhalang environment sebagai belum terverifikasi.
- Perbarui dokumentasi API, development, atau ADR bila kontrak/keputusan berubah. Jangan menyimpan secret atau data nyata di repository/log.

**Format laporan akhir wajib:**
1. Ringkasan perubahan dan alasan.
2. File/module utama yang dibuat atau diubah.
3. Acceptance criteria Phase 1: status `Lulus`, `Gagal`, `Belum diuji`, atau `Terhalang`, disertai bukti singkat.
4. Daftar command test/check yang dijalankan dan hasil aktual.
5. Keputusan/gate yang masih menunggu persetujuan, risiko, dan pekerjaan lanjutan.
6. Konfirmasi bahwa `git diff` dan `git status` sudah diperiksa. Jangan commit/push tanpa instruksi.

Mulai dengan audit dan rencana singkat, lalu implementasikan task terkecil yang paling tepat untuk fase ini. Berkomunikasilah dalam Bahasa Indonesia.
```

### Prompt Frontend

```text
Kita akan mengerjakan **Dagana Phase 1 — Identity, Business, Outlet** dari sisi Frontend.

Sebelum mengubah kode:
1. Baca `AGENTS.md` dan `docs/README.md`. Lalu baca `PRD-Dagana.md`, requirement spesifik fase di `docs/requirements/`, `docs/planning/phase-targets.md`, `docs/engineering/engineering-standards.md`, serta bagian relevan `docs/planning/decision-log.md` dan `docs/architecture/` sesuai dampak task.
2. Periksa struktur repository, branch, status Git, implementasi, test, dan kontrak API yang sudah ada. Jangan berasumsi repository masih kosong.
3. Cocokkan task dengan target serta acceptance criteria Phase 1. Identifikasi dependency, file yang akan terdampak, dan risiko kompatibilitas.
4. Jika ada konflik requirement, keputusan yang belum disetujui, atau dependency yang belum tersedia, jelaskan terlebih dahulu. Jangan memilih kebijakan bisnis sendiri.
5. Gunakan inti konsep skill `ponytail`, skill `ui-ux-pro-max` untuk implementasi frontend. jika diperlukan, cari skill yang dibutuhkan menggunakan skill `find-skills` sesuai kubutuhan task.

**Tujuan:** membangun antarmuka autentikasi dan onboarding merchant berdasarkan kontrak API Phase 1.

Buat UI registrasi, login, logout, pengelolaan sesi, tampilan profil dasar, onboarding pembuatan Business dan Outlet pertama, serta halaman pengaturan dasar Business/Outlet. Setelah onboarding, arahkan pengguna ke konteks Business miliknya. Satu akun hanya memiliki satu Business pada MVP; jangan membuat business switcher. Business dapat memiliki banyak Outlet, sehingga komponen pemilihan outlet hanya ditampilkan bila dibutuhkan oleh alur dan hak akses.

**Pemeriksaan wajib:** validasi form di client untuk UX, tetapi tetap anggap validasi backend sebagai otoritatif. Tangani loading, error, empty, success, token/session expiry, dan retry. Jangan menyimpan token sensitif di localStorage/AsyncStorage; ikuti mekanisme penyimpanan aman yang ditetapkan stack platform.

**Instruksi implementasi:**
- Pecah pekerjaan menjadi langkah kecil yang dapat direview. Implementasikan hanya scope Phase 1; jangan mengerjakan fase berikutnya kecuali ada dependency minimum yang wajib.
- Pertahankan pola arsitektur, penamaan, response/API contract, design system, dan convention yang sudah dipakai repository. Hindari duplikasi logic dan abstraksi berlebihan.
- Tambahkan/perbarui automated test untuk behavior yang berubah. Untuk Frontend, tambahkan test komponen/alur penting dan verifikasi aksesibilitas dasar; untuk Backend, tambahkan unit/feature test sesuai lapisan.
- Jalankan test, formatter, linter, type-check, build, migration/health check yang relevan. Catat command dan hasil aktual; tandai yang terhalang environment sebagai belum terverifikasi.
- Perbarui dokumentasi API, development, atau ADR bila kontrak/keputusan berubah. Jangan menyimpan secret atau data nyata di repository/log.

**Format laporan akhir wajib:**
1. Ringkasan perubahan dan alasan.
2. File/module utama yang dibuat atau diubah.
3. Acceptance criteria Phase 1: status `Lulus`, `Gagal`, `Belum diuji`, atau `Terhalang`, disertai bukti singkat.
4. Daftar command test/check yang dijalankan dan hasil aktual.
5. Keputusan/gate yang masih menunggu persetujuan, risiko, dan pekerjaan lanjutan.
6. Konfirmasi bahwa `git diff` dan `git status` sudah diperiksa. Jangan commit/push tanpa instruksi.

Mulai dengan audit dan rencana singkat, lalu implementasikan task terkecil yang paling tepat untuk fase ini. Berkomunikasilah dalam Bahasa Indonesia.
```

---

## Phase 2 — Membership, Role, Permission

### Prompt Backend

```text
Kita akan mengerjakan **Dagana Phase 2 — Membership, Role, Permission** dari sisi Backend.

Sebelum mengubah kode:
1. Baca `AGENTS.md` dan `docs/README.md`. Lalu baca `PRD-Dagana.md`, requirement spesifik fase di `docs/requirements/`, `docs/planning/phase-targets.md`, `docs/engineering/engineering-standards.md`, serta bagian relevan `docs/planning/decision-log.md` dan `docs/architecture/` sesuai dampak task.
2. Periksa struktur repository, branch, status Git, implementasi, test, dan kontrak API yang sudah ada. Jangan berasumsi repository masih kosong.
3. Cocokkan task dengan target serta acceptance criteria Phase 2. Identifikasi dependency, file yang akan terdampak, dan risiko kompatibilitas.
4. Jika ada konflik requirement, keputusan yang belum disetujui, atau dependency yang belum tersedia, jelaskan terlebih dahulu. Jangan memilih kebijakan bisnis sendiri.
5. Gunakan inti konsep skill `ponytail`, skill `ui-ux-pro-max` untuk implementasi frontend. jika diperlukan, cari skill yang dibutuhkan menggunakan skill `find-skills` sesuai kubutuhan task.

**Tujuan:** membangun membership, preset role, permission, dan outlet access pada backend.

Implementasikan status membership, invitation/penambahan employee sesuai alur PRD, assignment role preset, serta pembatasan akses outlet. Role MVP hanya `OWNER`, `MANAGER`, dan `CASHIER`; role adalah preset permission, bukan custom role. Authorization wajib diperiksa di backend pada setiap endpoint/aksi. Owner harus tetap dapat menggunakan POS meskipun belum menambahkan employee. Tambahkan test untuk izin diberikan/ditolak, membership nonaktif, dan akses outlet di luar cakupan.

**Catatan keputusan:** periksa `docs/planning/decision-log.md` khusus D-03 sampai D-05. Tandai usulan yang belum disetujui; jangan mengunci keputusan yang bertentangan dengan repository atau keputusan Product Owner.

**Instruksi implementasi:**
- Pecah pekerjaan menjadi langkah kecil yang dapat direview. Implementasikan hanya scope Phase 2; jangan mengerjakan fase berikutnya kecuali ada dependency minimum yang wajib.
- Pertahankan pola arsitektur, penamaan, response/API contract, design system, dan convention yang sudah dipakai repository. Hindari duplikasi logic dan abstraksi berlebihan.
- Tambahkan/perbarui automated test untuk behavior yang berubah. Untuk Frontend, tambahkan test komponen/alur penting dan verifikasi aksesibilitas dasar; untuk Backend, tambahkan unit/feature test sesuai lapisan.
- Jalankan test, formatter, linter, type-check, build, migration/health check yang relevan. Catat command dan hasil aktual; tandai yang terhalang environment sebagai belum terverifikasi.
- Perbarui dokumentasi API, development, atau ADR bila kontrak/keputusan berubah. Jangan menyimpan secret atau data nyata di repository/log.

**Format laporan akhir wajib:**
1. Ringkasan perubahan dan alasan.
2. File/module utama yang dibuat atau diubah.
3. Acceptance criteria Phase 2: status `Lulus`, `Gagal`, `Belum diuji`, atau `Terhalang`, disertai bukti singkat.
4. Daftar command test/check yang dijalankan dan hasil aktual.
5. Keputusan/gate yang masih menunggu persetujuan, risiko, dan pekerjaan lanjutan.
6. Konfirmasi bahwa `git diff` dan `git status` sudah diperiksa. Jangan commit/push tanpa instruksi.

Mulai dengan audit dan rencana singkat, lalu implementasikan task terkecil yang paling tepat untuk fase ini. Berkomunikasilah dalam Bahasa Indonesia.
```

### Prompt Frontend

```text
Kita akan mengerjakan **Dagana Phase 2 — Membership, Role, Permission** dari sisi Frontend.

Sebelum mengubah kode:
1. Baca `AGENTS.md` dan `docs/README.md`. Lalu baca `PRD-Dagana.md`, requirement spesifik fase di `docs/requirements/`, `docs/planning/phase-targets.md`, `docs/engineering/engineering-standards.md`, serta bagian relevan `docs/planning/decision-log.md` dan `docs/architecture/` sesuai dampak task.
2. Periksa struktur repository, branch, status Git, implementasi, test, dan kontrak API yang sudah ada. Jangan berasumsi repository masih kosong.
3. Cocokkan task dengan target serta acceptance criteria Phase 2. Identifikasi dependency, file yang akan terdampak, dan risiko kompatibilitas.
4. Jika ada konflik requirement, keputusan yang belum disetujui, atau dependency yang belum tersedia, jelaskan terlebih dahulu. Jangan memilih kebijakan bisnis sendiri.
5. Gunakan inti konsep skill `ponytail`, skill `ui-ux-pro-max` untuk implementasi frontend. jika diperlukan, cari skill yang dibutuhkan menggunakan skill `find-skills` sesuai kubutuhan task.

**Tujuan:** menyediakan UI pengelolaan tim, role, dan cakupan outlet sesuai kontrak API Phase 2.

Buat halaman daftar anggota, tambah/invite employee, ubah role preset, atur outlet yang dapat diakses, lihat status membership, dan nonaktifkan/hapus akses anggota sesuai permission. Tampilkan hanya tiga role: Owner, Manager, Cashier. Sajikan ringkasan hak akses dari backend; jangan membangun custom role, editor permission bebas, atau permission override. Owner tetap dapat mengoperasikan POS tanpa harus membuat employee.

**Pemeriksaan wajib:** sembunyikan/nonaktifkan aksi yang tidak diizinkan untuk UX, tetapi jangan menganggap UI sebagai lapisan keamanan. Tangani respons `401/403`, perubahan role yang gagal, invitation yang kedaluwarsa bila didukung API, serta refresh data setelah mutasi.

**Instruksi implementasi:**
- Pecah pekerjaan menjadi langkah kecil yang dapat direview. Implementasikan hanya scope Phase 2; jangan mengerjakan fase berikutnya kecuali ada dependency minimum yang wajib.
- Pertahankan pola arsitektur, penamaan, response/API contract, design system, dan convention yang sudah dipakai repository. Hindari duplikasi logic dan abstraksi berlebihan.
- Tambahkan/perbarui automated test untuk behavior yang berubah. Untuk Frontend, tambahkan test komponen/alur penting dan verifikasi aksesibilitas dasar; untuk Backend, tambahkan unit/feature test sesuai lapisan.
- Jalankan test, formatter, linter, type-check, build, migration/health check yang relevan. Catat command dan hasil aktual; tandai yang terhalang environment sebagai belum terverifikasi.
- Perbarui dokumentasi API, development, atau ADR bila kontrak/keputusan berubah. Jangan menyimpan secret atau data nyata di repository/log.

**Format laporan akhir wajib:**
1. Ringkasan perubahan dan alasan.
2. File/module utama yang dibuat atau diubah.
3. Acceptance criteria Phase 2: status `Lulus`, `Gagal`, `Belum diuji`, atau `Terhalang`, disertai bukti singkat.
4. Daftar command test/check yang dijalankan dan hasil aktual.
5. Keputusan/gate yang masih menunggu persetujuan, risiko, dan pekerjaan lanjutan.
6. Konfirmasi bahwa `git diff` dan `git status` sudah diperiksa. Jangan commit/push tanpa instruksi.

Mulai dengan audit dan rencana singkat, lalu implementasikan task terkecil yang paling tepat untuk fase ini. Berkomunikasilah dalam Bahasa Indonesia.
```

---

## Phase 3 — Catalog

### Prompt Backend

```text
Kita akan mengerjakan **Dagana Phase 3 — Catalog** dari sisi Backend.

Sebelum mengubah kode:
1. Baca `AGENTS.md` dan `docs/README.md`. Lalu baca `PRD-Dagana.md`, requirement spesifik fase di `docs/requirements/`, `docs/planning/phase-targets.md`, `docs/engineering/engineering-standards.md`, serta bagian relevan `docs/planning/decision-log.md` dan `docs/architecture/` sesuai dampak task.
2. Periksa struktur repository, branch, status Git, implementasi, test, dan kontrak API yang sudah ada. Jangan berasumsi repository masih kosong.
3. Cocokkan task dengan target serta acceptance criteria Phase 3. Identifikasi dependency, file yang akan terdampak, dan risiko kompatibilitas.
4. Jika ada konflik requirement, keputusan yang belum disetujui, atau dependency yang belum tersedia, jelaskan terlebih dahulu. Jangan memilih kebijakan bisnis sendiri.
5. Gunakan inti konsep skill `ponytail`, skill `ui-ux-pro-max` untuk implementasi frontend. jika diperlukan, cari skill yang dibutuhkan menggunakan skill `find-skills` sesuai kubutuhan task.

**Tujuan:** membangun API catalog sederhana untuk kategori dan menu/produk.

Implementasikan operasi create/read/update dan nonaktifkan/soft delete sesuai permission untuk kategori serta menu/produk. Validasi nama, harga, status, dan field wajib di backend. Sediakan pagination/filter yang terukur. Menu harus mempunyai status aktif/nonaktif dan ketersediaan dasar. Scope data harus terisolasi berdasarkan Business dan Outlet sesuai model PRD. Pertahankan referensi histori: jangan hard-delete master data yang sudah memiliki transaksi; gunakan soft delete/archive/deactivation.

**Pemeriksaan wajib:** menu nonaktif/tidak tersedia tidak dapat digunakan pada transaksi baru melalui manipulasi request. Dokumentasikan kontrak snapshot harga/nama untuk Phase 4; perubahan catalog tidak boleh mengubah snapshot transaksi historis.

**Instruksi implementasi:**
- Pecah pekerjaan menjadi langkah kecil yang dapat direview. Implementasikan hanya scope Phase 3; jangan mengerjakan fase berikutnya kecuali ada dependency minimum yang wajib.
- Pertahankan pola arsitektur, penamaan, response/API contract, design system, dan convention yang sudah dipakai repository. Hindari duplikasi logic dan abstraksi berlebihan.
- Tambahkan/perbarui automated test untuk behavior yang berubah. Untuk Frontend, tambahkan test komponen/alur penting dan verifikasi aksesibilitas dasar; untuk Backend, tambahkan unit/feature test sesuai lapisan.
- Jalankan test, formatter, linter, type-check, build, migration/health check yang relevan. Catat command dan hasil aktual; tandai yang terhalang environment sebagai belum terverifikasi.
- Perbarui dokumentasi API, development, atau ADR bila kontrak/keputusan berubah. Jangan menyimpan secret atau data nyata di repository/log.

**Format laporan akhir wajib:**
1. Ringkasan perubahan dan alasan.
2. File/module utama yang dibuat atau diubah.
3. Acceptance criteria Phase 3: status `Lulus`, `Gagal`, `Belum diuji`, atau `Terhalang`, disertai bukti singkat.
4. Daftar command test/check yang dijalankan dan hasil aktual.
5. Keputusan/gate yang masih menunggu persetujuan, risiko, dan pekerjaan lanjutan.
6. Konfirmasi bahwa `git diff` dan `git status` sudah diperiksa. Jangan commit/push tanpa instruksi.

Mulai dengan audit dan rencana singkat, lalu implementasikan task terkecil yang paling tepat untuk fase ini. Berkomunikasilah dalam Bahasa Indonesia.
```

### Prompt Frontend

```text
Kita akan mengerjakan **Dagana Phase 3 — Catalog** dari sisi Frontend.

Sebelum mengubah kode:
1. Baca `AGENTS.md` dan `docs/README.md`. Lalu baca `PRD-Dagana.md`, requirement spesifik fase di `docs/requirements/`, `docs/planning/phase-targets.md`, `docs/engineering/engineering-standards.md`, serta bagian relevan `docs/planning/decision-log.md` dan `docs/architecture/` sesuai dampak task.
2. Periksa struktur repository, branch, status Git, implementasi, test, dan kontrak API yang sudah ada. Jangan berasumsi repository masih kosong.
3. Cocokkan task dengan target serta acceptance criteria Phase 3. Identifikasi dependency, file yang akan terdampak, dan risiko kompatibilitas.
4. Jika ada konflik requirement, keputusan yang belum disetujui, atau dependency yang belum tersedia, jelaskan terlebih dahulu. Jangan memilih kebijakan bisnis sendiri.
5. Gunakan inti konsep skill `ponytail`, skill `ui-ux-pro-max` untuk implementasi frontend. jika diperlukan, cari skill yang dibutuhkan menggunakan skill `find-skills` sesuai kubutuhan task.

**Tujuan:** membangun UI pengelolaan catalog untuk Owner/Manager dan UI pemilihan menu dasar untuk POS.

Buat halaman daftar kategori dan menu, form create/edit, pengaturan harga, status aktif/nonaktif, pencarian/filter, pagination, konfirmasi nonaktifkan/hapus logis, serta feedback sukses/gagal. Pada POS, tampilkan hanya menu yang aktif dan tersedia untuk konteks outlet yang sedang digunakan. Sesuaikan penempatan fitur dengan app yang tersedia (`admin-web` dan/atau `pos-mobile`).

**Pemeriksaan wajib:** data berasal dari API, bukan hardcode. Tangani loading, empty, error, validation, dan permission state. Jangan membuat UI recipe, supplier, SKU kompleks, modifier, atau variant sebagai bagian fase ini. Pastikan dialog konfirmasi menjelaskan bahwa penghapusan master data dapat berupa arsip/nonaktif, bukan penghapusan histori.

**Instruksi implementasi:**
- Pecah pekerjaan menjadi langkah kecil yang dapat direview. Implementasikan hanya scope Phase 3; jangan mengerjakan fase berikutnya kecuali ada dependency minimum yang wajib.
- Pertahankan pola arsitektur, penamaan, response/API contract, design system, dan convention yang sudah dipakai repository. Hindari duplikasi logic dan abstraksi berlebihan.
- Tambahkan/perbarui automated test untuk behavior yang berubah. Untuk Frontend, tambahkan test komponen/alur penting dan verifikasi aksesibilitas dasar; untuk Backend, tambahkan unit/feature test sesuai lapisan.
- Jalankan test, formatter, linter, type-check, build, migration/health check yang relevan. Catat command dan hasil aktual; tandai yang terhalang environment sebagai belum terverifikasi.
- Perbarui dokumentasi API, development, atau ADR bila kontrak/keputusan berubah. Jangan menyimpan secret atau data nyata di repository/log.

**Format laporan akhir wajib:**
1. Ringkasan perubahan dan alasan.
2. File/module utama yang dibuat atau diubah.
3. Acceptance criteria Phase 3: status `Lulus`, `Gagal`, `Belum diuji`, atau `Terhalang`, disertai bukti singkat.
4. Daftar command test/check yang dijalankan dan hasil aktual.
5. Keputusan/gate yang masih menunggu persetujuan, risiko, dan pekerjaan lanjutan.
6. Konfirmasi bahwa `git diff` dan `git status` sudah diperiksa. Jangan commit/push tanpa instruksi.

Mulai dengan audit dan rencana singkat, lalu implementasikan task terkecil yang paling tepat untuk fase ini. Berkomunikasilah dalam Bahasa Indonesia.
```

---

## Phase 4 — POS + Payment

### Prompt Backend

```text
Kita akan mengerjakan **Dagana Phase 4 — POS + Payment** dari sisi Backend.

Sebelum mengubah kode:
1. Baca `AGENTS.md` dan `docs/README.md`. Lalu baca `PRD-Dagana.md`, requirement spesifik fase di `docs/requirements/`, `docs/planning/phase-targets.md`, `docs/engineering/engineering-standards.md`, serta bagian relevan `docs/planning/decision-log.md` dan `docs/architecture/` sesuai dampak task.
2. Periksa struktur repository, branch, status Git, implementasi, test, dan kontrak API yang sudah ada. Jangan berasumsi repository masih kosong.
3. Cocokkan task dengan target serta acceptance criteria Phase 4. Identifikasi dependency, file yang akan terdampak, dan risiko kompatibilitas.
4. Jika ada konflik requirement, keputusan yang belum disetujui, atau dependency yang belum tersedia, jelaskan terlebih dahulu. Jangan memilih kebijakan bisnis sendiri.
5. Gunakan inti konsep skill `ponytail`, skill `ui-ux-pro-max` untuk implementasi frontend. jika diperlukan, cari skill yang dibutuhkan menggunakan skill `find-skills` sesuai kubutuhan task.

**Tujuan:** membangun Order Engine dan API transaksi inti.

Implementasikan pembuatan order, order items, item snapshot, checkout, payment record, status order/payment, histori transaksi, dan receipt dasar. Backend harus menghitung ulang harga dan total berdasarkan catalog yang sah; jangan percaya total dari client. Simpan snapshot nama/harga/kuantitas yang menjaga histori. Gunakan transaksi database untuk operasi kritis, idempotency key untuk checkout retry, serta locking/constraint bila diperlukan untuk race condition. Validasi status transition dan permission Business/Outlet.

Metode yang tercantum di PRD mencakup cash, QR payment, bank transfer, debit, dan credit. Jangan menganggap gateway/provider tertentu sudah diputuskan; implementasikan model dan alur yang dapat berjalan tanpa klaim integrasi gateway production. Tambahkan test checkout sukses, validasi gagal, rollback, duplicate retry, permission, dan isolasi tenant/outlet.

**Instruksi implementasi:**
- Pecah pekerjaan menjadi langkah kecil yang dapat direview. Implementasikan hanya scope Phase 4; jangan mengerjakan fase berikutnya kecuali ada dependency minimum yang wajib.
- Pertahankan pola arsitektur, penamaan, response/API contract, design system, dan convention yang sudah dipakai repository. Hindari duplikasi logic dan abstraksi berlebihan.
- Tambahkan/perbarui automated test untuk behavior yang berubah. Untuk Frontend, tambahkan test komponen/alur penting dan verifikasi aksesibilitas dasar; untuk Backend, tambahkan unit/feature test sesuai lapisan.
- Jalankan test, formatter, linter, type-check, build, migration/health check yang relevan. Catat command dan hasil aktual; tandai yang terhalang environment sebagai belum terverifikasi.
- Perbarui dokumentasi API, development, atau ADR bila kontrak/keputusan berubah. Jangan menyimpan secret atau data nyata di repository/log.

**Format laporan akhir wajib:**
1. Ringkasan perubahan dan alasan.
2. File/module utama yang dibuat atau diubah.
3. Acceptance criteria Phase 4: status `Lulus`, `Gagal`, `Belum diuji`, atau `Terhalang`, disertai bukti singkat.
4. Daftar command test/check yang dijalankan dan hasil aktual.
5. Keputusan/gate yang masih menunggu persetujuan, risiko, dan pekerjaan lanjutan.
6. Konfirmasi bahwa `git diff` dan `git status` sudah diperiksa. Jangan commit/push tanpa instruksi.

Mulai dengan audit dan rencana singkat, lalu implementasikan task terkecil yang paling tepat untuk fase ini. Berkomunikasilah dalam Bahasa Indonesia.
```

### Prompt Frontend

```text
Kita akan mengerjakan **Dagana Phase 4 — POS + Payment** dari sisi Frontend.

Sebelum mengubah kode:
1. Baca `AGENTS.md` dan `docs/README.md`. Lalu baca `PRD-Dagana.md`, requirement spesifik fase di `docs/requirements/`, `docs/planning/phase-targets.md`, `docs/engineering/engineering-standards.md`, serta bagian relevan `docs/planning/decision-log.md` dan `docs/architecture/` sesuai dampak task.
2. Periksa struktur repository, branch, status Git, implementasi, test, dan kontrak API yang sudah ada. Jangan berasumsi repository masih kosong.
3. Cocokkan task dengan target serta acceptance criteria Phase 4. Identifikasi dependency, file yang akan terdampak, dan risiko kompatibilitas.
4. Jika ada konflik requirement, keputusan yang belum disetujui, atau dependency yang belum tersedia, jelaskan terlebih dahulu. Jangan memilih kebijakan bisnis sendiri.
5. Gunakan inti konsep skill `ponytail`, skill `ui-ux-pro-max` untuk implementasi frontend. jika diperlukan, cari skill yang dibutuhkan menggunakan skill `find-skills` sesuai kubutuhan task.

**Tujuan:** membangun pengalaman POS dan tampilan transaksi yang menggunakan Order Engine API.

Pada `pos-mobile`, buat alur pilih outlet/context yang diizinkan, cari/pilih menu, cart, ubah kuantitas, hapus item cart, ringkasan sebelum checkout, pemilihan metode pembayaran yang tersedia, hasil transaksi, dan receipt. Pada `admin-web`, sediakan daftar/detail histori order dan tampilan receipt sesuai kebutuhan PRD. Tampilkan harga/total hasil server sebagai nilai final; nilai di client hanya preview. Sertakan idempotency key yang stabil untuk satu upaya checkout dan jangan membuat order baru saat pengguna retry request yang sama.

**Pemeriksaan wajib:** tangani checkout gagal, koneksi terputus, request pending, pembayaran belum terkonfirmasi, transaksi berhasil, dan pemuatan ulang receipt. Jangan menandai pembayaran PAID hanya karena redirect atau perubahan state lokal. Jangan mengimplementasikan integrasi gateway yang belum diputuskan.

**Instruksi implementasi:**
- Pecah pekerjaan menjadi langkah kecil yang dapat direview. Implementasikan hanya scope Phase 4; jangan mengerjakan fase berikutnya kecuali ada dependency minimum yang wajib.
- Pertahankan pola arsitektur, penamaan, response/API contract, design system, dan convention yang sudah dipakai repository. Hindari duplikasi logic dan abstraksi berlebihan.
- Tambahkan/perbarui automated test untuk behavior yang berubah. Untuk Frontend, tambahkan test komponen/alur penting dan verifikasi aksesibilitas dasar; untuk Backend, tambahkan unit/feature test sesuai lapisan.
- Jalankan test, formatter, linter, type-check, build, migration/health check yang relevan. Catat command dan hasil aktual; tandai yang terhalang environment sebagai belum terverifikasi.
- Perbarui dokumentasi API, development, atau ADR bila kontrak/keputusan berubah. Jangan menyimpan secret atau data nyata di repository/log.

**Format laporan akhir wajib:**
1. Ringkasan perubahan dan alasan.
2. File/module utama yang dibuat atau diubah.
3. Acceptance criteria Phase 4: status `Lulus`, `Gagal`, `Belum diuji`, atau `Terhalang`, disertai bukti singkat.
4. Daftar command test/check yang dijalankan dan hasil aktual.
5. Keputusan/gate yang masih menunggu persetujuan, risiko, dan pekerjaan lanjutan.
6. Konfirmasi bahwa `git diff` dan `git status` sudah diperiksa. Jangan commit/push tanpa instruksi.

Mulai dengan audit dan rencana singkat, lalu implementasikan task terkecil yang paling tepat untuk fase ini. Berkomunikasilah dalam Bahasa Indonesia.
```

---

## Phase 5 — Cash Session

### Prompt Backend

```text
Kita akan mengerjakan **Dagana Phase 5 — Cash Session** dari sisi Backend.

Sebelum mengubah kode:
1. Baca `AGENTS.md` dan `docs/README.md`. Lalu baca `PRD-Dagana.md`, requirement spesifik fase di `docs/requirements/`, `docs/planning/phase-targets.md`, `docs/engineering/engineering-standards.md`, serta bagian relevan `docs/planning/decision-log.md` dan `docs/architecture/` sesuai dampak task.
2. Periksa struktur repository, branch, status Git, implementasi, test, dan kontrak API yang sudah ada. Jangan berasumsi repository masih kosong.
3. Cocokkan task dengan target serta acceptance criteria Phase 5. Identifikasi dependency, file yang akan terdampak, dan risiko kompatibilitas.
4. Jika ada konflik requirement, keputusan yang belum disetujui, atau dependency yang belum tersedia, jelaskan terlebih dahulu. Jangan memilih kebijakan bisnis sendiri.
5. Gunakan inti konsep skill `ponytail`, skill `ui-ux-pro-max` untuk implementasi frontend. jika diperlukan, cari skill yang dibutuhkan menggunakan skill `find-skills` sesuai kubutuhan task.

**Tujuan:** membangun API Cash Session untuk kontrol kas operasional.

Implementasikan open session, opening cash, pencatatan cash in/out, refund/adjustment yang diizinkan, close session, expected cash, actual cash, variance, dan catatan selisih. Setiap aktivitas kas harus memiliki record yang dapat ditelusuri; hindari update saldo tanpa ledger. Hitung variance sebagai `actual_cash - expected_cash`. Terapkan aturan satu/multi session aktif hanya setelah keputusan produk tercatat. Session closed tidak boleh diubah diam-diam; koreksi memakai alur eksplisit.

Tambahkan unit test formula (nol, cash in/out, refund, variance positif/negatif) dan feature test open/close, status invalid, permission, serta isolasi outlet. Jika formula expected cash atau aturan concurrency belum disepakati, dokumentasikan gate dan jangan mengarang kebijakan.

**Instruksi implementasi:**
- Pecah pekerjaan menjadi langkah kecil yang dapat direview. Implementasikan hanya scope Phase 5; jangan mengerjakan fase berikutnya kecuali ada dependency minimum yang wajib.
- Pertahankan pola arsitektur, penamaan, response/API contract, design system, dan convention yang sudah dipakai repository. Hindari duplikasi logic dan abstraksi berlebihan.
- Tambahkan/perbarui automated test untuk behavior yang berubah. Untuk Frontend, tambahkan test komponen/alur penting dan verifikasi aksesibilitas dasar; untuk Backend, tambahkan unit/feature test sesuai lapisan.
- Jalankan test, formatter, linter, type-check, build, migration/health check yang relevan. Catat command dan hasil aktual; tandai yang terhalang environment sebagai belum terverifikasi.
- Perbarui dokumentasi API, development, atau ADR bila kontrak/keputusan berubah. Jangan menyimpan secret atau data nyata di repository/log.

**Format laporan akhir wajib:**
1. Ringkasan perubahan dan alasan.
2. File/module utama yang dibuat atau diubah.
3. Acceptance criteria Phase 5: status `Lulus`, `Gagal`, `Belum diuji`, atau `Terhalang`, disertai bukti singkat.
4. Daftar command test/check yang dijalankan dan hasil aktual.
5. Keputusan/gate yang masih menunggu persetujuan, risiko, dan pekerjaan lanjutan.
6. Konfirmasi bahwa `git diff` dan `git status` sudah diperiksa. Jangan commit/push tanpa instruksi.

Mulai dengan audit dan rencana singkat, lalu implementasikan task terkecil yang paling tepat untuk fase ini. Berkomunikasilah dalam Bahasa Indonesia.
```

### Prompt Frontend

```text
Kita akan mengerjakan **Dagana Phase 5 — Cash Session** dari sisi Frontend.

Sebelum mengubah kode:
1. Baca `AGENTS.md` dan `docs/README.md`. Lalu baca `PRD-Dagana.md`, requirement spesifik fase di `docs/requirements/`, `docs/planning/phase-targets.md`, `docs/engineering/engineering-standards.md`, serta bagian relevan `docs/planning/decision-log.md` dan `docs/architecture/` sesuai dampak task.
2. Periksa struktur repository, branch, status Git, implementasi, test, dan kontrak API yang sudah ada. Jangan berasumsi repository masih kosong.
3. Cocokkan task dengan target serta acceptance criteria Phase 5. Identifikasi dependency, file yang akan terdampak, dan risiko kompatibilitas.
4. Jika ada konflik requirement, keputusan yang belum disetujui, atau dependency yang belum tersedia, jelaskan terlebih dahulu. Jangan memilih kebijakan bisnis sendiri.
5. Gunakan inti konsep skill `ponytail`, skill `ui-ux-pro-max` untuk implementasi frontend. jika diperlukan, cari skill yang dibutuhkan menggunakan skill `find-skills` sesuai kubutuhan task.

**Tujuan:** membangun UI operasional pembukaan, pemantauan, dan penutupan kas.

Pada `pos-mobile`, sediakan tampilan status session, form opening cash, ringkasan transaksi/arus kas, pencatatan cash in/out dan aktivitas lain yang memang didukung API, form actual cash saat closing, tampilan expected cash dan variance, serta input catatan selisih. Pada `admin-web`, tampilkan riwayat/reconciliation bila masuk scope PRD dan permission. Gunakan angka hasil backend sebagai sumber final.

**Pemeriksaan wajib:** tampilkan state belum ada session, session aktif, session tertutup, akses ditolak, dan kesalahan submit. Cegah double-submit di UI, tetapi tetap dukung idempotency/constraint backend. Jangan mengizinkan edit diam-diam pada session yang sudah ditutup dan jangan menciptakan aturan pergantian operator yang belum diputuskan.

**Instruksi implementasi:**
- Pecah pekerjaan menjadi langkah kecil yang dapat direview. Implementasikan hanya scope Phase 5; jangan mengerjakan fase berikutnya kecuali ada dependency minimum yang wajib.
- Pertahankan pola arsitektur, penamaan, response/API contract, design system, dan convention yang sudah dipakai repository. Hindari duplikasi logic dan abstraksi berlebihan.
- Tambahkan/perbarui automated test untuk behavior yang berubah. Untuk Frontend, tambahkan test komponen/alur penting dan verifikasi aksesibilitas dasar; untuk Backend, tambahkan unit/feature test sesuai lapisan.
- Jalankan test, formatter, linter, type-check, build, migration/health check yang relevan. Catat command dan hasil aktual; tandai yang terhalang environment sebagai belum terverifikasi.
- Perbarui dokumentasi API, development, atau ADR bila kontrak/keputusan berubah. Jangan menyimpan secret atau data nyata di repository/log.

**Format laporan akhir wajib:**
1. Ringkasan perubahan dan alasan.
2. File/module utama yang dibuat atau diubah.
3. Acceptance criteria Phase 5: status `Lulus`, `Gagal`, `Belum diuji`, atau `Terhalang`, disertai bukti singkat.
4. Daftar command test/check yang dijalankan dan hasil aktual.
5. Keputusan/gate yang masih menunggu persetujuan, risiko, dan pekerjaan lanjutan.
6. Konfirmasi bahwa `git diff` dan `git status` sudah diperiksa. Jangan commit/push tanpa instruksi.

Mulai dengan audit dan rencana singkat, lalu implementasikan task terkecil yang paling tepat untuk fase ini. Berkomunikasilah dalam Bahasa Indonesia.
```

---

## Phase 6 — Basic Inventory

### Prompt Backend

```text
Kita akan mengerjakan **Dagana Phase 6 — Basic Inventory** dari sisi Backend.

Sebelum mengubah kode:
1. Baca `AGENTS.md` dan `docs/README.md`. Lalu baca `PRD-Dagana.md`, requirement spesifik fase di `docs/requirements/`, `docs/planning/phase-targets.md`, `docs/engineering/engineering-standards.md`, serta bagian relevan `docs/planning/decision-log.md` dan `docs/architecture/` sesuai dampak task.
2. Periksa struktur repository, branch, status Git, implementasi, test, dan kontrak API yang sudah ada. Jangan berasumsi repository masih kosong.
3. Cocokkan task dengan target serta acceptance criteria Phase 6. Identifikasi dependency, file yang akan terdampak, dan risiko kompatibilitas.
4. Jika ada konflik requirement, keputusan yang belum disetujui, atau dependency yang belum tersedia, jelaskan terlebih dahulu. Jangan memilih kebijakan bisnis sendiri.
5. Gunakan inti konsep skill `ponytail`, skill `ui-ux-pro-max` untuk implementasi frontend. jika diperlukan, cari skill yang dibutuhkan menggunakan skill `find-skills` sesuai kubutuhan task.

**Tujuan:** membangun inventory dasar yang opsional.

Implementasikan item inventory, saldo stok, stock adjustment, stock movement ledger, ambang low-stock, dan integrasi pengurangan stok dari penjualan hanya ketika konfigurasi/perilakunya telah didefinisikan. Saldo harus dapat dijelaskan dari movement. Gunakan transaksi/locking/idempotency untuk mencegah saldo rusak atau movement ganda ketika ada request/event berulang. Pastikan penjualan biasa tetap berjalan tanpa inventory diaktifkan. Terapkan authorization Business/Outlet.

**Batasan:** unit conversion dan inventory costing belum final. Jangan mengarang konversi satuan, costing, atau kebijakan stok negatif. Test adjustment, rekonsiliasi ledger, low stock, penjualan tanpa inventory, retry, concurrency, dan akses tidak sah.

**Instruksi implementasi:**
- Pecah pekerjaan menjadi langkah kecil yang dapat direview. Implementasikan hanya scope Phase 6; jangan mengerjakan fase berikutnya kecuali ada dependency minimum yang wajib.
- Pertahankan pola arsitektur, penamaan, response/API contract, design system, dan convention yang sudah dipakai repository. Hindari duplikasi logic dan abstraksi berlebihan.
- Tambahkan/perbarui automated test untuk behavior yang berubah. Untuk Frontend, tambahkan test komponen/alur penting dan verifikasi aksesibilitas dasar; untuk Backend, tambahkan unit/feature test sesuai lapisan.
- Jalankan test, formatter, linter, type-check, build, migration/health check yang relevan. Catat command dan hasil aktual; tandai yang terhalang environment sebagai belum terverifikasi.
- Perbarui dokumentasi API, development, atau ADR bila kontrak/keputusan berubah. Jangan menyimpan secret atau data nyata di repository/log.

**Format laporan akhir wajib:**
1. Ringkasan perubahan dan alasan.
2. File/module utama yang dibuat atau diubah.
3. Acceptance criteria Phase 6: status `Lulus`, `Gagal`, `Belum diuji`, atau `Terhalang`, disertai bukti singkat.
4. Daftar command test/check yang dijalankan dan hasil aktual.
5. Keputusan/gate yang masih menunggu persetujuan, risiko, dan pekerjaan lanjutan.
6. Konfirmasi bahwa `git diff` dan `git status` sudah diperiksa. Jangan commit/push tanpa instruksi.

Mulai dengan audit dan rencana singkat, lalu implementasikan task terkecil yang paling tepat untuk fase ini. Berkomunikasilah dalam Bahasa Indonesia.
```

### Prompt Frontend

```text
Kita akan mengerjakan **Dagana Phase 6 — Basic Inventory** dari sisi Frontend.

Sebelum mengubah kode:
1. Baca `AGENTS.md` dan `docs/README.md`. Lalu baca `PRD-Dagana.md`, requirement spesifik fase di `docs/requirements/`, `docs/planning/phase-targets.md`, `docs/engineering/engineering-standards.md`, serta bagian relevan `docs/planning/decision-log.md` dan `docs/architecture/` sesuai dampak task.
2. Periksa struktur repository, branch, status Git, implementasi, test, dan kontrak API yang sudah ada. Jangan berasumsi repository masih kosong.
3. Cocokkan task dengan target serta acceptance criteria Phase 6. Identifikasi dependency, file yang akan terdampak, dan risiko kompatibilitas.
4. Jika ada konflik requirement, keputusan yang belum disetujui, atau dependency yang belum tersedia, jelaskan terlebih dahulu. Jangan memilih kebijakan bisnis sendiri.
5. Gunakan inti konsep skill `ponytail`, skill `ui-ux-pro-max` untuk implementasi frontend. jika diperlukan, cari skill yang dibutuhkan menggunakan skill `find-skills` sesuai kubutuhan task.

**Tujuan:** menyediakan antarmuka inventory dasar yang opsional.

Pada `admin-web`, buat daftar item inventory, tambah/edit/nonaktifkan item, tampilan saldo, form stock adjustment dengan alasan, histori stock movement, dan indikator low-stock berdasarkan ambang dari API. Pada `pos-mobile`, tampilkan informasi stok hanya bila dibutuhkan pada workflow dan didukung API; penjualan sederhana tidak boleh mensyaratkan konfigurasi inventory.

**Pemeriksaan wajib:** jangan mengubah saldo secara lokal tanpa API movement. Tampilkan histori movement dan status sinkronisasi secara jelas. Tangani stok nol/kurang, request konflik, item nonaktif, permission, pagination, dan filter outlet. Jangan menambahkan UI costing, recipe/BOM, supplier, purchase order, atau unit conversion kompleks pada fase ini.

**Instruksi implementasi:**
- Pecah pekerjaan menjadi langkah kecil yang dapat direview. Implementasikan hanya scope Phase 6; jangan mengerjakan fase berikutnya kecuali ada dependency minimum yang wajib.
- Pertahankan pola arsitektur, penamaan, response/API contract, design system, dan convention yang sudah dipakai repository. Hindari duplikasi logic dan abstraksi berlebihan.
- Tambahkan/perbarui automated test untuk behavior yang berubah. Untuk Frontend, tambahkan test komponen/alur penting dan verifikasi aksesibilitas dasar; untuk Backend, tambahkan unit/feature test sesuai lapisan.
- Jalankan test, formatter, linter, type-check, build, migration/health check yang relevan. Catat command dan hasil aktual; tandai yang terhalang environment sebagai belum terverifikasi.
- Perbarui dokumentasi API, development, atau ADR bila kontrak/keputusan berubah. Jangan menyimpan secret atau data nyata di repository/log.

**Format laporan akhir wajib:**
1. Ringkasan perubahan dan alasan.
2. File/module utama yang dibuat atau diubah.
3. Acceptance criteria Phase 6: status `Lulus`, `Gagal`, `Belum diuji`, atau `Terhalang`, disertai bukti singkat.
4. Daftar command test/check yang dijalankan dan hasil aktual.
5. Keputusan/gate yang masih menunggu persetujuan, risiko, dan pekerjaan lanjutan.
6. Konfirmasi bahwa `git diff` dan `git status` sudah diperiksa. Jangan commit/push tanpa instruksi.

Mulai dengan audit dan rencana singkat, lalu implementasikan task terkecil yang paling tepat untuk fase ini. Berkomunikasilah dalam Bahasa Indonesia.
```

---

## Phase 7 — Reporting

### Prompt Backend

```text
Kita akan mengerjakan **Dagana Phase 7 — Reporting** dari sisi Backend.

Sebelum mengubah kode:
1. Baca `AGENTS.md` dan `docs/README.md`. Lalu baca `PRD-Dagana.md`, requirement spesifik fase di `docs/requirements/`, `docs/planning/phase-targets.md`, `docs/engineering/engineering-standards.md`, serta bagian relevan `docs/planning/decision-log.md` dan `docs/architecture/` sesuai dampak task.
2. Periksa struktur repository, branch, status Git, implementasi, test, dan kontrak API yang sudah ada. Jangan berasumsi repository masih kosong.
3. Cocokkan task dengan target serta acceptance criteria Phase 7. Identifikasi dependency, file yang akan terdampak, dan risiko kompatibilitas.
4. Jika ada konflik requirement, keputusan yang belum disetujui, atau dependency yang belum tersedia, jelaskan terlebih dahulu. Jangan memilih kebijakan bisnis sendiri.
5. Gunakan inti konsep skill `ponytail`, skill `ui-ux-pro-max` untuk implementasi frontend. jika diperlukan, cari skill yang dibutuhkan menggunakan skill `find-skills` sesuai kubutuhan task.

**Tujuan:** membangun API reporting MVP berdasarkan sumber transaksi yang sudah tersedia.

Sediakan daily sales, transaction count, payment report, operator report, cash reconciliation, dan basic inventory report jika inventory aktif. Definisikan agregasi berdasarkan data transaksi/payment/cash session yang benar, rentang tanggal, timezone aplikasi, refund/cancel, dan status payment. Terapkan filter Business/Outlet di backend, pagination/batas hasil, dan query yang efisien. Hasil laporan harus dapat dibandingkan dengan fixture yang dihitung manual.

**Batasan:** jangan membangun accounting penuh atau AI analytics. Jangan menyamakan pending/failed dengan paid dan jangan menghitung ulang histori menggunakan harga catalog terkini.

**Instruksi implementasi:**
- Pecah pekerjaan menjadi langkah kecil yang dapat direview. Implementasikan hanya scope Phase 7; jangan mengerjakan fase berikutnya kecuali ada dependency minimum yang wajib.
- Pertahankan pola arsitektur, penamaan, response/API contract, design system, dan convention yang sudah dipakai repository. Hindari duplikasi logic dan abstraksi berlebihan.
- Tambahkan/perbarui automated test untuk behavior yang berubah. Untuk Frontend, tambahkan test komponen/alur penting dan verifikasi aksesibilitas dasar; untuk Backend, tambahkan unit/feature test sesuai lapisan.
- Jalankan test, formatter, linter, type-check, build, migration/health check yang relevan. Catat command dan hasil aktual; tandai yang terhalang environment sebagai belum terverifikasi.
- Perbarui dokumentasi API, development, atau ADR bila kontrak/keputusan berubah. Jangan menyimpan secret atau data nyata di repository/log.

**Format laporan akhir wajib:**
1. Ringkasan perubahan dan alasan.
2. File/module utama yang dibuat atau diubah.
3. Acceptance criteria Phase 7: status `Lulus`, `Gagal`, `Belum diuji`, atau `Terhalang`, disertai bukti singkat.
4. Daftar command test/check yang dijalankan dan hasil aktual.
5. Keputusan/gate yang masih menunggu persetujuan, risiko, dan pekerjaan lanjutan.
6. Konfirmasi bahwa `git diff` dan `git status` sudah diperiksa. Jangan commit/push tanpa instruksi.

Mulai dengan audit dan rencana singkat, lalu implementasikan task terkecil yang paling tepat untuk fase ini. Berkomunikasilah dalam Bahasa Indonesia.
```

### Prompt Frontend

```text
Kita akan mengerjakan **Dagana Phase 7 — Reporting** dari sisi Frontend.

Sebelum mengubah kode:
1. Baca `AGENTS.md` dan `docs/README.md`. Lalu baca `PRD-Dagana.md`, requirement spesifik fase di `docs/requirements/`, `docs/planning/phase-targets.md`, `docs/engineering/engineering-standards.md`, serta bagian relevan `docs/planning/decision-log.md` dan `docs/architecture/` sesuai dampak task.
2. Periksa struktur repository, branch, status Git, implementasi, test, dan kontrak API yang sudah ada. Jangan berasumsi repository masih kosong.
3. Cocokkan task dengan target serta acceptance criteria Phase 7. Identifikasi dependency, file yang akan terdampak, dan risiko kompatibilitas.
4. Jika ada konflik requirement, keputusan yang belum disetujui, atau dependency yang belum tersedia, jelaskan terlebih dahulu. Jangan memilih kebijakan bisnis sendiri.
5. Gunakan inti konsep skill `ponytail`, skill `ui-ux-pro-max` untuk implementasi frontend. jika diperlukan, cari skill yang dibutuhkan menggunakan skill `find-skills` sesuai kubutuhan task.

**Tujuan:** membangun dashboard dan halaman laporan MVP di web.

Buat ringkasan penjualan, jumlah transaksi, payment breakdown, performa operator, cash reconciliation, serta basic inventory report jika modulnya aktif. Sediakan filter tanggal dan outlet sesuai kontrak API, kartu ringkasan, tabel/grafik yang membantu pembacaan tren, serta empty state untuk periode tanpa transaksi. Angka harus berasal dari endpoint reporting; jangan menghitung ulang agregasi bisnis yang seharusnya menjadi tanggung jawab backend.

**Pemeriksaan wajib:** tampilkan rentang tanggal aktif, loading/error/empty state, format IDR, status transaksi/payment yang jelas, dan hasil filter yang konsisten. Hindari chart dekoratif yang tidak menjawab kebutuhan. Jangan menyebut laporan sebagai accounting penuh atau menambahkan AI analytics.

**Instruksi implementasi:**
- Pecah pekerjaan menjadi langkah kecil yang dapat direview. Implementasikan hanya scope Phase 7; jangan mengerjakan fase berikutnya kecuali ada dependency minimum yang wajib.
- Pertahankan pola arsitektur, penamaan, response/API contract, design system, dan convention yang sudah dipakai repository. Hindari duplikasi logic dan abstraksi berlebihan.
- Tambahkan/perbarui automated test untuk behavior yang berubah. Untuk Frontend, tambahkan test komponen/alur penting dan verifikasi aksesibilitas dasar; untuk Backend, tambahkan unit/feature test sesuai lapisan.
- Jalankan test, formatter, linter, type-check, build, migration/health check yang relevan. Catat command dan hasil aktual; tandai yang terhalang environment sebagai belum terverifikasi.
- Perbarui dokumentasi API, development, atau ADR bila kontrak/keputusan berubah. Jangan menyimpan secret atau data nyata di repository/log.

**Format laporan akhir wajib:**
1. Ringkasan perubahan dan alasan.
2. File/module utama yang dibuat atau diubah.
3. Acceptance criteria Phase 7: status `Lulus`, `Gagal`, `Belum diuji`, atau `Terhalang`, disertai bukti singkat.
4. Daftar command test/check yang dijalankan dan hasil aktual.
5. Keputusan/gate yang masih menunggu persetujuan, risiko, dan pekerjaan lanjutan.
6. Konfirmasi bahwa `git diff` dan `git status` sudah diperiksa. Jangan commit/push tanpa instruksi.

Mulai dengan audit dan rencana singkat, lalu implementasikan task terkecil yang paling tepat untuk fase ini. Berkomunikasilah dalam Bahasa Indonesia.
```

---

## Phase 8 — QR Ordering

### Prompt Backend

```text
Kita akan mengerjakan **Dagana Phase 8 — QR Ordering** dari sisi Backend.

Sebelum mengubah kode:
1. Baca `AGENTS.md` dan `docs/README.md`. Lalu baca `PRD-Dagana.md`, requirement spesifik fase di `docs/requirements/`, `docs/planning/phase-targets.md`, `docs/engineering/engineering-standards.md`, serta bagian relevan `docs/planning/decision-log.md` dan `docs/architecture/` sesuai dampak task.
2. Periksa struktur repository, branch, status Git, implementasi, test, dan kontrak API yang sudah ada. Jangan berasumsi repository masih kosong.
3. Cocokkan task dengan target serta acceptance criteria Phase 8. Identifikasi dependency, file yang akan terdampak, dan risiko kompatibilitas.
4. Jika ada konflik requirement, keputusan yang belum disetujui, atau dependency yang belum tersedia, jelaskan terlebih dahulu. Jangan memilih kebijakan bisnis sendiri.
5. Gunakan inti konsep skill `ponytail`, skill `ui-ux-pro-max` untuk implementasi frontend. jika diperlukan, cari skill yang dibutuhkan menggunakan skill `find-skills` sesuai kubutuhan task.

**Tujuan:** membangun backend QR Ordering sebagai channel tambahan dengan Order Engine yang sama.

Implementasikan pengelolaan table/identitas QR sesuai model yang disetujui, pemetaan QR ke Outlet, customer menu, guest cart/order creation, dan status order yang boleh dilihat pelanggan. Validasi QR/table/outlet/menu/harga/availability di server. Simpan source channel `QR`; order tetap menggunakan model dan invariant Order Engine yang sama dengan POS. Pastikan menonaktifkan QR tidak mengganggu POS. Tambahkan test QR valid/tidak valid, menu tidak tersedia, manipulasi outlet context, dan isolasi tenant.

**Batasan:** guest ordering sesuai PRD; customer login, split bill, dan advanced table management tidak otomatis masuk scope. Jangan mempercayai Business/Outlet ID dari payload pelanggan.

**Instruksi implementasi:**
- Pecah pekerjaan menjadi langkah kecil yang dapat direview. Implementasikan hanya scope Phase 8; jangan mengerjakan fase berikutnya kecuali ada dependency minimum yang wajib.
- Pertahankan pola arsitektur, penamaan, response/API contract, design system, dan convention yang sudah dipakai repository. Hindari duplikasi logic dan abstraksi berlebihan.
- Tambahkan/perbarui automated test untuk behavior yang berubah. Untuk Frontend, tambahkan test komponen/alur penting dan verifikasi aksesibilitas dasar; untuk Backend, tambahkan unit/feature test sesuai lapisan.
- Jalankan test, formatter, linter, type-check, build, migration/health check yang relevan. Catat command dan hasil aktual; tandai yang terhalang environment sebagai belum terverifikasi.
- Perbarui dokumentasi API, development, atau ADR bila kontrak/keputusan berubah. Jangan menyimpan secret atau data nyata di repository/log.

**Format laporan akhir wajib:**
1. Ringkasan perubahan dan alasan.
2. File/module utama yang dibuat atau diubah.
3. Acceptance criteria Phase 8: status `Lulus`, `Gagal`, `Belum diuji`, atau `Terhalang`, disertai bukti singkat.
4. Daftar command test/check yang dijalankan dan hasil aktual.
5. Keputusan/gate yang masih menunggu persetujuan, risiko, dan pekerjaan lanjutan.
6. Konfirmasi bahwa `git diff` dan `git status` sudah diperiksa. Jangan commit/push tanpa instruksi.

Mulai dengan audit dan rencana singkat, lalu implementasikan task terkecil yang paling tepat untuk fase ini. Berkomunikasilah dalam Bahasa Indonesia.
```

### Prompt Frontend

```text
Kita akan mengerjakan **Dagana Phase 8 — QR Ordering** dari sisi Frontend.

Sebelum mengubah kode:
1. Baca `AGENTS.md` dan `docs/README.md`. Lalu baca `PRD-Dagana.md`, requirement spesifik fase di `docs/requirements/`, `docs/planning/phase-targets.md`, `docs/engineering/engineering-standards.md`, serta bagian relevan `docs/planning/decision-log.md` dan `docs/architecture/` sesuai dampak task.
2. Periksa struktur repository, branch, status Git, implementasi, test, dan kontrak API yang sudah ada. Jangan berasumsi repository masih kosong.
3. Cocokkan task dengan target serta acceptance criteria Phase 8. Identifikasi dependency, file yang akan terdampak, dan risiko kompatibilitas.
4. Jika ada konflik requirement, keputusan yang belum disetujui, atau dependency yang belum tersedia, jelaskan terlebih dahulu. Jangan memilih kebijakan bisnis sendiri.
5. Gunakan inti konsep skill `ponytail`, skill `ui-ux-pro-max` untuk implementasi frontend. jika diperlukan, cari skill yang dibutuhkan menggunakan skill `find-skills` sesuai kubutuhan task.

**Tujuan:** membangun customer-facing QR ordering dan pengelolaan QR dasar.

Pada `customer-web`, buat halaman menu publik yang dibuka melalui QR, identifikasi outlet/meja dari QR, daftar kategori/menu, detail item dasar, guest cart, ringkasan, submit order, dan tampilan status order sesuai API. Pada `admin-web`, sediakan pengelolaan meja/QR dan status aktivasi bila dibutuhkan oleh PRD. Desain harus nyaman di browser mobile.

**Pemeriksaan wajib:** jangan meminta login pelanggan jika guest mode adalah alur yang dipilih PRD. Jangan menganggap data outlet dari URL sebagai trusted; gunakan hasil resolusi QR dari API. Tangani QR tidak valid/nonaktif, menu habis/nonaktif, submit gagal, retry, dan status order. Jangan membuat checkout/payment flow baru yang menyimpang dari Order Engine.

**Instruksi implementasi:**
- Pecah pekerjaan menjadi langkah kecil yang dapat direview. Implementasikan hanya scope Phase 8; jangan mengerjakan fase berikutnya kecuali ada dependency minimum yang wajib.
- Pertahankan pola arsitektur, penamaan, response/API contract, design system, dan convention yang sudah dipakai repository. Hindari duplikasi logic dan abstraksi berlebihan.
- Tambahkan/perbarui automated test untuk behavior yang berubah. Untuk Frontend, tambahkan test komponen/alur penting dan verifikasi aksesibilitas dasar; untuk Backend, tambahkan unit/feature test sesuai lapisan.
- Jalankan test, formatter, linter, type-check, build, migration/health check yang relevan. Catat command dan hasil aktual; tandai yang terhalang environment sebagai belum terverifikasi.
- Perbarui dokumentasi API, development, atau ADR bila kontrak/keputusan berubah. Jangan menyimpan secret atau data nyata di repository/log.

**Format laporan akhir wajib:**
1. Ringkasan perubahan dan alasan.
2. File/module utama yang dibuat atau diubah.
3. Acceptance criteria Phase 8: status `Lulus`, `Gagal`, `Belum diuji`, atau `Terhalang`, disertai bukti singkat.
4. Daftar command test/check yang dijalankan dan hasil aktual.
5. Keputusan/gate yang masih menunggu persetujuan, risiko, dan pekerjaan lanjutan.
6. Konfirmasi bahwa `git diff` dan `git status` sudah diperiksa. Jangan commit/push tanpa instruksi.

Mulai dengan audit dan rencana singkat, lalu implementasikan task terkecil yang paling tepat untuk fase ini. Berkomunikasilah dalam Bahasa Indonesia.
```

---

## Phase 9 — Realtime

### Prompt Backend

```text
Kita akan mengerjakan **Dagana Phase 9 — Realtime** dari sisi Backend.

Sebelum mengubah kode:
1. Baca `AGENTS.md` dan `docs/README.md`. Lalu baca `PRD-Dagana.md`, requirement spesifik fase di `docs/requirements/`, `docs/planning/phase-targets.md`, `docs/engineering/engineering-standards.md`, serta bagian relevan `docs/planning/decision-log.md` dan `docs/architecture/` sesuai dampak task.
2. Periksa struktur repository, branch, status Git, implementasi, test, dan kontrak API yang sudah ada. Jangan berasumsi repository masih kosong.
3. Cocokkan task dengan target serta acceptance criteria Phase 9. Identifikasi dependency, file yang akan terdampak, dan risiko kompatibilitas.
4. Jika ada konflik requirement, keputusan yang belum disetujui, atau dependency yang belum tersedia, jelaskan terlebih dahulu. Jangan memilih kebijakan bisnis sendiri.
5. Gunakan inti konsep skill `ponytail`, skill `ui-ux-pro-max` untuk implementasi frontend. jika diperlukan, cari skill yang dibutuhkan menggunakan skill `find-skills` sesuai kubutuhan task.

**Tujuan:** menambahkan event delivery untuk perubahan operasional.

Implementasikan event yang diperlukan untuk QR order notification, kitchen/order updates, payment status, dan stock updates bila modul terkait tersedia. Tentukan nama event, payload minimum, trigger, recipient, dan authorization channel. Database tetap source of truth. Untuk event setelah commit, gunakan mekanisme yang aman (misalnya after-commit/outbox bila diperlukan) agar event tidak mengumumkan perubahan yang gagal. Terapkan authorization Business/Outlet pada channel, serta idempotency/deduplication untuk handler yang punya side effect.

Periksa keputusan provider pada `docs/planning/decision-log.md` (Laravel Reverb sebagai rekomendasi baseline) dan tandai status persetujuannya. Tambahkan test isolasi channel, commit timing, delivery retry, dan resync melalui API.

**Instruksi implementasi:**
- Pecah pekerjaan menjadi langkah kecil yang dapat direview. Implementasikan hanya scope Phase 9; jangan mengerjakan fase berikutnya kecuali ada dependency minimum yang wajib.
- Pertahankan pola arsitektur, penamaan, response/API contract, design system, dan convention yang sudah dipakai repository. Hindari duplikasi logic dan abstraksi berlebihan.
- Tambahkan/perbarui automated test untuk behavior yang berubah. Untuk Frontend, tambahkan test komponen/alur penting dan verifikasi aksesibilitas dasar; untuk Backend, tambahkan unit/feature test sesuai lapisan.
- Jalankan test, formatter, linter, type-check, build, migration/health check yang relevan. Catat command dan hasil aktual; tandai yang terhalang environment sebagai belum terverifikasi.
- Perbarui dokumentasi API, development, atau ADR bila kontrak/keputusan berubah. Jangan menyimpan secret atau data nyata di repository/log.

**Format laporan akhir wajib:**
1. Ringkasan perubahan dan alasan.
2. File/module utama yang dibuat atau diubah.
3. Acceptance criteria Phase 9: status `Lulus`, `Gagal`, `Belum diuji`, atau `Terhalang`, disertai bukti singkat.
4. Daftar command test/check yang dijalankan dan hasil aktual.
5. Keputusan/gate yang masih menunggu persetujuan, risiko, dan pekerjaan lanjutan.
6. Konfirmasi bahwa `git diff` dan `git status` sudah diperiksa. Jangan commit/push tanpa instruksi.

Mulai dengan audit dan rencana singkat, lalu implementasikan task terkecil yang paling tepat untuk fase ini. Berkomunikasilah dalam Bahasa Indonesia.
```

### Prompt Frontend

```text
Kita akan mengerjakan **Dagana Phase 9 — Realtime** dari sisi Frontend.

Sebelum mengubah kode:
1. Baca `AGENTS.md` dan `docs/README.md`. Lalu baca `PRD-Dagana.md`, requirement spesifik fase di `docs/requirements/`, `docs/planning/phase-targets.md`, `docs/engineering/engineering-standards.md`, serta bagian relevan `docs/planning/decision-log.md` dan `docs/architecture/` sesuai dampak task.
2. Periksa struktur repository, branch, status Git, implementasi, test, dan kontrak API yang sudah ada. Jangan berasumsi repository masih kosong.
3. Cocokkan task dengan target serta acceptance criteria Phase 9. Identifikasi dependency, file yang akan terdampak, dan risiko kompatibilitas.
4. Jika ada konflik requirement, keputusan yang belum disetujui, atau dependency yang belum tersedia, jelaskan terlebih dahulu. Jangan memilih kebijakan bisnis sendiri.
5. Gunakan inti konsep skill `ponytail`, skill `ui-ux-pro-max` untuk implementasi frontend. jika diperlukan, cari skill yang dibutuhkan menggunakan skill `find-skills` sesuai kubutuhan task.

**Tujuan:** mengintegrasikan UI web/mobile dengan event realtime yang disediakan backend.

Tampilkan update order baru/status order, payment status, dan stock update yang relevan pada layar yang berhak menerimanya. Gunakan channel/subscription yang ditentukan kontrak backend; jangan menebak nama event atau channel. Ketika koneksi terputus/terlewat event, lakukan reconnect dan ambil ulang state terbaru melalui API. Event hanya mempercepat pembaruan UI; state API tetap sumber kebenaran.

**Pemeriksaan wajib:** tangani connected/disconnected/reconnecting, duplicate event, event terlambat, dan resync. Jangan mengandalkan event untuk menyimpan data transaksi. Jangan menampilkan notifikasi data dari Business/Outlet lain. Jangan memasang provider/client library yang belum diputuskan tanpa mencatat keputusan dan kompatibilitasnya.

**Instruksi implementasi:**
- Pecah pekerjaan menjadi langkah kecil yang dapat direview. Implementasikan hanya scope Phase 9; jangan mengerjakan fase berikutnya kecuali ada dependency minimum yang wajib.
- Pertahankan pola arsitektur, penamaan, response/API contract, design system, dan convention yang sudah dipakai repository. Hindari duplikasi logic dan abstraksi berlebihan.
- Tambahkan/perbarui automated test untuk behavior yang berubah. Untuk Frontend, tambahkan test komponen/alur penting dan verifikasi aksesibilitas dasar; untuk Backend, tambahkan unit/feature test sesuai lapisan.
- Jalankan test, formatter, linter, type-check, build, migration/health check yang relevan. Catat command dan hasil aktual; tandai yang terhalang environment sebagai belum terverifikasi.
- Perbarui dokumentasi API, development, atau ADR bila kontrak/keputusan berubah. Jangan menyimpan secret atau data nyata di repository/log.

**Format laporan akhir wajib:**
1. Ringkasan perubahan dan alasan.
2. File/module utama yang dibuat atau diubah.
3. Acceptance criteria Phase 9: status `Lulus`, `Gagal`, `Belum diuji`, atau `Terhalang`, disertai bukti singkat.
4. Daftar command test/check yang dijalankan dan hasil aktual.
5. Keputusan/gate yang masih menunggu persetujuan, risiko, dan pekerjaan lanjutan.
6. Konfirmasi bahwa `git diff` dan `git status` sudah diperiksa. Jangan commit/push tanpa instruksi.

Mulai dengan audit dan rencana singkat, lalu implementasikan task terkecil yang paling tepat untuk fase ini. Berkomunikasilah dalam Bahasa Indonesia.
```

---

## Phase 10 — Billing

### Prompt Backend

```text
Kita akan mengerjakan **Dagana Phase 10 — Billing** dari sisi Backend.

Sebelum mengubah kode:
1. Baca `AGENTS.md` dan `docs/README.md`. Lalu baca `PRD-Dagana.md`, requirement spesifik fase di `docs/requirements/`, `docs/planning/phase-targets.md`, `docs/engineering/engineering-standards.md`, serta bagian relevan `docs/planning/decision-log.md` dan `docs/architecture/` sesuai dampak task.
2. Periksa struktur repository, branch, status Git, implementasi, test, dan kontrak API yang sudah ada. Jangan berasumsi repository masih kosong.
3. Cocokkan task dengan target serta acceptance criteria Phase 10. Identifikasi dependency, file yang akan terdampak, dan risiko kompatibilitas.
4. Jika ada konflik requirement, keputusan yang belum disetujui, atau dependency yang belum tersedia, jelaskan terlebih dahulu. Jangan memilih kebijakan bisnis sendiri.
5. Gunakan inti konsep skill `ponytail`, skill `ui-ux-pro-max` untuk implementasi frontend. jika diperlukan, cari skill yang dibutuhkan menggunakan skill `find-skills` sesuai kubutuhan task.

**Tujuan:** membangun domain billing platform yang terpisah dari payment pelanggan.

Siapkan struktur konfigurasi billing, periode, transaksi eligible/billable, platform fee, statement, status, dan traceability ke transaksi sumber berdasarkan aturan yang telah disetujui. Pastikan proses perhitungan ulang tidak membuat item ganda tanpa mekanisme revisi eksplisit. Isolasi data billing antar Business. Pisahkan billing platform dari payment order pelanggan.

**Gate penting:** tarif, formula, periode, dan definisi eligible harus merujuk keputusan Product Owner dan D-12 sampai D-14. Bila belum disetujui, implementasikan hanya struktur/configuration yang aman dan tandai nominal sebagai belum final; jangan mengarang rate, menagih, atau mengaktifkan billing berbayar.

**Instruksi implementasi:**
- Pecah pekerjaan menjadi langkah kecil yang dapat direview. Implementasikan hanya scope Phase 10; jangan mengerjakan fase berikutnya kecuali ada dependency minimum yang wajib.
- Pertahankan pola arsitektur, penamaan, response/API contract, design system, dan convention yang sudah dipakai repository. Hindari duplikasi logic dan abstraksi berlebihan.
- Tambahkan/perbarui automated test untuk behavior yang berubah. Untuk Frontend, tambahkan test komponen/alur penting dan verifikasi aksesibilitas dasar; untuk Backend, tambahkan unit/feature test sesuai lapisan.
- Jalankan test, formatter, linter, type-check, build, migration/health check yang relevan. Catat command dan hasil aktual; tandai yang terhalang environment sebagai belum terverifikasi.
- Perbarui dokumentasi API, development, atau ADR bila kontrak/keputusan berubah. Jangan menyimpan secret atau data nyata di repository/log.

**Format laporan akhir wajib:**
1. Ringkasan perubahan dan alasan.
2. File/module utama yang dibuat atau diubah.
3. Acceptance criteria Phase 10: status `Lulus`, `Gagal`, `Belum diuji`, atau `Terhalang`, disertai bukti singkat.
4. Daftar command test/check yang dijalankan dan hasil aktual.
5. Keputusan/gate yang masih menunggu persetujuan, risiko, dan pekerjaan lanjutan.
6. Konfirmasi bahwa `git diff` dan `git status` sudah diperiksa. Jangan commit/push tanpa instruksi.

Mulai dengan audit dan rencana singkat, lalu implementasikan task terkecil yang paling tepat untuk fase ini. Berkomunikasilah dalam Bahasa Indonesia.
```

### Prompt Frontend

```text
Kita akan mengerjakan **Dagana Phase 10 — Billing** dari sisi Frontend.

Sebelum mengubah kode:
1. Baca `AGENTS.md` dan `docs/README.md`. Lalu baca `PRD-Dagana.md`, requirement spesifik fase di `docs/requirements/`, `docs/planning/phase-targets.md`, `docs/engineering/engineering-standards.md`, serta bagian relevan `docs/planning/decision-log.md` dan `docs/architecture/` sesuai dampak task.
2. Periksa struktur repository, branch, status Git, implementasi, test, dan kontrak API yang sudah ada. Jangan berasumsi repository masih kosong.
3. Cocokkan task dengan target serta acceptance criteria Phase 10. Identifikasi dependency, file yang akan terdampak, dan risiko kompatibilitas.
4. Jika ada konflik requirement, keputusan yang belum disetujui, atau dependency yang belum tersedia, jelaskan terlebih dahulu. Jangan memilih kebijakan bisnis sendiri.
5. Gunakan inti konsep skill `ponytail`, skill `ui-ux-pro-max` untuk implementasi frontend. jika diperlukan, cari skill yang dibutuhkan menggunakan skill `find-skills` sesuai kubutuhan task.

**Tujuan:** menyediakan UI owner untuk melihat konfigurasi dan statement billing platform.

Buat halaman billing yang menampilkan periode, status statement, dasar perhitungan, transaksi eligible, nilai fee, dan detail item hanya sesuai data/aturan yang sudah disediakan API. Bedakan billing platform dari payment order pelanggan. Jika formula/tarif belum disetujui, tampilkan status belum final atau placeholder informatif; jangan menampilkan nominal hasil asumsi dan jangan membuat aksi pembayaran yang belum didukung backend.

**Pemeriksaan wajib:** akses hanya untuk pihak yang berhak, state periode kosong, statement belum tersedia, statement final, dan error API. Jangan menghitung platform fee sendiri di frontend. Jangan mengaktifkan penagihan atau mengasumsikan provider pembayaran billing.

**Instruksi implementasi:**
- Pecah pekerjaan menjadi langkah kecil yang dapat direview. Implementasikan hanya scope Phase 10; jangan mengerjakan fase berikutnya kecuali ada dependency minimum yang wajib.
- Pertahankan pola arsitektur, penamaan, response/API contract, design system, dan convention yang sudah dipakai repository. Hindari duplikasi logic dan abstraksi berlebihan.
- Tambahkan/perbarui automated test untuk behavior yang berubah. Untuk Frontend, tambahkan test komponen/alur penting dan verifikasi aksesibilitas dasar; untuk Backend, tambahkan unit/feature test sesuai lapisan.
- Jalankan test, formatter, linter, type-check, build, migration/health check yang relevan. Catat command dan hasil aktual; tandai yang terhalang environment sebagai belum terverifikasi.
- Perbarui dokumentasi API, development, atau ADR bila kontrak/keputusan berubah. Jangan menyimpan secret atau data nyata di repository/log.

**Format laporan akhir wajib:**
1. Ringkasan perubahan dan alasan.
2. File/module utama yang dibuat atau diubah.
3. Acceptance criteria Phase 10: status `Lulus`, `Gagal`, `Belum diuji`, atau `Terhalang`, disertai bukti singkat.
4. Daftar command test/check yang dijalankan dan hasil aktual.
5. Keputusan/gate yang masih menunggu persetujuan, risiko, dan pekerjaan lanjutan.
6. Konfirmasi bahwa `git diff` dan `git status` sudah diperiksa. Jangan commit/push tanpa instruksi.

Mulai dengan audit dan rencana singkat, lalu implementasikan task terkecil yang paling tepat untuk fase ini. Berkomunikasilah dalam Bahasa Indonesia.
```

---

## Phase 11 — Stabilization

### Prompt Backend

```text
Kita akan mengerjakan **Dagana Phase 11 — Stabilization** dari sisi Backend.

Sebelum mengubah kode:
1. Baca `AGENTS.md` dan `docs/README.md`. Lalu baca `PRD-Dagana.md`, requirement spesifik fase di `docs/requirements/`, `docs/planning/phase-targets.md`, `docs/engineering/engineering-standards.md`, serta bagian relevan `docs/planning/decision-log.md` dan `docs/architecture/` sesuai dampak task.
2. Periksa struktur repository, branch, status Git, implementasi, test, dan kontrak API yang sudah ada. Jangan berasumsi repository masih kosong.
3. Cocokkan task dengan target serta acceptance criteria Phase 11. Identifikasi dependency, file yang akan terdampak, dan risiko kompatibilitas.
4. Jika ada konflik requirement, keputusan yang belum disetujui, atau dependency yang belum tersedia, jelaskan terlebih dahulu. Jangan memilih kebijakan bisnis sendiri.
5. Gunakan inti konsep skill `ponytail`, skill `ui-ux-pro-max` untuk implementasi frontend. jika diperlukan, cari skill yang dibutuhkan menggunakan skill `find-skills` sesuai kubutuhan task.

**Tujuan:** menstabilkan backend untuk release scope yang telah disepakati.

Audit alur register → business → outlet → catalog → open cash → sell → payment → order history/reporting → close cash/reconciliation. Fokus pada regresi, validasi, authorization tenant/outlet, invalid state transition, checkout atomicity/rollback, idempotency, duplicate payment callback bila ada, query/performa, logging aman, backup/restore, dan deployment readiness. Perbaiki bug dalam scope; jangan menambah fitur besar secara otomatis.

Jalankan test, formatter, static analysis, security checks, dan migration checks yang tersedia. Ukur performa sebelum membuat klaim. Verifikasi backup dengan restore test bila masuk scope. Buat release readiness report dan catat risiko terbuka.

**Instruksi implementasi:**
- Pecah pekerjaan menjadi langkah kecil yang dapat direview. Implementasikan hanya scope Phase 11; jangan mengerjakan fase berikutnya kecuali ada dependency minimum yang wajib.
- Pertahankan pola arsitektur, penamaan, response/API contract, design system, dan convention yang sudah dipakai repository. Hindari duplikasi logic dan abstraksi berlebihan.
- Tambahkan/perbarui automated test untuk behavior yang berubah. Untuk Frontend, tambahkan test komponen/alur penting dan verifikasi aksesibilitas dasar; untuk Backend, tambahkan unit/feature test sesuai lapisan.
- Jalankan test, formatter, linter, type-check, build, migration/health check yang relevan. Catat command dan hasil aktual; tandai yang terhalang environment sebagai belum terverifikasi.
- Perbarui dokumentasi API, development, atau ADR bila kontrak/keputusan berubah. Jangan menyimpan secret atau data nyata di repository/log.

**Format laporan akhir wajib:**
1. Ringkasan perubahan dan alasan.
2. File/module utama yang dibuat atau diubah.
3. Acceptance criteria Phase 11: status `Lulus`, `Gagal`, `Belum diuji`, atau `Terhalang`, disertai bukti singkat.
4. Daftar command test/check yang dijalankan dan hasil aktual.
5. Keputusan/gate yang masih menunggu persetujuan, risiko, dan pekerjaan lanjutan.
6. Konfirmasi bahwa `git diff` dan `git status` sudah diperiksa. Jangan commit/push tanpa instruksi.

Mulai dengan audit dan rencana singkat, lalu implementasikan task terkecil yang paling tepat untuk fase ini. Berkomunikasilah dalam Bahasa Indonesia.
```

### Prompt Frontend

```text
Kita akan mengerjakan **Dagana Phase 11 — Stabilization** dari sisi Frontend.

Sebelum mengubah kode:
1. Baca `AGENTS.md` dan `docs/README.md`. Lalu baca `PRD-Dagana.md`, requirement spesifik fase di `docs/requirements/`, `docs/planning/phase-targets.md`, `docs/engineering/engineering-standards.md`, serta bagian relevan `docs/planning/decision-log.md` dan `docs/architecture/` sesuai dampak task.
2. Periksa struktur repository, branch, status Git, implementasi, test, dan kontrak API yang sudah ada. Jangan berasumsi repository masih kosong.
3. Cocokkan task dengan target serta acceptance criteria Phase 11. Identifikasi dependency, file yang akan terdampak, dan risiko kompatibilitas.
4. Jika ada konflik requirement, keputusan yang belum disetujui, atau dependency yang belum tersedia, jelaskan terlebih dahulu. Jangan memilih kebijakan bisnis sendiri.
5. Gunakan inti konsep skill `ponytail`, skill `ui-ux-pro-max` untuk implementasi frontend. jika diperlukan, cari skill yang dibutuhkan menggunakan skill `find-skills` sesuai kubutuhan task.

**Tujuan:** menstabilkan seluruh frontend yang masuk release scope.

Lakukan regresi alur autentikasi/onboarding, pengelolaan catalog, POS checkout/receipt, cash session, reporting, dan QR/realtime/billing hanya bila fitur tersebut diaktifkan dalam target rilis. Periksa konsistensi API contract, permission-based UI, loading/empty/error states, responsive layout, keyboard/accessibility, form validation, session expiry, duplicate submit, reconnect/resync, serta kompatibilitas browser/perangkat yang ditargetkan.

Jalankan lint, type-check, test, build, dan smoke test aktual untuk setiap app yang dirilis. Perbaiki bug dalam scope, jangan menambah fitur baru. Buat daftar issue tersisa berdasarkan severity dan release readiness report.

**Instruksi implementasi:**
- Pecah pekerjaan menjadi langkah kecil yang dapat direview. Implementasikan hanya scope Phase 11; jangan mengerjakan fase berikutnya kecuali ada dependency minimum yang wajib.
- Pertahankan pola arsitektur, penamaan, response/API contract, design system, dan convention yang sudah dipakai repository. Hindari duplikasi logic dan abstraksi berlebihan.
- Tambahkan/perbarui automated test untuk behavior yang berubah. Untuk Frontend, tambahkan test komponen/alur penting dan verifikasi aksesibilitas dasar; untuk Backend, tambahkan unit/feature test sesuai lapisan.
- Jalankan test, formatter, linter, type-check, build, migration/health check yang relevan. Catat command dan hasil aktual; tandai yang terhalang environment sebagai belum terverifikasi.
- Perbarui dokumentasi API, development, atau ADR bila kontrak/keputusan berubah. Jangan menyimpan secret atau data nyata di repository/log.

**Format laporan akhir wajib:**
1. Ringkasan perubahan dan alasan.
2. File/module utama yang dibuat atau diubah.
3. Acceptance criteria Phase 11: status `Lulus`, `Gagal`, `Belum diuji`, atau `Terhalang`, disertai bukti singkat.
4. Daftar command test/check yang dijalankan dan hasil aktual.
5. Keputusan/gate yang masih menunggu persetujuan, risiko, dan pekerjaan lanjutan.
6. Konfirmasi bahwa `git diff` dan `git status` sudah diperiksa. Jangan commit/push tanpa instruksi.

Mulai dengan audit dan rencana singkat, lalu implementasikan task terkecil yang paling tepat untuk fase ini. Berkomunikasilah dalam Bahasa Indonesia.
```

---

## Phase 12 — Advanced F&B Operations

### Prompt Backend

```text
Kita akan mengerjakan **Dagana Phase 12 — Advanced F&B Operations** dari sisi Backend.

Sebelum mengubah kode:
1. Baca `AGENTS.md` dan `docs/README.md`. Lalu baca `PRD-Dagana.md`, requirement spesifik fase di `docs/requirements/`, `docs/planning/phase-targets.md`, `docs/engineering/engineering-standards.md`, serta bagian relevan `docs/planning/decision-log.md` dan `docs/architecture/` sesuai dampak task.
2. Periksa struktur repository, branch, status Git, implementasi, test, dan kontrak API yang sudah ada. Jangan berasumsi repository masih kosong.
3. Cocokkan task dengan target serta acceptance criteria Phase 12. Identifikasi dependency, file yang akan terdampak, dan risiko kompatibilitas.
4. Jika ada konflik requirement, keputusan yang belum disetujui, atau dependency yang belum tersedia, jelaskan terlebih dahulu. Jangan memilih kebijakan bisnis sendiri.
5. Gunakan inti konsep skill `ponytail`, skill `ui-ux-pro-max` untuk implementasi frontend. jika diperlukan, cari skill yang dibutuhkan menggunakan skill `find-skills` sesuai kubutuhan task.

**Tujuan:** mengembangkan domain F&B lanjutan hanya berdasarkan satu subfase yang dipilih: 12A Recipe & BOM, 12B Advanced Inventory/Stock Opname/Waste, 12C COGS & Inventory Costing, atau 12D Modifier & Variant.

Sebelum coding, minta/identifikasi subfase spesifik yang menjadi target task. Jangan implementasikan seluruh Phase 12 dalam satu perubahan. Turunkan requirement, model, migration, API, authorization, transaction rules, audit trail, dan test dari PRD serta keputusan yang sudah disetujui. Pertahankan satu source of truth pada domain catalog/order/inventory. Histori dan movement ledger harus tetap terlacak.

**Gate:** recipe harus mengikuti versi/masa berlaku; kebijakan stok negatif harus disetujui; costing method harus diputuskan sebelum COGS disebut final; modifier/variant harus divalidasi server-side dan tersimpan sebagai snapshot order. Jangan mengarang aturan yang belum diputuskan. Setiap subfase harus punya test normal, edge case, concurrency, reversal/correction, dan tenant/outlet authorization.

**Instruksi implementasi:**
- Pecah pekerjaan menjadi langkah kecil yang dapat direview. Implementasikan hanya scope Phase 12; jangan mengerjakan fase berikutnya kecuali ada dependency minimum yang wajib.
- Pertahankan pola arsitektur, penamaan, response/API contract, design system, dan convention yang sudah dipakai repository. Hindari duplikasi logic dan abstraksi berlebihan.
- Tambahkan/perbarui automated test untuk behavior yang berubah. Untuk Frontend, tambahkan test komponen/alur penting dan verifikasi aksesibilitas dasar; untuk Backend, tambahkan unit/feature test sesuai lapisan.
- Jalankan test, formatter, linter, type-check, build, migration/health check yang relevan. Catat command dan hasil aktual; tandai yang terhalang environment sebagai belum terverifikasi.
- Perbarui dokumentasi API, development, atau ADR bila kontrak/keputusan berubah. Jangan menyimpan secret atau data nyata di repository/log.

**Format laporan akhir wajib:**
1. Ringkasan perubahan dan alasan.
2. File/module utama yang dibuat atau diubah.
3. Acceptance criteria Phase 12: status `Lulus`, `Gagal`, `Belum diuji`, atau `Terhalang`, disertai bukti singkat.
4. Daftar command test/check yang dijalankan dan hasil aktual.
5. Keputusan/gate yang masih menunggu persetujuan, risiko, dan pekerjaan lanjutan.
6. Konfirmasi bahwa `git diff` dan `git status` sudah diperiksa. Jangan commit/push tanpa instruksi.

Mulai dengan audit dan rencana singkat, lalu implementasikan task terkecil yang paling tepat untuk fase ini. Berkomunikasilah dalam Bahasa Indonesia.
```

### Prompt Frontend

```text
Kita akan mengerjakan **Dagana Phase 12 — Advanced F&B Operations** dari sisi Frontend.

Sebelum mengubah kode:
1. Baca `AGENTS.md` dan `docs/README.md`. Lalu baca `PRD-Dagana.md`, requirement spesifik fase di `docs/requirements/`, `docs/planning/phase-targets.md`, `docs/engineering/engineering-standards.md`, serta bagian relevan `docs/planning/decision-log.md` dan `docs/architecture/` sesuai dampak task.
2. Periksa struktur repository, branch, status Git, implementasi, test, dan kontrak API yang sudah ada. Jangan berasumsi repository masih kosong.
3. Cocokkan task dengan target serta acceptance criteria Phase 12. Identifikasi dependency, file yang akan terdampak, dan risiko kompatibilitas.
4. Jika ada konflik requirement, keputusan yang belum disetujui, atau dependency yang belum tersedia, jelaskan terlebih dahulu. Jangan memilih kebijakan bisnis sendiri.
5. Gunakan inti konsep skill `ponytail`, skill `ui-ux-pro-max` untuk implementasi frontend. jika diperlukan, cari skill yang dibutuhkan menggunakan skill `find-skills` sesuai kubutuhan task.

**Tujuan:** membangun UI untuk satu subfase lanjutan yang dipilih dari Phase 12: 12A Recipe & BOM, 12B Advanced Inventory/Stock Opname/Waste, 12C COGS & Inventory Costing, atau 12D Modifier & Variant.

Jangan membuat seluruh fitur Phase 12 sekaligus. Pastikan subfase dan API contract backend sudah jelas. Bangun hanya layar, form, tabel, simulasi, dan ringkasan yang dibutuhkan subfase tersebut. Untuk recipe/BOM, tampilkan komposisi bahan dan versi resep. Untuk stock opname/waste, tampilkan perbandingan stok sistem/fisik, alasan, konfirmasi, dan movement. Untuk COGS, tampilkan dasar dan periode perhitungan dari API. Untuk modifier/variant, tampilkan pilihan valid dan harga hasil backend.

**Pemeriksaan wajib:** jangan mengarang formula, unit conversion, kebijakan stok negatif, costing method, atau pengaruh modifier terhadap inventory. Tampilkan informasi yang belum final secara eksplisit. Semua perubahan menggunakan API dan memiliki loading/error/success state, permission gating, serta test UI yang relevan.

**Instruksi implementasi:**
- Pecah pekerjaan menjadi langkah kecil yang dapat direview. Implementasikan hanya scope Phase 12; jangan mengerjakan fase berikutnya kecuali ada dependency minimum yang wajib.
- Pertahankan pola arsitektur, penamaan, response/API contract, design system, dan convention yang sudah dipakai repository. Hindari duplikasi logic dan abstraksi berlebihan.
- Tambahkan/perbarui automated test untuk behavior yang berubah. Untuk Frontend, tambahkan test komponen/alur penting dan verifikasi aksesibilitas dasar; untuk Backend, tambahkan unit/feature test sesuai lapisan.
- Jalankan test, formatter, linter, type-check, build, migration/health check yang relevan. Catat command dan hasil aktual; tandai yang terhalang environment sebagai belum terverifikasi.
- Perbarui dokumentasi API, development, atau ADR bila kontrak/keputusan berubah. Jangan menyimpan secret atau data nyata di repository/log.

**Format laporan akhir wajib:**
1. Ringkasan perubahan dan alasan.
2. File/module utama yang dibuat atau diubah.
3. Acceptance criteria Phase 12: status `Lulus`, `Gagal`, `Belum diuji`, atau `Terhalang`, disertai bukti singkat.
4. Daftar command test/check yang dijalankan dan hasil aktual.
5. Keputusan/gate yang masih menunggu persetujuan, risiko, dan pekerjaan lanjutan.
6. Konfirmasi bahwa `git diff` dan `git status` sudah diperiksa. Jangan commit/push tanpa instruksi.

Mulai dengan audit dan rencana singkat, lalu implementasikan task terkecil yang paling tepat untuk fase ini. Berkomunikasilah dalam Bahasa Indonesia.
```

## Catatan khusus urutan Backend dan Frontend

- **Backend menjadi sumber kebenaran** untuk harga, total, status order/payment, saldo kas, saldo stok, permission, billing, dan laporan. Frontend tidak boleh membuat keputusan bisnis final.
- Jika Backend belum menyediakan endpoint yang diperlukan, Frontend agent harus membuat daftar kebutuhan API/kontrak terlebih dahulu. Jangan membuat mock permanen atau endpoint palsu untuk menyelesaikan UI.
- Jika Frontend menemukan kebutuhan perubahan API, ajukan kontrak request/response yang jelas kepada Backend agent dan sinkronkan sebelum mengimplementasikan integrasi.
- Phase 8 (QR Ordering) adalah channel tambahan; jangan membuat order engine kedua. Phase 9 (Realtime) adalah lapisan notifikasi; API/database tetap source of truth.
- Phase 10 (Billing) memiliki gate Product Owner. Phase 12 harus dikerjakan per subfase, bukan sebagai satu proyek besar.

## Checklist sebelum menyatakan satu fase selesai

- [ ] Scope sesuai PRD dan `docs/planning/phase-targets.md`.
- [ ] Tidak ada konflik tenant/outlet authorization yang diketahui.
- [ ] Test/check relevan telah dijalankan dan hasilnya dicatat.
- [ ] Dokumentasi/kontrak API diperbarui bila diperlukan.
- [ ] Tidak ada secret atau data sensitif yang ikut ter-commit.
- [ ] Semua acceptance criteria diberi status yang jujur.
- [ ] Risiko dan keputusan yang belum final dilaporkan.
