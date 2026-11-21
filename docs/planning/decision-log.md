# Dagana Decision Log

## Keputusan produk dan stack yang diperbarui (2026-10-31)

- **Satu User = satu Business** untuk MVP. Business dapat memiliki banyak Outlet; employee juga terikat ke Business yang sama. Enforce dengan unique constraint dan test, bukan hanya validasi UI.
- **Role MVP hanya `OWNER`, `MANAGER`, `CASHIER`.** Tidak ada custom role atau role `INVENTORY`/`KITCHEN`/`STAFF` sampai requirement produk direvisi.
- **Delete permission:** `delete` berarti menghapus record, bukan soft-delete. Katalog MVP memakai `outlets.delete`, `members.delete`, `categories.delete`, dan `products.delete`; tidak ada `business.delete`. Untuk master data yang masih punya referensi historis, gunakan perubahan status/deaktivasi melalui permission `update` dan method `PATCH`. Jangan sediakan delete permanen untuk order/payment/cash movement/audit log.
- **Mobile stack:** Flutter + Dart. Baseline library: Riverpod, go_router, Dio, flutter_secure_storage, Drift/SQLite, connectivity_plus, flutter_test/integration_test; gunakan plugin tambahan hanya bila dibutuhkan dan kompatibel dengan SDK yang dipatok.

## Konfirmasi teknis frontend (2026-11-01)

- **Router web:** `react-router` 8.5.1 disetujui sebagai router `apps/admin-web` dan `apps/customer-web`. Route awal `/` dengan fallback `*`; versi mengikuti `package-lock.json`.
- **Komponen web:** shadcn/ui dengan Tailwind CSS v4. Komponen ditambahkan memakai `npx shadcn@latest add` dan disimpan di `src/components/ui`. Registry default CLI v4 menghasilkan import `cn`/`radix-ui` yang belum dipakai proyek, sehingga komponen diambil dari registry `new-york` (`https://ui.shadcn.com/r/styles/new-york/<component>.json`) sampai baseline dependency diperbarui.

## Konfirmasi teknis backend Phase 3 (2026-11-04)

> **Status (2026-11-19):** disetujui dan diperluas oleh D-34/D-35 di bagian akhir dokumen. Butir di bawah tetap berlaku kecuali availability: `is_available` global menjadi master switch, dan ketersediaan per outlet ditambahkan lewat D-35.

- **Skema catalog:** tabel `categories` (`business_id`, `name`, `is_active`) dan `products` (`business_id`, `category_id` nullable, `name`, `price` integer rupiah, `is_active`, `is_available`) dibuat pada migration `2026_11_04_000000`/`000001`. Catalog adalah master data level Business dengan harga yang sama di semua Outlet sesuai D-25; tidak ada override per-outlet.
- **Nama resource:** endpoint memakai path `/api/v1/products` (bukan baseline `/menus` di `docs/architecture/api-design.md`) agar konsisten dengan permission D-03 `categories.*`/`products.*`. Baseline grouping `api-design.md` telah dikoreksi.
- **Availability:** `is_available` adalah boolean global pada menu dan berperan sebagai master switch Business. Ketersediaan per outlet ditambahkan lewat D-35 (`product_outlet_availabilities`) dan hanya dapat mempersempit master switch; tidak ada override harga per outlet.
- **Delete vs deaktivasi:** `DELETE /api/v1/categories/{id}` hanya boleh saat kategori kosong; kategori berisi menu memakai deaktivasi `PATCH` `is_active` (permission `categories.update`). `DELETE /api/v1/products/{id}` masih bebas karena belum ada tabel transaksi; guard "tolak hapus bila sudah ada transaksi" wajib ditambahkan pada Phase 4 bersama order items (catatan `Domain/Catalog/Actions/DeleteProductAction.php`).
- **Kontrak snapshot Phase 4:** terdokumentasi di `docs/architecture/api-design.md` bagian "Phase 3 contract — catalog": order item menyimpan snapshot `product_id`/`name`/`price`, checkout wajib mengambil ulang menu via `Product::sellable()`, dan perubahan catalog tidak boleh mengubah snapshot histori.
- **Verifikasi penuh AC "menu nonaktif tidak bisa masuk transaksi":** menunggu jalur checkout Phase 4; saat ini sudah ada guard domain `Product::sellable()` beserta test scope-nya.

## Konfirmasi teknis backend Phase 2 (2026-11-02) — status: disetujui

**Status:** disetujui Product Owner (2026-11-16). Keputusan berikut menjadi baseline Phase 2; perubahan di masa depan harus melalui revisi keputusan dan test terkait.

**Keputusan yang dikunci (disetujui Product Owner, 2026-11-17):**

1. **Izin tambahan per member (`extra_permissions`) difinalisasi** sesuai revisi D-04 2026-11-17: Owner-only, seluruh katalog D-03 boleh diberikan, preset tidak dapat dicabut/dikirim ulang (422), Manager dengan field izin ditolak 403, dan izin efektif = preset ∪ extra. Kontrak: `POST /members` dan `PATCH /members/{id}` menerima field `extra_permissions` (array of `resource.action`).

**Keputusan yang dikunci (disetujui Product Owner, 2026-11-16):**

1. **Penambahan employee memakai direct-create** dengan password awal dari operator; email invitation (token, kedaluwarsa, pengiriman) bukan bagian MVP dan tidak boleh diklaim tersedia. Jika kelak dibutuhkan, menjadi keputusan baru.
2. **Manager boleh mengangkat employee menjadi MANAGER** (role setara level Manager sendiri); Manager tetap tidak dapat mengubah Owner, mengubah membership-nya sendiri, atau memberi outlet di luar aksesnya.
3. **`GET /api/v1/members` mengembalikan seluruh membership Business tanpa pagination**; diterima sebagai pengecualian kecil dari kontrak pagination karena jumlah membership per Business terbatas pada MVP.
4. **Audit log belum mencatat perubahan role/outlet access** karena modul audit belum dibangun; tetap menjadi dependency D-28 dan dicatat sebagai pengecualian status Phase 2 ("Selesai dengan pengecualian yang disetujui").
5. D-03, D-04, dan D-05 resmi disetujui sebagai baseline authorization MVP (2026-11-16).

- **Katalog permission dan role preset:** implementasi mengikuti baseline D-03 sampai D-05. Status D-03–D-05 tetap **rekomendasi v1 yang menunggu persetujuan Product Owner**, sehingga katalog permission, batas Manager, dan model outlet access dapat direvisi bila keputusan final berbeda. Tidak ada custom role atau permission override. *(Diperbarui 2026-11-16: D-03–D-05 disetujui; lihat status di masing-masing keputusan.)*
- **Outlet access:** Owner memperoleh seluruh outlet secara implisit; Manager dan Cashier memakai baris eksplisit pada `outlet_accesses`. Manager tidak dapat memberikan outlet di luar aksesnya sendiri.
- **Penambahan employee:** `POST /api/v1/members` membuat akun employee langsung dengan password awal dari operator. Alur undangan via email (token, kedaluwarsa, pengiriman) belum diputuskan dan belum diimplementasikan.
- **Penonaktifan dan hard delete member:** `PATCH /api/v1/members/{membership}` dengan field `status` (`ACTIVE`/`INACTIVE`) memakai permission `members.update`; deaktivasi mencabut token tetapi mempertahankan record membership dan outlet access. `DELETE /api/v1/members/{membership}` memakai `members.delete` untuk hard delete membership employee; hanya Owner yang boleh, tidak dapat menghapus Owner atau dirinya sendiri, dan token user dicabut. User dipertahankan untuk atribusi historis.
- **Audit:** perubahan role/akses belum dicatat ke audit log karena modul audit belum tersedia; ini dependency D-28.
- **Business delete:** `business.delete` tidak ada di katalog MVP dan endpoint penghapusan Business belum dibangun. Perubahan pengaturan memakai `business.update`.

## Konfirmasi teknis backend Phase 1 (2026-11-01)

