# Dagana — Target & Acceptance Criteria Fase

> **Status dokumen:** kriteria penerimaan per fase, diturunkan dari `docs/PRD-Dagana.md` §58, keputusan di `docs/decision-log.md`, dan ADR terkait. Dokumen ini tidak menetapkan aturan produk baru; ia merangkum apa yang harus benar sebelum sebuah fase dinyatakan selesai. Bila scope fase berubah, perbarui dokumen ini (aturan pemeliharaan `docs/decision-log.md` §10.4).

Kriteria diberi status:

- `[x]` terpenuhi dan terverifikasi oleh test/kode pada repo saat ini.
- `[ ]` belum terpenuhi.
- `(N/A)` tidak berlaku untuk fase tersebut.

Setiap kriteria yang menyentuh authorization, transaksi, atau multi-tenancy wajib memiliki test otomatis; test adalah bukti, bukan sekadar daftar harapan.

---

## Phase 0 — Foundation

Fokus: kerangka proyek, lingkungan development, dan health check.

- [x] Monorepo dengan Laravel API (modular monolith) di `apps/api` (ADR-0001).
- [x] Lingkungan development berbasis Docker (API + PostgreSQL + Redis) dengan konfigurasi development-only (`compose.yaml`, `docker/php/Dockerfile.dev`).
- [x] Nilai uang sebagai integer rupiah (ADR-0003); waktu disimpan UTC (ADR-0004).
- [x] Health check: `GET /api/v1/health` (database + cache) dan `/up` runtime.
- [x] Test health endpoint lulus.

## Phase 1 — Identity, Business, Outlet

Fokus: identitas user, konteks business, dan outlet, beserta tenant scoping.

- [x] Autentikasi SPA berbasis session cookie via Sanctum stateful (ADR-0005): register, login, logout, `me`.
- [x] Dokumentasi alur CSRF/SPA di `docs/api-conventions.md`.
- [x] `User -> Membership -> Business -> Outlet`; satu user dapat menjadi anggota banyak business (D-01, D-02).
- [x] Pembuatan business menghasilkan membership Owner dan opsional outlet pertama.
- [x] Pengelolaan outlet setelah onboarding: list terpaginasikan, create, update, disable/enable; riwayat operasional tidak dihapus (`OutletController`, `OutletAccessTest`).
- [x] Tenant scoping: `business`/`outlet` di-resolve dari membership aktif, bukan input client (ADR-0002). Akses lintas tenant `404`.
- [x] Otorisasi outlet memeriksa permission **dan** akses outlet.
- [x] Test isolasi lintas tenant dan outlet access lulus.

## Phase 2 — Membership, Role, Permission

Fokus: pengelolaan employee, role preset, katalog permission, dan switch ke otorisasi berbasis permission.

- [x] Katalog permission final MVP mengikuti `docs/decision-log.md` D-03 (`App\Domain\Authorization\Enums\Permission`); `GET /api/v1/permissions` mengembalikannya.
- [x] Enam role preset (Owner, Manager, Cashier, Inventory, Kitchen, Staff) dipetakan ke permission di `config/authorization.php`; `GET /api/v1/roles` mengembalikan preset + permission bawaannya.
- [x] Custom role tidak disediakan pada MVP (D-04).
- [x] Pengelolaan membership: list terpaginasikan, undangan email/token untuk email belum terdaftar atau sudah terdaftar, terima undangan setelah login/register, update role/outlet access, disable, enable.
- [x] Owner memegang seluruh katalog + business-wide outlet access; grant outlet eksplisit untuk Owner diabaikan.
- [x] Outlet access eksplisit untuk non-Owner; outlet di luar cakupan `404`.
- [x] **Override permission per membership (D-04)**: tabel `membership_permissions` dengan effect `allow`/`deny`; permission efektif = `(preset ∪ allow) \ deny`; `deny` menang atas preset.
- [x] Override dikelola hanya oleh aktor ber-`permissions.manage_membership`.
- [x] **Anti-eskalasi**: aktor tidak dapat memberikan role atau permission yang tidak dimilikinya sendiri (`403`).
- [x] Override pada membership Owner diabaikan (Owner selalu memegang katalog penuh).
- [x] Setiap business menyisakan minimal satu Owner aktif; pelanggaran `409 Conflict`, dilindungi `lockForUpdate` pada baris business.
- [x] Employee bersifat opsional; tidak ada prasyarat employee untuk penjualan.
- [x] Resource membership mengekspos `permissions` (efektif), `preset_permissions`, `permission_grants`, `permission_denials`.
- [x] Test: permission granted/denied, override + anti-eskalasi, membership inactive, tenant isolation, akses outlet, invariant owner terakhir.