- **Autentikasi API:** klien mobile memakai Laravel Sanctum personal access token (`Authorization: Bearer`) dan wajib menyimpannya di secure storage. Admin web memakai Sanctum SPA session: login/register melalui `/api/v1/auth/web/*`, sesi disimpan pada cookie `dagana-session` yang `HttpOnly`, dan request mutasi mengirim `X-XSRF-TOKEN` dari cookie `XSRF-TOKEN` setelah `GET /sanctum/csrf-cookie`. Token tidak disimpan di `localStorage`. Logout web menghapus session; logout mobile menghapus token aktif.
- **Pengaturan dasar Phase 1:** business hanya memakai `name` (wajib). Outlet memakai `name` (wajib), `phone`, dan alamat komposit `address` (`street`, `village`, `district`, `regency`, `province`, `postal_code`) yang opsional. Field pengaturan lain menunggu requirement yang lebih spesifik.
  - **Revisi (2026-11-16, disetujui Product Owner):** `phone` dan seluruh komponen `address` outlet menjadi **wajib** pada onboarding dan `POST /outlets`; `phone` dinormalisasi (seluruh karakter non-digit dibuang, mis. `0812-3456-789` → `08123456789`) lalu divalidasi **10–13 digit**. Pada `PATCH /outlets/{id}`, `address` boleh tidak dikirim tetapi bila dikirim harus lengkap; `phone` tidak dapat dikosongkan dan wajib memenuhi format yang sama. Ditegakkan di validasi backend (`Address::rules` mode required/partial + normalisasi `Phone::digits()` + regex), kolom database `outlets` (migration `2026_11_16_000000`, backfill string kosong untuk data lama), dan form admin-web (onboarding + outlet).
- **Onboarding:** `phone` dan alamat diinput pada outlet; `business` hanya memuat `name`. Business tidak menerima input `phone`/`address` terpisah.
- **Data wilayah:** backend memakai API wilayah Indonesia dengan cache (fresh 1 hari, stale hingga 7 hari) dan circuit breaker (3 kegagalan berturut-turut membuka breaker selama 1 menit). Data lama tetap dilayani saat sumber eksternal bermasalah; frontend tidak memanggil penyedia wilayah secara langsung.
- **Relasi awal onboarding:** `business_memberships` dibuat dengan unique `user_id` dan role `OWNER`; ini fondasi minimum untuk tenant scoping. Permission catalog, role preset lain, dan outlet access tetap menjadi scope Phase 2.

— Rekomendasi v1

> **Status dokumen:** usulan baseline untuk ditinjau Product Owner. Keputusan teknis dapat dijadikan default implementasi setelah disetujui. Keputusan komersial, kontraktual, kebijakan, dan perangkat nyata tetap memiliki gate yang dijelaskan di bawah.
>
> **Prinsip:** pilih opsi sederhana untuk MVP, hindari mengunci vendor di domain bisnis, dan jangan mengubah aturan produk secara diam-diam.

## 1. Identity, Business, Membership, dan Authorization

### D-01 — Satu User hanya terhubung ke satu Business

**Keputusan:** Satu User hanya boleh terhubung ke satu Business melalui satu membership. Business dapat memiliki banyak Outlet. Tegakkan dengan unique constraint pada membership/user dan validasi backend.

**Alasan:** menyederhanakan onboarding, active-business context, permission, dan isolasi tenant pada MVP.

**Verifikasi:** test memastikan satu User tidak dapat membuat atau menerima membership ke Business kedua; akses lintas-Business harus ditolak.

### D-02 — Satu Owner memiliki satu Business

**Keputusan:** Satu Owner memiliki satu Business. Business tersebut dapat mempunyai banyak Outlet.

**Verifikasi:** onboarding membuat satu Business untuk Owner; endpoint tidak mengizinkan Owner membuat Business kedua menggunakan User yang sama.

### D-03 — Permission catalog MVP

**Status:** disetujui Product Owner (2026-11-16). Katalog berikut adalah baseline final MVP, termasuk `products.update_availability` dari D-35 (revisi 2026-11-19), `products.update_stock` dari D-37 (revisi 2026-11-20), dan penyesuaian D-36 (penghapusan permission `inventory.*`, 2026-11-20). Perubahan kategori/kata kunci permission di masa depan wajib lewat revisi keputusan, bukan langsung di kode. Catatan: `members.invite` tetap menjadi permission untuk endpoint pembuatan employee (alur direct-create, lihat konfirmasi teknis Phase 2).

**Keputusan:** gunakan permission eksplisit berbentuk `resource.action`. Katalog awal:

- `business.read`, `business.update`
- `outlets.read`, `outlets.create`, `outlets.update`, `outlets.delete`
- `members.read`, `members.invite`, `members.update`, `members.delete`
- `categories.read`, `categories.create`, `categories.update`, `categories.delete`
- `products.read`, `products.create`, `products.update`, `products.update_availability`, `products.update_stock`, `products.delete`
- `orders.read`, `orders.create`, `orders.update`, `orders.cancel`
- `payments.read`, `payments.create`, `payments.refund`
- `cash.read`, `cash.open`, `cash.cash_in`, `cash.cash_out`, `cash.close`, `cash.reconcile`
- `reports.read`, `reports.export`
- `qr.read`, `qr.manage`
- `kitchen.read`, `kitchen.update_status`
- `billing.read`, `billing.manage_settings`
- `audit.read`
- `settings.read`, `settings.update`

Permission dapat ditambah ketika requirement yang sah muncul. Jangan menggunakan `*` sebagai grant untuk melewati authorization. Endpoint sensitif tetap memeriksa permission backend dan business/outlet scope.

**Catatan:** tindakan platform-level seperti mengubah rate billing semua merchant harus dipisahkan dari `billing.manage_settings` milik merchant. Jangan memberi merchant akses untuk mengubah tarif platform global.

**Verifikasi:** test positif dan negatif untuk setiap kelompok endpoint; user tanpa permission ditolak; owner dapat mengoperasikan POS sesuai default access.

### D-04 — Custom role tidak masuk MVP

**Status:** disetujui Product Owner (2026-11-16); **direvisi (2026-11-17, disetujui Product Owner)** dengan tambahan izin per-member di bawah.

**Keputusan:** MVP hanya menyediakan preset `OWNER`, `MANAGER`, dan `CASHIER`. Tidak ada custom role; preset dikelola terpusat. Perubahan role hanya dilakukan Owner dan tidak boleh menaikkan akses melebihi batas sistem.

**Revisi 2026-11-17 — izin tambahan per member (extra permissions):**

- Owner dapat **memberikan dan mencabut izin tambahan** di luar preset role untuk tiap member melalui `POST /members` dan `PATCH /members/{id}` dengan field `extra_permissions`.
- Hanya izin dari katalog D-03 yang valid; izin di luar katalog ditolak 422.
- **Preset role tidak dapat dicabut** dan tidak boleh dikirim sebagai extra (422). Izin efektif = preset role ∪ extra permissions.
- Hanya Owner yang dapat mengatur field ini; Manager/PATCH lain dengan field `extra_permissions` ditolak 403.
- Saat role member berubah, override yang kini menjadi preset role baru dibersihkan otomatis.
- Tabel `membership_permission_overrides` (unique per membership+permission) menyimpan extra; deaktivasi member tidak menghapus extra dan member non-aktif tetap tanpa izin efektif.
- UI wajib menampilkan izin dengan label ramah pengguna; string mentah `resource.action` tidak boleh muncul di UI.

**Verifikasi:** test MemberPermissionTest (grant/revoke, katalog-only, preset ditolak, role berubah di request sama, Manager ditolak 403, deaktivasi/reaktivasi, `/me` mencerminkan izin efektif) dan test web members-flow (toggle tanpa string mentah).

**Verifikasi:** merchant tidak dapat membuat role, mengubah preset, atau memberikan permission override; Manager tidak dapat menaikkan haknya sendiri atau mengubah Owner.

### D-05 — Permission per Outlet

**Status:** disetujui Product Owner (2026-11-16).

**Keputusan:** tidak membuat permission matrix yang berbeda untuk setiap outlet pada MVP. Membership menyimpan set outlet yang boleh diakses; permission efektif membership berlaku pada outlet-outlet tersebut. Otorisasi untuk resource outlet harus memvalidasi kedua hal: permission tindakan dan akses ke outlet terkait.

**Alasan:** ini memenuhi outlet scoping tanpa membangun kombinasi role-permission-outlet yang kompleks. Per-outlet permission matrix dapat ditambahkan setelah kebutuhan nyata terbukti.

**Verifikasi:** cashier yang hanya diberi Outlet A tidak dapat membaca atau mengubah order, cash session, table, maupun report Outlet B meskipun ia mempunyai permission resource yang sesuai.

## 2. Cash Session

### D-06 — Satu operator bertanggung jawab untuk satu Cash Session

**Keputusan:** satu session mempunyai tepat satu operator penanggung jawab. Owner boleh menjadi operator. User pencatat/penutup lain dapat dicatat sebagai actor audit, tetapi tidak menggantikan operator penanggung jawab.

**Verifikasi:** session memiliki `operator_membership_id` (atau relasi setara); setiap open/close mencatat actor dan timestamp; session tidak memiliki dua operator utama aktif.

### D-07 — Banyak Cash Session aktif pada Outlet

**Keputusan:** boleh ada beberapa session aktif dalam satu outlet untuk operator atau cash drawer yang berbeda. MVP membatasi satu session aktif per operator per outlet. Penguncian harus dilakukan di backend/database agar dua request bersamaan tidak membuka dua session bagi operator yang sama.

**Verifikasi:** dua operator berbeda bisa membuka session masing-masing; operator yang sama tidak bisa membuka session kedua pada outlet sama; request bersamaan tidak melanggar batas.

### D-08 — Pergantian operator

**Keputusan:** jangan mengalihkan session terbuka ke operator lain. Operator lama menutup session, menginput actual cash dan catatan handover bila ada, lalu operator baru membuka session baru dengan opening cash sesuai uang yang benar-benar diterima. Penggantian paksa hanya lewat alur supervisor/admin yang diaudit bila nanti diperlukan.

**Verifikasi:** operator kedua tidak dapat melanjutkan session operator pertama dengan sekadar mengubah ID; closing/hand-over tersimpan dalam audit; formula expected cash konsisten.

## 3. Inventory dan COGS (arsip historis)

> **Status (2026-11-20):** seluruh keputusan di bagian ini (D-09–D-11) sudah tidak berlaku setelah D-36 menghapus modul inventory. Teks di bawah dipertahankan hanya sebagai catatan historis, bukan acuan implementasi.

### D-09 — Unit conversion

**Keputusan:** setiap inventory item mempunyai base unit tetap. Dukungan awal: massa `g`/`kg`, volume `ml`/`l`, dan hitungan `pcs`. Konversi otomatis hanya di dalam dimensi yang sama; jangan mengonversi massa ke volume tanpa data densitas khusus. Pack/box conversion yang item-specific dibuat sebagai aturan eksplisit, bukan asumsi global.

**Verifikasi:** `1 kg = 1000 g`, `1 l = 1000 ml`; konversi lintas dimensi ditolak; quantity mendukung pecahan untuk massa/volume; presisi dan rounding didokumentasikan.

### D-10 — Inventory costing method

**Keputusan:** gunakan **Moving Weighted Average Cost** untuk valuasi stok dan COGS ketika costing diimplementasikan. Basic inventory MVP tetap dapat berfokus pada kuantitas/movement; jangan mengklaim laporan COGS lengkap sebelum cost data tersedia.

Saat penerimaan stok berbiaya terjadi, biaya rata-rata baru dihitung dari `(qty_lama × avg_cost_lama + qty_masuk × unit_cost_masuk) / (qty_lama + qty_masuk)`. Penyesuaian stok perlu menyimpan alasan dan mengikuti aturan valuation yang terdokumentasi. Larang stok negatif dalam transaksi online yang tervalidasi kecuali aturan produk eksplisit kelak mengizinkan.

**Verifikasi:** test penerimaan stok dengan harga berbeda menghasilkan weighted average yang benar; histori transaksi lama tidak berubah ketika harga beli berikutnya berubah.

### D-11 — Formula COGS

**Keputusan:** pada saat penjualan diselesaikan, COGS item dihitung dari jumlah tiap bahan yang dikonsumsi menurut recipe/BOM dikalikan unit cost moving weighted average yang berlaku pada saat itu. Tambahkan bahan kemasan bila recipe memasukkannya. Dampak modifier hanya dihitung ketika modifier memiliki konsumsi bahan eksplisit. Simpan snapshot unit cost dan COGS pada record transaksi/stock consumption agar laporan historis tidak berubah.

Jika produk tidak mempunyai recipe atau cost data valid, COGS ditampilkan sebagai belum tersedia, bukan nol palsu. Waste dicatat sebagai biaya/stock movement terpisah dan tidak diam-diam ditambahkan ke COGS penjualan.

**Verifikasi:** hasil COGS dapat dihitung ulang dari recipe dan cost snapshot; perubahan biaya sekarang tidak mengubah order lama; recipe yang belum lengkap tidak menghasilkan COGS yang menyesatkan.

## 4. Billing

### D-12 — Formula billing

**Keputusan baseline:** `platform_fee = configured_rate × eligible_net_sales`. Billing period menggunakan bulan kalender. `eligible_net_sales` adalah nilai penjualan item yang selesai dan pembayarannya berhasil, sesudah diskon pada item/transaksi dan dikurangi refund yang tercatat; transaksi cancel/void, payment pending/failed, dan nilai pajak/uang titipan pihak ketiga (jika kelak ada) tidak dihitung sebagai penjualan bersih.

Refund yang terjadi sesudah statement lama diterbitkan dicatat sebagai adjustment pada periode refund dan ditautkan ke transaksi asal. Statement yang sudah diterbitkan bersifat immutable; koreksi dilakukan dengan adjustment, bukan menulis ulang riwayat secara diam-diam. Simpan line item sumber dan versi aturan/tarif yang dipakai.

**Verifikasi:** contoh order paid, cancel, discount, partial refund, full refund, dan refund setelah periode ditutup menghasilkan angka sesuai definisi; pemrosesan ulang billing tidak menggandakan charge.

### D-13 — Platform fee rate

**Keputusan teknis:** rate harus berupa konfigurasi versioned pada plan/business dan tidak di-hardcode dalam service. Lingkungan dev/test menggunakan rate dummy; pilot tertutup menggunakan 0% sampai model komersial disetujui. Billing berbayar dinonaktifkan jika tidak ada rate aktif yang telah disetujui.

**Gate Product Owner:** tentukan rate/tier, perlakuan pajak, disclosure ke merchant, dan tanggal efektif sebelum billing komersial dirilis. Informasi pada dokumen requirement saat ini belum cukup untuk menetapkan angka rate yang bertanggung jawab.

**Verifikasi:** perubahan tarif tidak memengaruhi statement lama; billing berbayar tidak dapat diaktifkan tanpa konfigurasi; perubahan tarif tercatat di audit.

### D-14 — Billing due date

**Keputusan baseline:** periode billing adalah bulan kalender; statement dibuat pada tanggal 1 bulan berikutnya; jatuh tempo 7 hari kalender setelah tanggal terbit. Notifikasi pengingat dapat dikirim sebelum/saat jatuh tempo. Tidak ada pemblokiran POS otomatis karena telat bayar pada MVP; kebijakan penangguhan akun merupakan keputusan terpisah setelah validasi komersial dan pemberitahuan yang layak.

**Verifikasi:** batas periode menggunakan timezone bisnis yang terdokumentasi; due date konsisten; test pada pergantian bulan/tahun benar.

## 5. Payment, QR, dan Realtime

### D-15 — Payment gateway