### Dependency setelah Phase 2

- [ ] Audit log untuk perubahan membership/role/permission penting — menunggu modul Audit (Phase 11). Dicatat sebagai dependency di ADR-0006.
- [ ] Konfigurasi provider email/queue yang sesuai environment diperlukan untuk pengiriman undangan di luar local/test.

## Phase 3 — Catalog

Fokus: pengelolaan kategori, menu, harga, status, dan ketersediaan dasar tanpa mewajibkan
setup inventory atau modifier.

- [x] User dengan permission yang sesuai dapat membuat, membaca, memperbarui,
  menonaktifkan, dan mengaktifkan kembali kategori/menu melalui API.
- [x] Nama wajib dan harga integer rupiah positif divalidasi di backend; input tidak
  valid ditolak tanpa mengubah data.
- [x] Katalog POS hanya menampilkan menu aktif dan tersedia serta kategori aktif untuk
  outlet aktif yang dapat diakses membership.
- [x] API checkout memvalidasi ulang menu aktif/tersedia dan harga server-side;
  menu nonaktif/tidak tersedia ditolak meski request dibuat langsung.
- [x] Data kategori/menu di-scope ke Business; akses lintas Business menghasilkan
  `404` dan foreign category tidak dapat dipasang ke menu.
- [x] Kontrak snapshot Phase 4 terdokumentasi di `docs/api-conventions.md` §5.1:
  checkout memvalidasi ulang menu di server dan order menyimpan snapshot nama/harga,
  sehingga perubahan catalog tidak mengubah histori; test snapshot ada di Phase 4.
- [x] Daftar kategori/menu menggunakan pagination dan batas `per_page` maksimal 100;
  default daftar Business adalah 20, default menu POS 20, dan default kategori POS 100.
  Kontrak terdokumentasi di `docs/api-conventions.md` §5.1.
- [x] Feature test mencakup CRUD, validasi, perubahan status/ketersediaan, permission,
  pagination, dan isolasi lintas Business (`CatalogTest`).

Phase 3 telah memenuhi acceptance criteria katalog. Snapshot transaksi diuji pada Phase 4.

## Phase 4 — POS + Payment

Fokus: checkout POS yang menghitung harga di backend, menyimpan order/payment secara
atomik, dan mempertahankan snapshot receipt.

- [x] Operator dengan `orders.create`, `payments.create`, dan akses outlet dapat membuat
  order dari menu aktif/tersedia pada outlet tersebut.
- [x] Backend memuat ulang dan memvalidasi menu/harga; quantity dibatasi; total dihitung
  server-side memakai integer rupiah dan input total client diabaikan.
- [x] Item order menyimpan nama menu, kuantitas, harga satuan, dan total snapshot; histori
  tetap memakai snapshot setelah menu katalog diubah.
- [x] Status order/payment tidak dapat diubah melalui payload umum. Cash dibayar saat
  checkout; metode non-tunai menunggu konfirmasi melalui endpoint khusus yang memerlukan
  `payments.create` dan mencatat actor/timestamp.
- [x] Order, item, dan payment dibuat dalam satu transaksi database; test kegagalan
  penulisan payment setelah order dan item dibuat memastikan seluruh record rollback.
- [x] `Idempotency-Key` wajib untuk checkout; key + scope business/outlet unik di database,
  request identik mengembalikan order yang sama, dan payload berbeda dengan key sama
  menghasilkan `409 Conflict`.
- [x] Constraint unik database mencegah order ganda pada retry/race untuk key yang sama.
- [x] Payment mencatat order, metode, amount, status, reference (opsional), waktu, actor,
  dan actor konfirmasi.
- [x] Feature test mencakup checkout, input/menu tidak valid, rollback, idempotency,
  permission, isolasi outlet, pagination histori, dan snapshot.
- [x] Riwayat/receipt menampilkan snapshot item dan total transaksi; endpoint list
  memakai pagination default 20 dan batas 100.