**Keputusan baseline:** implementasikan adapter provider agar domain Payment tidak bergantung pada SDK/vendor tunggal. Xendit menjadi kandidat integrasi pertama untuk sandbox/pilot, tetapi aktivasi live mensyaratkan verifikasi dukungan produk, biaya, settlement flow, onboarding merchant, refund, webhook, serta kontrak/eligibility akun Dagana dan merchant.

Jangan menyimpan status PAID hanya berdasarkan redirect frontend atau screenshot. Verifikasi callback/webhook di backend dan gunakan rekonsiliasi status provider jika diperlukan. Simpan provider reference, event ID/idempotency metadata, amount, currency, dan timestamps yang relevan.

**Verifikasi:** sandbox mencakup pending, paid, failed/expired, refund bila didukung; webhook invalid ditolak; webhook duplikat tidak menggandakan pembayaran; amount dan order reference dicocokkan.

### D-16 — QR payment gateway

**Keputusan baseline:** untuk pembayaran QRIS yang perlu dikonfirmasi otomatis, gunakan QRIS dinamis melalui provider yang sama dengan integrasi payment pertama. Pisahkan konsep `payment_method` dari `payment_provider`. Tunai, transfer manual, atau kartu yang dicatat kasir tidak boleh berpura-pura terverifikasi gateway jika tidak ada bukti server-side.

**Gate produksi:** model settlement dana ke merchant dan mekanisme onboarding merchant harus diverifikasi dengan provider sebelum transaksi uang nyata. Sampai itu selesai, integrasi hanya berjalan di sandbox/test.

**Verifikasi:** QR punya reference/expiry yang dapat dilacak; paid hanya setelah bukti server-side valid; QR expired tidak boleh menyelesaikan order; callback duplikat aman.

Dokumentasi referensi provider: [Xendit QRIS](https://docs.xendit.co/docs/qris) dan [Xendit webhook configuration](https://docs.xendit.co/apidocs/set-webhook-url). Ketersediaan fitur harus diverifikasi lagi saat mulai integrasi karena paket/API provider dapat berubah.

### D-17 — WebSocket provider

**Keputusan:** gunakan Laravel Reverb untuk baseline realtime self-hosted. Broadcast hanya mengirim event/notifikasi; database tetap source of truth, dan klien harus bisa mengambil ulang state terbaru melalui API. Gunakan queue/outbox sesuai kebutuhan agar kegagalan pengiriman event tidak membatalkan transaksi yang sudah commit.

**Verifikasi:** perubahan state tetap tersimpan walaupun WebSocket mati; reconnect memuat state terkini; channel private memeriksa membership/permission/business/outlet; event duplicate tidak merusak state.

Referensi: [Laravel Reverb documentation](https://laravel.com/docs/13.x/reverb).

## 6. Storage, Hardware, dan Flutter Offline

### D-18 — Object storage

**Keputusan:** gunakan abstraksi storage berbasis S3 API. MinIO digunakan untuk local development/integration test; object storage produksi dikonfigurasi lewat environment dan belum dikunci ke vendor tertentu. Simpan file privat secara default dan gunakan URL bertanda tangan atau kontrol akses backend untuk resource privat.

**Verifikasi:** upload, read, delete, batas ukuran/jenis file, unauthorized access, dan konfigurasi endpoint lokal diuji; file dan credential tidak dimasukkan ke Git.

### D-19 — Thermal printer

**Keputusan:** printing bukan syarat untuk menyelesaikan sebuah transaksi. Pisahkan melalui `PrinterService`/adapter agar business flow tidak tergantung pada model printer. Saat pilot, validasi minimal satu printer ESC/POS nyata pada perangkat Flutter/Android target; Bluetooth menjadi kandidat awal sesuai perangkat pilot. Jangan mengklaim semua printer didukung. LAN/USB ditambahkan setelah kebutuhan dan perangkat divalidasi.

**Verifikasi:** transaksi tetap tersimpan ketika printer offline; kegagalan print dapat dicoba ulang tanpa menciptakan order/payment baru; format receipt menampilkan nomor order, waktu, item, total, dan metode/status pembayaran yang benar.

### D-20 — Barcode hardware

**Keputusan:** hardware scanner tidak masuk MVP. Field SKU/barcode dapat disiapkan jika tidak menambah beban domain yang tidak perlu. Integrasi scanner baru dilakukan setelah validasi; opsi berbiaya rendah adalah scanner USB/Bluetooth HID yang berperilaku seperti input keyboard, tetapi perangkat harus diuji.

**Verifikasi:** tidak ada dependency scanner dalam workflow penjualan dasar; fitur pencarian/pilih menu manual tetap berfungsi.

### D-21 — Local database Flutter

**Keputusan:** gunakan Drift di atas SQLite untuk cache katalog, draft/cart bila diperlukan, antrean transaksi offline, status sinkronisasi, dan data lokal. Drift menyediakan migrasi dan query terstruktur; gunakan API SQL/Drift seperlunya. Gunakan secure storage/OS-protected storage untuk token/secret; jangan menyimpan token sensitif sebagai plain preference. Database lokal bukan source of truth cloud.

**Verifikasi:** migrasi schema diuji dari versi sebelumnya; force-close tidak menghapus antrean yang belum tersinkron; data sensitif tidak disimpan secara plaintext di preference umum.

Referensi implementasi mengikuti dokumentasi resmi Flutter, Drift, dan flutter_secure_storage sesuai versi dependency yang dipatok.

### D-22 — Offline conflict strategy

**Keputusan MVP:** dukung offline POS terbatas, bukan klaim seluruh platform berfungsi offline. Katalog di-cache setelah sinkronisasi online; transaksi offline hanya bisa dibuat dari katalog lokal yang tersedia dan menggunakan metode cash/manual yang tidak memerlukan provider eksternal. QR Ordering, verifikasi payment gateway, billing, laporan terpusat terbaru, dan perubahan konfigurasi memerlukan koneksi.

Setiap order lokal memiliki UUID/client-generated idempotency key yang unik, waktu perangkat, snapshot item/harga, operator, outlet, dan status `pending_sync`. Saat tersambung, server memvalidasi membership/outlet, menerima atau menandai konflik secara eksplisit, lalu menyimpan referensi idempotency. Jangan mengubah snapshot harga transaksi secara diam-diam. Kebijakan tidak boleh membuat order duplikat atau menghapus transaksi lokal. Data server yang sudah committed tetap source of truth untuk laporan cloud.

**Batasan penting:** sebelum mengaktifkan offline selling untuk merchant nyata, uji keamanan perangkat, masa berlaku akses offline, multi-device, duplikasi sync, perubahan/arsip produk ketika offline, dan pemulihan setelah aplikasi force-close. Konflik kompleks tetap di luar MVP.

**Verifikasi:** transaksi offline bertahan setelah app ditutup; sync ulang menghasilkan tepat satu order; kegagalan jaringan tidak menghapus outbox; harga snapshot tidak berubah diam-diam.

## 7. Batas MVP dan Roadmap

### D-23 — Split payment

**Keputusan:** tidak masuk MVP. Satu order memakai satu metode pembayaran utama. Refund/partial refund adalah alur tersendiri dan bukan split tender. Simpan model yang tidak membuat pengembangan pembayaran berikutnya mustahil, tetapi jangan membangun UI atau rekonsiliasi split sekarang.

**Verifikasi:** checkout menolak kombinasi beberapa metode pembayaran dalam satu order pada MVP; order dapat dibayar dengan satu metode.

### D-24 — Dampak modifier pada inventory — status: disupersede oleh D-36

> **Status (2026-11-20):** tidak berlaku; modul inventory dihapus oleh D-36. Catatan historis ini bukan acuan implementasi.

**Keputusan (historis):** implementasikan bersama Recipe/BOM, bukan sebelum basic inventory stabil. Modifier yang menambah/mengurangi bahan harus mempunyai aturan konsumsi eksplisit yang tervalidasi. Jika tidak ada recipe/mapping, modifier tidak mengubah stok secara implisit.

**Verifikasi:** modifier dengan mapping mengonsumsi bahan yang benar; modifier tanpa mapping tidak mengubah stok; setiap konsumsi tercatat sebagai stock movement dan tidak digandakan saat retry.

### D-25 — Harga per Outlet

**Keputusan:** tidak masuk MVP. Satu Business menggunakan harga catalog yang sama di semua outlet. Jangan menambahkan outlet-specific override sebelum requirement multi-outlet dan reporting-nya jelas. Jika diluncurkan kelak, desainnya harus menjelaskan fallback harga Business vs override Outlet dan snapshot harga di order.

**Verifikasi:** menu di outlet berbeda dalam Business yang sama menunjukkan harga yang konsisten pada MVP; snapshot order lama tidak berubah bila harga catalog diubah.

### D-26 — Customer login

**Keputusan:** guest-first. Pelanggan dapat membuka menu QR dan membuat order tanpa mendaftar akun. Identitas kontak hanya dikumpulkan jika ada kebutuhan operasional nyata, bersifat opsional kecuali diperlukan oleh alur yang disepakati, serta diberi penjelasan penggunaan. Riwayat transaksi merchant tidak bergantung pada akun pelanggan.

**Verifikasi:** guest dapat menyelesaikan QR flow yang disepakati; akses status order dibatasi dengan token/session order yang tidak mudah ditebak; pelanggan tidak dapat membaca order pelanggan lain.

### D-27 — Target KDS

**Keputusan:** status kitchen dasar (mis. `QUEUED`, `PREPARING`, `READY`, `COMPLETED`, serta pembatalan bila perlu) dan tampilan queue sederhana disiapkan untuk alur Order/QR dan realtime sesuai fase implementasi. Advanced KDS—routing beberapa station, bump bar kompleks, analytics dapur, central kitchen—ditunda ke roadmap pasca-MVP.

**Verifikasi:** transisi status dibatasi ke alur yang valid; hanya role/outlet yang berwenang dapat mengubah status; perubahan tersimpan di backend dan dapat dimuat ulang setelah reconnect.

## 8. Audit, Backup, dan Disaster Recovery

### D-28 — Audit retention

**Keputusan baseline:** log audit kritis searchable minimal 24 bulan, kemudian boleh diarsipkan agar tetap dapat dipulihkan sesuai kebutuhan. Record audit bersifat append-only bagi aplikasi operasional. Penghapusan final hanya berjalan berdasarkan kebijakan retensi yang telah ditinjau; masa 24 bulan ini adalah target produk awal, bukan klaim masa simpan minimum yang diwajibkan hukum.

**Verifikasi:** perubahan permission, refund, cancel order, cash close/adjustment, dan billing memiliki actor, waktu, entity reference, serta nilai relevan; user operasional tidak dapat menghapus audit log.

### D-29 — Backup/disaster recovery

**Keputusan baseline produksi:** target RPO ≤ 1 jam dan RTO ≤ 4 jam. Gunakan backup database terenkripsi dan disimpan terpisah dari lingkungan utama; gunakan point-in-time recovery/WAL bila didukung hosting. Target retensi backup awal 30 hari. Uji pemulihan minimal bulanan dan sebelum perubahan infrastruktur besar. Docker volume development bukan backup.

**Verifikasi:** tersedia prosedur restore; pengujian restore membuktikan aplikasi dapat terhubung ke data hasil pemulihan; akses backup dibatasi; secret backup tidak masuk Git; kegagalan job backup memunculkan alert.

**Gate produksi:** apabila provider/infrastruktur yang dipilih tidak dapat memenuhi target, Product Owner harus menerima RPO/RTO alternatif secara tertulis sebelum go-live—jangan diam-diam mengurangi target.

### D-30 — Status dan gate Phase 4 (POS + Payment) tanpa gateway

**Keputusan (2026-11-08):** Phase 4 berjalan **tanpa payment gateway**. Metode dikelompokkan dua alur: cash langsung `PAID` oleh operator checkout; non-cash berstatus `PENDING` dan hanya dapat dikonfirmasi manual ke `PAID` oleh pengguna berpermission `payments.create` dengan akses outlet sah setelah verifikasi backend, dengan pencatatan aktor (`payments.confirmed_by`) dan waktu (`paid_at`). Belum ada klaim integrasi otomatis; QR payment otomatis baru setelah provider, verifikasi callback/webhook, dan pengujian settlement tersedia (D-15/D-16). Ini bukan jalan pintas: pengguna tanpa izin/outlet tidak dapat mengubah status payment.

**Kontrak idempotency:** `orders.idempotency_key` wajib UUID, beda per operasi checkout, dan mempertahankan unique constraint global (tidak ada migration ulang hanya untuk mengubah constraint). Lookup/replay selalu ter-scope `business_id` dan diaotorisasi membership/outlet. Composite unique `(business_id, idempotency_key)` dievaluasi hanya bila kebutuhan sistem meminta.

**Refund:** belum didukung. Status `REFUNDED`/`PARTIALLY_REFUNDED` adalah nilai enum tersimpan, bukan transition yang dapat digunakan; endpoint refund membutuhkan aturan bisnis, otorisasi, audit trail, dan pencatatan finansial yang disepakati (kaitan: aktivitas refund di Phase 5 dan `eligible_net_sales` billing D-12).

**Gate Phase 4:**

| Gate | Kondisi yang diperlukan |
|---|---|
| Payment gateway | Out of scope saat ini; integrasi provider belum termasuk scope. |
| Manual payment confirmation | Otorisasi (`payments.create` + outlet), audit trail aktor/waktu, dan bukti verifikasi backend. |
| Idempotency | Retry checkout dengan key yang sama tidak membuat transaksi ganda (teruji). |
| Pint pada 4 file committed | Technical debt terpisah; dicatat di `docs/planning/technical-debt.md`, bukan pekerjaan Phase 4. |
| Split payment | Tidak termasuk MVP (D-23). |
| Refund | Belum didukung; jangan dianggap tersedia. |
| Konsistensi cash | Cash sales harus dapat direkonsiliasi dengan Cash Session saat Phase 5 tersedia; tanpa gateway bukan alasan mengurangi integritas transaksi. |

**Verifikasi:** test checkout cash/non-cash, konfirmasi mencatat aktor/waktu, idempotency key UUID ditolak bila tidak valid, retry tidak duplikat, isolasi tenant/outlet, dan rollback transaksi atomik berjalan (`OrderPaymentTest`).

### D-31 — Baseline teknis Phase 5 (Cash Session) — status: disetujui

**Status:** disetujui Product Owner (2026-11-10). Baseline teknis hasil implementasi Phase 5, mengikuti D-06 (satu operator per session), D-07 (satu session aktif per operator per outlet, diproteksi database), dan D-08 (tanpa pengalihan session). Formula `expected_cash = opening_cash + Σ amount` mengikuti contoh requirement `payments-and-cash.md`; `variance = actual_cash − expected_cash` bertanda.

**Baseline yang diimplementasikan:**

- Tabel `cash_sessions` (status `OPEN`/`CLOSED`, `opening_cash`, `actual_cash`, `expected_cash`, `variance`, `variance_note`, `closed_by_membership_id`) dan ledger append-only `cash_movements` (`CASH_SALE`, `CASH_IN`, `CASH_OUT`, `REFUND`, `ADJUSTMENT`; amount bertanda).
- Partial unique index PostgreSQL `(business_id, outlet_id, operator_membership_id) WHERE status = 'OPEN'` sebagai proteksi kedua di luar validasi action; teruji dengan insert mentah yang memicu `UniqueConstraintViolationException`.
- Checkout cash saat operator punya session aktif pada outlet yang sama mencatat movement `CASH_SALE` dalam transaksi yang sama dengan order/payment; replay idempotency tidak menggandakan movement; balapan close vs checkout diserialisasi via `lockForUpdate` pada baris session.

**Keputusan yang dikunci (disetujui Product Owner, 2026-11-10):**

1. Checkout cash **tanpa** session aktif tetap diizinkan dan berjalan tanpa movement kas (order tetap `PAID`). Kebijakan wajib-session tidak diberlakukan; bila kelak direvisi, perubahan dilakukan di `CheckoutAction` beserta test-nya.
2. Permission untuk movement `REFUND` dan `ADJUSTMENT` adalah `cash.reconcile` (katalog MVP tidak punya `cash.refund`); konsekuensi yang disetujui: CASHIER tidak dapat mencatat refund/adjustment kas.
3. Movement refund kas tidak mengubah status payment; transition refund payment tetap tertutup sampai aturan bisnisnya disepakati (D-30 tetap berlaku).

**Verifikasi:** unit formula (`CashSessionFormulaTest`) dan feature open/close/movement/permission/isolasi (`CashSessionTest`) lulus; kontrak endpoint terdokumentasi di `docs/architecture/api-design.md` bagian Phase 5.

### D-32 — Baseline teknis Phase 6 (Basic Inventory) — status: disupersede oleh D-36

**Status:** disetujui Product Owner (2026-11-11); **ditandai tidak berlaku 2026-11-20 oleh D-36**. Isi di bawah adalah catatan historis Phase 6, bukan baseline aktif.

**Baseline yang diimplementasikan:**

- `inventory_items` dimiliki satu Business+Outlet (`business_id`, `outlet_id`), dengan `name`, `unit` (base unit string), `low_stock_threshold` nullable, dan `is_active`. Tidak ada item master lintas outlet.
- Kuantitas berupa integer pada base unit item. Unit conversion, pack/box conversion, pecahan, dan costing tidak termasuk Phase 6.
- `stock_movements` append-only; saldo item = `SUM(quantity_change)`. Phase 6 hanya menulis tipe `ADJUSTMENT` bertanda dengan `reason` wajib dan aktor `membership_id`.
- Adjustment memakai `lockForUpdate` pada item, menolak saldo negatif, dan memakai `idempotency_key` UUID unik per Business. Replay key yang sama mengembalikan movement lama; key lintas item ditolak.
- Low stock dihitung server-side: `low_stock_threshold != null && current_stock <= low_stock_threshold`. Threshold disimpan per item; tidak ada notifikasi otomatis pada fase ini.
- Item tidak dihapus permanen; deaktivasi memakai `PATCH is_active=false` (permission `inventory.update`) agar histori movement tetap valid. `unit` dikunci setelah item memiliki movement agar kuantitas historis tidak berubah makna.
- Permission `inventory.create` dan `inventory.update` ditambahkan ke katalog D-03. Role preset tidak berubah selain Manager otomatis menerima permission baru; CASHIER tetap tidak memiliki akses inventory.

**Keputusan yang dikunci (disetujui Product Owner, 2026-11-11):**

1. **Scope item per Outlet** dipertahankan. Item master Business dengan saldo per Outlet tidak dibuat pada Phase 6.
2. **Stok negatif ditolak** pada adjustment Phase 6.
3. **Permission `inventory.create`/`inventory.update`** dipakai untuk pengelolaan item.
4. **Kuantitas integer pada base unit** dipakai; 0,5 kg dicatat sebagai 500 g. Decimal quantity dan konversi satuan menunggu keputusan lanjutan.
5. **Pengurangan stok dari penjualan ditunda** sampai mapping produk → bahan/recipe (Phase 12A) disepakati.

**Gate yang belum ditutup:**

1. **Pengurangan stok dari penjualan** belum diimplementasikan karena mapping produk → bahan (recipe/BOM) belum disepakati; recipe/BOM dijadwalkan Phase 12A. Checkout tidak boleh mengarang konsumsi bahan.
2. **Unit conversion dan costing** tetap di luar scope; laporan COGS tidak boleh diklaim tersedia. D-09/D-10 tetap menjadi arah untuk fase lanjutan.
3. **Stock opname/waste** belum diimplementasikan; termasuk Phase 12B.
4. **Test paralel nyata** untuk adjustment serentak belum dijalankan; proteksi saat ini adalah row lock, unique constraint, dan test constraint database.

**Verifikasi:** `InventoryTest` mencakup create/read/update, adjustment masuk/keluar, rekonsiliasi ledger, low stock (termasuk batas threshold), retry idempotency, unique constraint database, penolakan saldo negatif/quantity nol/reason kosong, item nonaktif, isolasi Business/Outlet, permission CASHIER, dan penjualan tanpa inventory; seluruh suite backend lulus (lihat laporan implementasi).

### D-33 — Baseline teknis Phase 7 (Reporting) — status: menunggu persetujuan Product Owner

**Status:** usulan baseline hasil implementasi Phase 7. Definisi agregasi laporan berikut mengikuti requirement reporting (`docs/requirements/reporting.md`) dan acceptance criteria Phase 7; jika Product Owner memutuskan berbeda, endpoint dan test terkait harus direvisi bersama kontrak di `api-design.md` §12.

**Baseline yang diimplementasikan:**

1. **Definisi penjualan**: order `PAID` dengan nilai snapshot `total_amount`, tanggal transaksi = konfirmasi pembayaran `PAID` pertama (`MIN(payments.paid_at)`). `PENDING`/`FAILED`/`CANCELLED` tidak dihitung; tidak ada penghitungan ulang dengan harga catalog terkini.
2. **Laporan payment** memisahkan `by_method` (hanya `PAID`) dari `by_status` (semua bucket), sehingga pending/failed tidak pernah digabung ke angka paid.
3. **Operator report** = agregasi order `PAID` per membership; **cash reconciliation** menampilkan opening cash, arus ledger per tipe, expected cash (formula Phase 5/D-31), actual cash, dan variance.
4. **Periode laporan mengikuti jam aplikasi** dengan rentang maksimal 92 hari. Zona waktu aplikasi adalah **Asia/Jakarta** (disetujui Product Owner 2026-11-11), sehingga batas hari laporan mengikuti jam operasional outlet Indonesia.
5. **Endpoint read-only** `GET /api/v1/reports/{sales,payments,operators,cash}` dengan permission `reports.read`, scope Business dari membership, dan batasan outlet akses D-05.

**Gate/keputusan yang belum final:**

1. ~~**Zona waktu laporan**: baseline UTC mengikuti konfigurasi aplikasi; apakah laporan harian perlu memakai Asia/Jakarta (batas hari operasional Indonesia) belum diputuskan Product Owner. Perubahan di masa depan akan memengaruhi interpretasi `from`/`to` dan bucket harian.~~ **Ditutup (2026-11-11):** Product Owner memutuskan zona waktu aplikasi `Asia/Jakarta`; batas hari laporan mengikuti jam operasional WIB.
2. **Refund**: belum didukung (D-30); saat endpoint refund disetujui, definisi `sales_total` (dikurangi refund atau tidak) perlu diputuskan ulang.
3. **Akses report CASHIER**: katalog D-03 tidak memberi `reports.read` ke CASHIER; teks verifikasi D-05 menyebut report dengan batasan outlet. Jika owner ingin cashier melihat report outlet-nya, katalog harus direvisi.
4. **`reports.export`** belum diimplementasikan (tidak ada endpoint export pada Phase 7).

**Verifikasi:** `ReportTest` membandingkan setiap laporan dengan fixture dihitung manual (sales harian + ringkasan, payment by method/status, operator, cash reconciliation), periode kosong, batas rentang, permission, serta isolasi business/outlet; seluruh suite backend lulus (angka terbaru pada D-36).

### D-34 — Baseline teknis Phase 3 (Catalog) — status: disetujui

**Status:** disetujui Product Owner (2026-11-19). Baseline berikut menjadi acuan Phase 3; perubahan di masa depan harus melalui revisi keputusan dan test terkait.

**Baseline yang diimplementasikan:**

1. Tabel `categories` (`business_id`, `name`, `is_active`) dan `products` (`business_id`, `category_id` nullable, `name`, `price` integer rupiah utuh, `is_active`, `is_available`). Catalog adalah master data level Business; tidak ada harga per outlet (D-25).
2. Endpoint `/api/v1/categories` dan `/api/v1/products` (CRUD) dengan permission `categories.*`/`products.*`; list paginated (default 20, maksimum 100) dengan filter `q`, `is_active`, `is_available`, `category_id`; resource di luar Business mengembalikan `404` tanpa membocorkan data.
3. Hapus master data bersifat terbatas: kategori hanya boleh dihapus bila kosong (`422` bila masih berisi menu); produk hanya boleh dihapus bila belum punya `order_items` (`422` bila sudah ada histori). UI admin-web hanya menyediakan deaktivasi (`PATCH is_active=false`), bukan hapus permanen.
4. Guard penjualan tunggal `Product::sellable()`; checkout mengambil ulang menu dari database, menghitung total di backend, dan order item menyimpan snapshot `product_id`/`product_name`/`product_price` sehingga perubahan catalog tidak mengubah histori.
5. Nama kategori/menu boleh duplikat dalam satu Business (tanpa unique constraint).
6. Baca katalog cukup memerlukan permission `categories.read`/`products.read` level Business; outlet access tetap berlaku untuk resource yang memang terikat outlet (order, cash, report, dan availability products).

**Pengecualian yang disetujui:** seluruh suite admin-web (13 file) belum dijalankan ulang dalam satu run karena batasan environment audit (vitest tidak mendukung cwd UNC; run dilewatkan drive mapping dan worker-timeout pada suite penuh). File yang terpengaruh perubahan ini sudah diuji ulang: catalog 5/5 dan POS 14/14 (19/19), type-check dan oxlint lulus.

**Verifikasi:** `CatalogTest` (16 test, 200 assertions) mencakup CRUD, validasi, filter/pagination, status aktif/tersedia, isolasi tenant, permission, dan guard hapus berhistori; snapshot order dibuktikan `test_order_menyimpan_snapshot_harga_dan_nama_setelah_catalog_ubah`; suite backend penuh 158 passed (1103 assertions).

### D-35 — Ketersediaan menu per outlet — status: disetujui

**Status:** disetujui Product Owner (2026-11-19). Melengkapi D-34 butir 1 dan revisi `is_available`.

**Keputusan:**

1. `products.is_available` tetap menjadi **master switch** Business ("habis di semua outlet"). Override per outlet hanya dapat mempersempit ketersediaan, tidak dapat menghidupkan menu yang dimatikan secara global.
2. Tabel `product_outlet_availabilities` (`product_id`, `outlet_id`, `is_available`, unique `(product_id, outlet_id)`, FK `restrictOnDelete`) menyimpan override. Tidak adanya baris berarti menu mengikuti master switch.
3. Ketersediaan efektif = `products.is_active && products.is_available && (tidak ada override OR override.is_available = true)`.
4. Permission baru `products.update_availability` (revisi D-03) dipakai untuk mengubah override, dan tetap memerlukan akses outlet (D-05). Permission ini diberikan ke preset CASHIER agar operator dapat menandai menu habis saat berjualan; permission `products.update` tetap tidak diberikan ke CASHIER.
5. Endpoint `PATCH /api/v1/products/{product}/availability` menerima `{outlet_id, is_available}`. Outlet di luar akses atau di luar Business ditolak `404`/`422` tanpa membocorkan data.
6. `GET /api/v1/products?outlet_id=X` bersifat opsional: bila dikirim, response menyertakan `is_available_at_outlet` dan filter `is_available` dihitung secara efektif untuk outlet tersebut. Tanpa `outlet_id`, perilaku lama tidak berubah.
7. Checkout memakai `Product::sellable($outletId)` sehingga menu yang habis di outlet terkait ditolak `422` pada outlet itu saja.
8. UI admin-web menambahkan filter outlet dan aksi "Tandai habis"/"Tandai tersedia" untuk outlet terpilih; POS selalu mengirim `outlet_id` outlet aktif.

**Gate yang belum ditutup:** perubahan ketersediaan belum masuk audit log (dependency D-28); tidak ada test konkurensi khusus selain unique constraint upsert; availability per outlet tidak berlaku untuk kategori (kategori tetap level Business).

**Verifikasi:** `CatalogTest` mencakup override per outlet, isolasi outlet (cashier), master switch global, dan checkout yang hanya tertolak di outlet terkait; `PermissionCatalogTest` mencerminkan permission baru.

### D-36 — Penghapusan modul inventory bahan baku — status: disetujui

**Status:** disetujui Product Owner (2026-11-20). Keputusan ini membatalkan bagian inventory pada D-03, D-22, D-24, D-28, D-32, dan D-33, serta seluruh keputusan historis di bagian 3.

**Alasan:** stok numerik bahan baku tidak masuk scope produk saat ini. Ketersediaan menu untuk pembeli sudah dicakup oleh `products.is_available` dan `product_outlet_availabilities` (D-35), sehingga modul inventory tidak perlu dipertahankan sebagai fitur opsional.

**Keputusan:**

1. Hapus seluruh modul inventory dari kode dan kontrak aktif: endpoint `/api/v1/inventory`, endpoint `/api/v1/reports/inventory`, kelima permission `inventory.*`, controller/request/resource/action/model/factory/test backend, halaman/dialog/route/nav/types/API client/validasi/label permission admin-web, widget low-stock dashboard, serta seksi inventory laporan.
2. Hapus data inventory secara permanen lewat migration `2026_11_20_000000_drop_inventory_tables.php`: hapus override `inventory.%` pada `membership_permission_overrides`, lalu drop `stock_movements` dan `inventory_items`. Migration pembuat tabel lama tetap dipertahankan sebagai arsip skema; `down()` sengaja tidak memulihkan data.
3. Katalog permission D-03 kembali tanpa `inventory.*`. Guard penghapusan outlet dan member tidak lagi memeriksa tabel inventory.
4. Checkout, payment, kas, order, dan reporting tidak berubah secara fungsional selain hilangnya laporan inventory. Ketersediaan menu memakai D-35; stok numerik per menu tidak ditambahkan pada keputusan ini.
5. Recipe/BOM, COGS, waste, stock opname, konversi satuan, dan advanced inventory dikeluarkan dari perencanaan aktif MVP maupun roadmap Phase 12. Jika dibutuhkan kelak, semuanya memerlukan keputusan produk baru.

**Verifikasi:** suite backend 143 passed / 946 assertions; `pint --test` PASS 158 files. Admin-web: `tsc -b` sukses, `oxlint` 0 error (3 warning lama), `vitest run` 70/70 passed. Commit `616ea9b` di branch `refactor/remove-inventory`; masih belum di-push. Angka suite terbaru setelah D-37 tercatat pada keputusan tersebut.

### D-37 — Stok numerik opsional per menu dan outlet — status: disetujui

**Status:** disetujui Product Owner (2026-11-20). Melengkapi D-35 dan D-36 tanpa menghidupkan kembali modul inventory bahan baku.

**Alasan:** merchant perlu membatasi jumlah menu yang dapat dijual per outlet, tetapi tidak boleh dipaksa mengisi stok. Fitur ini hanya mengikuti hasil penjualan dan koreksi manual; tidak ada resep, BOM, COGS, waste, atau stock opname.

**Keputusan:**

1. Stok bersifat **opsional**. Tidak ada baris `product_stocks` berarti menu tidak dibatasi (`stock_quantity = null` pada response). Adanya baris berarti stok dipantau; `quantity = 0` berarti habis. Menu lama tetap berjualan tanpa migrasi data.
2. Tabel `product_stocks` menyimpan `business_id`, `product_id`, `outlet_id`, dan `quantity` unsigned dengan unique `(product_id, outlet_id)` serta FK `restrictOnDelete`. Semua query stok diskop ke Business dan outlet yang diizinkan.
3. Tabel `product_stock_movements` adalah ledger append-only dengan tipe `adjustment` dan `sale`, menyimpan `quantity_change`, `product_name`, aktor (`membership_id`), order terkait, reason, dan `created_at`. FK ke product/outlet/membership boleh null agar histori tetap ada saat master data dihapus. Unique `(order_id, product_id)` mencegah movement ganda.
4. Endpoint baru `PATCH /api/v1/products/{product}/stock` menerima `{outlet_id, quantity: number | null, reason?}`. `quantity: null` menghapus baris stok dan mengembalikan menu ke kondisi tanpa batas. Permission baru `products.update_stock` diberikan ke OWNER/MANAGER, bukan CASHIER; akses outlet tetap diverifikasi (D-05).
5. `GET /api/v1/products?outlet_id=X` menyertakan `stock_quantity` hanya ketika `outlet_id` dikirim. Filter `is_available=true` dan `Product::sellable($outletId)` menyembunyikan/menolak menu dengan stok 0, selaras dengan D-35.
6. Checkout mem-lock baris stok yang dipantau, menolak quantity melebihi stok dengan `422 items`, lalu memotong stok dan menulis satu movement `sale` per menu per order di dalam transaksi order/payment yang sama. Item duplikat diagregasi. Retry idempotency mengembalikan order yang sama tanpa potongan kedua.
7. Admin-web menampilkan stok per outlet dan menyediakan dialog ubah stok bagi pengguna dengan `products.update_stock`. POS menyembunyikan menu habis dari filter server dan menonaktifkan tombol bila stok 0; backend tetap authoritative.
8. Config stok per outlet dihapus saat outlet dihapus. Produk tanpa histori order dapat dihapus bersama config availability/stoknya; produk dengan histori tetap harus dinonaktifkan (D-34).

**Gate yang belum ditutup:** belum ada test konkurensi paralel yang benar-benar bersamaan; perlindungan mengandalkan `lockForUpdate` dan unique constraint. Belum ada endpoint/report ledger stok untuk konsumsi UI atau audit, dan belum ada notifikasi stok menipis. Refund/pembatalan belum mengembalikan stok karena alur refund belum disetujui (D-30).

**Verifikasi:** `pint --test` PASS 163 files; `php artisan test` 147 passed / 1008 assertions. Admin-web: `tsc -b` sukses, `oxlint` 0 error (3 warning lama), `vitest run` 71/71 passed. Fitur ini belum di-commit dan belum di-push.

## 9. Daftar Gate yang Tetap Harus Ditutup Sebelum Produksi

Keputusan-keputusan di atas memberi arah yang cukup untuk desain dan pengembangan, tetapi item berikut membutuhkan bukti atau persetujuan khusus:

| Gate                                                       | Pemilik keputusan                           | Bukti sebelum ditutup                                                                |
| ---------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------ |
| Tarif platform fee, pajak, dan ketentuan merchant          | Product Owner/business                      | Pricing approval, contoh statement, syarat penggunaan dan perlakuan refund disetujui |
| Live payment dan settlement ke merchant                    | Product Owner + provider/payment integrator | Verifikasi kontrak/onboarding, alur settlement, refund, webhook, serta sandbox tests |
| Provider object storage dan infrastruktur backup           | Technical owner                             | Environment produksi, access policy, backup/restore test                             |
| Printer yang didukung                                      | Product/QA + pemilik perangkat pilot        | Hasil pengujian model fisik pada perangkat target                                    |
| Kebijakan audit/privacy retention                          | Product Owner + reviewer legal/security     | Kebijakan tertulis sebelum auto-purge dan produksi                                   |
| Target RPO/RTO jika infrastruktur tidak mendukung baseline | Technical owner + Product Owner             | Persetujuan risiko tertulis                                                          |

## 10. Aturan Pemeliharaan Keputusan

Saat mengubah keputusan:

1. Perbarui nomor keputusan, status, alasan, dan dampaknya dalam dokumen ini.
2. Sinkronkan ringkasan pada dokumen requirement/architecture terkait dan perbarui peta dokumentasi bila ada file baru.
3. Tambahkan ADR untuk keputusan arsitektur yang sulit dibalik atau berdampak lintas-modul.
4. Perbarui acceptance criteria di `docs/planning/phase-targets.md` bila scope fase berubah.
5. Tambahkan test yang membuktikan aturan baru dan jelaskan dampak migrasi/data lama.

Coding agent boleh mengusulkan alternatif yang didukung alasan teknis, namun tidak boleh mengubah baseline atau menganggap gate produksi telah lulus tanpa bukti.

## Keputusan clean rebuild (2026-10-31)

Dagana akan diinisialisasi ulang dari baseline project baru. Ini adalah keputusan proses/engineering, bukan perubahan scope produk:

- Pertahankan scope, workflow, model data, aturan tenant, role, permission, fase, dan acceptance criteria pada requirement produk.
- Inisialisasi ulang workspace `apps/api`, `apps/admin-web`, `apps/customer-web`, dan `apps/pos-mobile` dari scaffold resmi masing-masing stack.
- Jangan migrasikan kode lama, migration lama, database dump, build output, atau secret secara otomatis.
- Bila repository target sudah berisi pekerjaan, perubahan destruktif tetap memerlukan persetujuan eksplisit.
- Docker development tetap untuk Laravel API, PostgreSQL, Redis, dan layanan pendukung yang memang diperlukan. Flutter SDK dan Android tooling berjalan di host.

## Keputusan email akun (2026-11-18)

Status: **Disetujui** (scope MVP, implementasi selesai 2026-11-18).

Keputusan:

1. **Verifikasi email wajib hanya untuk akun self-register (Owner).** Registrasi mandiri membuat akun tanpa `email_verified_at`, mengirim email verifikasi, dan **endpoint bisnis diblokir (403)** sampai verifikasi. Login tetap diizinkan sehingga UI bisa menampilkan layar "cek email Anda" dengan tombol kirim ulang.
2. **Akun employee yang dibuat langsung oleh Owner otomatis terverifikasi** (`CreateMemberAction` mengisi `email_verified_at`): Owner memvouch email karyawan (konsisten dengan keputusan direct-create 2026-11-16); karyawan tidak menerima email verifikasi.
3. **Data lama di-grandfathered**: migration `2026_11_18_000000_add_password_reset_tokens_and_mark_users_verified` menandai semua user existing sebagai terverifikasi, sehingga user lama tidak dipaksa verifikasi ulang.
4. **Forgot password** tersedia untuk semua akun: `POST /auth/forgot-password` selalu merespons sama (anti email-enumeration), reset (`POST /auth/reset-password`) memperbarui password dan **mencabut semua API token** user. Tautan reset mengarah ke halaman admin-web.
5. **Tautan email** (verifikasi & reset) dibangun sebagai URL bertanda tangan ke endpoint API, lalu parameternya (`id`, `hash`, `expires`, `signature` / `token`, `email`) diteruskan ke halaman admin-web yang memanggil endpoint API tersebut. Frontend URL diambil dari `FRONTEND_URL` (`config('app.frontend_url')`).
6. **Mail dev stack**: Mailpit ditambahkan ke `compose.yaml` (SMTP `:1025`, UI `:8025`); container API dikonfigurasi `MAIL_MAILER=smtp`, `MAIL_HOST=mailpit`. `.env.example` mengarah ke `127.0.0.1:1025` untuk workflow host.
7. **Email dikirim sinkron** (tanpa `ShouldQueue`) untuk MVP karena belum ada queue worker di deployment; jika nanti worker ditambahkan, notifikasi dapat di-queue tanpa perubahan endpoint.

Dampak implementasi: middleware `EnsureEmailVerified` (alias `email-verified`) dipakai di `POST /businesses` dan di dalam `EnsurePermission`; `config/passwords.php` dibuat (belum ada sebelumnya); tabel `password_reset_tokens` (migration guard `hasTable` karena tabel sudah ada di DB dev lama); UI admin-web menambah halaman `/forgot-password`, `/reset-password`, `/verify-email`, layar `VerifyEmailRequired` pada `RequireSession`, dan link "Lupa kata sandi?" di halaman login. POS mobile MVP cukup membuka URL halaman reset web (belum ada UI native — dibuka lewat browser).

Catatan operasional: `apps/api/.env` milik developer (tidak dikomit) sempat berisi `MAIL_HOST=://gmail.com` yang salah format; untuk SMTP Gmail gunakan host `smtp.gmail.com`, port `587`, enkripsi `tls`, dengan app password.