Catatan batas Phase 4: belum ada integrasi gateway/webhook, Cash Session, refund, maupun
transisi `FAILED`/`REFUNDED`/`PARTIALLY_REFUNDED`. Metode non-tunai memerlukan konfirmasi
manual operator yang berwenang; status tersebut tidak dapat dikirim langsung oleh client.

## Integrasi frontend Phase 0–4

Bagian ini mencatat cakupan UI Owner/Admin (`apps/admin-web`), bukan mengganti acceptance
criteria backend di atas. Health check Phase 0 adalah endpoint operasional dan tidak
memerlukan layar khusus merchant.

### Phase 0

- (N/A) Tidak ada workflow merchant Phase 0 yang memerlukan layar. Aplikasi web berjalan
  terpisah dari health endpoint API.

### Phase 1

- [x] Register, login, logout, dan pemuatan `/me` memakai session Sanctum; kegagalan
  pemuatan sesi ditampilkan dan dapat dicoba ulang.
- [x] User tanpa membership aktif diarahkan ke onboarding untuk membuat business dan
  opsional outlet pertama.
- [x] Owner/Admin dapat mengelola outlet melalui CRUD yang aman: membuat, membaca, mengubah,
  menonaktifkan, dan mengaktifkan kembali outlet; outlet nonaktif tidak tersedia untuk operasi
  baru, tetapi histori tetap dipertahankan.
- [x] Pengguna dengan beberapa membership aktif dapat memilih business; pemilihan outlet
  menampilkan akses yang diberikan membership (Owner memperoleh daftar outlet
  business-wide). Pemilihan UI tidak menggantikan scoping otoritatif backend.

### Phase 2

- [x] Halaman Anggota menampilkan membership business aktif dan memakai katalog role serta
  permission dari API.
- [x] Pengguna berwenang dapat mengundang email yang belum terdaftar maupun terdaftar,
  mengubah role/outlet, mengatur override sesuai permission yang dimiliki, serta
  mengaktifkan/nonaktifkan anggota.
- [x] Penerima dapat menyelesaikan undangan dengan token yang acak, kedaluwarsa, sekali pakai,
  dan terikat ke email; membership aktif baru dibuat setelah identitas terautentikasi cocok.
- [x] Daftar anggota, undangan, dan outlet menggunakan pagination API dengan batas `per_page`; UI
  menyediakan navigasi halaman dan state loading, empty, error, serta retry.
- [x] UI menangani status loading, empty, error, dan konflik Owner terakhir; otorisasi,
  validasi, serta anti-eskalasi tetap ditegakkan oleh API.

### Phase 3

- [x] Halaman Produk dan Kategori menyediakan pengelolaan menu, kategori, harga,
  ketersediaan, serta status aktif/nonaktif dengan kontrol yang mengikuti permission.
- [x] Daftar menu/kategori menggunakan pagination API; halaman katalog menangani
  loading, empty, error, dan retry untuk pemuatan menu.

### Phase 4

- [x] POS mengirim item dan metode pembayaran ke checkout API dengan idempotency key;
  cart hanya dikosongkan setelah server berhasil membuat order.
- [x] Halaman Riwayat Transaksi menampilkan receipt dari snapshot API dan menyediakan
  konfirmasi pembayaran tertunda bagi user dengan permission yang sesuai.

### Shell Owner/Admin

- [x] Logo resmi Dagana digunakan pada shell aplikasi.
- [x] Semua fitur utama yang tersedia memiliki tautan navigasi eksplisit; halaman "Lainnya"
  tidak menjadi tempat penampung fitur utama.
- [x] Semua breakpoint menggunakan drawer kiri yang tersembunyi secara default dan bisa
  ditoggle; drawer dapat ditutup dengan Escape/overlay/navigasi dan menjaga akses keyboard.

Integrasi ini tersedia pada Owner/Admin web. Customer Web dan Flutter POS belum terdapat
di workspace frontend saat ini.

---

## Cara memverifikasi

```bash
# Seluruh test
docker compose --env-file .env.docker exec api composer test

# Format
docker compose --env-file .env.docker exec api ./vendor/bin/pint
```

Fase dinyatakan **selesai** bila seluruh kriteria `[x]` untuk fase tersebut benar-benar dijalankan dan lulus, dependency terbuka tercatat (bukan disembunyikan), dan dokumentasi terkait (`api-conventions.md`, ADR, PRD) sudah sinkron.
