# Architecture — API Design

> **Status:** Draft baseline
> **API style:** REST
> **Version prefix:** `/api/v1`

## 1. Prinsip

- Laravel API adalah satu-satunya pemilik business rules dan authorization.
- Semua client memakai API yang sama. Jangan membuat aturan checkout berbeda untuk POS dan QR Ordering.
- Endpoint harus memvalidasi input di server dan memeriksa permission serta Business/Outlet scope.
- API response harus stabil dan tidak mengekspos field internal secara tidak sengaja.
- Perubahan kontrak harus disertai pembaruan tests dan dokumentasi.

## 2. Resource groups awal

Resource group berikut adalah baseline untuk pengelompokan endpoint, bukan spesifikasi endpoint final. Detail method, payload, status code, dan schema ditentukan sebelum implementasi fase terkait.

```text
/api/v1/auth
/api/v1/me
/api/v1/businesses
/api/v1/outlets
/api/v1/memberships
/api/v1/employees
/api/v1/roles
/api/v1/permissions
/api/v1/regions
/api/v1/categories
/api/v1/products
/api/v1/inventory
/api/v1/stock-movements
/api/v1/orders
/api/v1/payments
/api/v1/cash-sessions
/api/v1/tables
/api/v1/qr
/api/v1/reports
/api/v1/billing
/api/v1/audit-logs
```

## 3. Request processing boundary

```text
Route
  -> Authentication / trusted context
  -> Request validation
  -> Policy / permission + tenant/outlet scope
  -> Controller (HTTP adapter)
  -> Service / Action (use case)
  -> Database transaction / domain operations
  -> API Resource / consistent response
```

## 4. Contract details that must be documented per feature

Sebelum endpoint digunakan oleh lebih dari satu client, dokumentasikan minimal: method dan path, auth requirement, permission, Business/Outlet scope, request schema, response schema, error cases, pagination/filtering, idempotency requirement, dan event side effects. Gunakan OpenAPI atau format kontrak yang dipilih repository; jangan membuat kontrak duplikat yang tidak sinkron.

## 5. Operational endpoints

- `GET /up` — liveness Laravel; dipakai healthcheck container untuk memastikan proses aplikasi berjalan.
- `GET /api/v1/health` — readiness; memeriksa koneksi PostgreSQL dan Redis. Mengembalikan `200` dengan `{"status":"ok","checks":{...}}` saat siap dan `503` dengan `{"status":"unavailable"}` saat ada dependency gagal. Endpoint ini tidak memerlukan autentikasi dan tidak mengembalikan detail error internal.

## 6. Security and compatibility

- Jangan percaya `business_id`, `outlet_id`, role, atau membership dari client sebelum divalidasi terhadap authenticated user.
- Jangan expose stack trace, SQL error, secret, atau internal filesystem path.
- Paginate list besar dan batasi filter/search.
- Perubahan enum/status/field/permission adalah perubahan kontrak dan harus diuji.
- Callback payment tidak boleh dianggap sukses hanya dari redirect client; verifikasi signature/webhook server-side.

Requirement produk yang mendasari API: `docs/requirements/identity-and-access.md`, `payments-and-cash.md`, dan `platform-quality.md`.

## 7. Phase 1 contract — identity, business, outlet

Autentikasi web admin memakai Laravel Sanctum SPA session: browser memanggil `GET /sanctum/csrf-cookie`, lalu login/register melalui endpoint `/auth/web/*` dengan cookie `dagana-session` yang `HttpOnly` dan `XSRF-TOKEN` yang dapat dibaca JavaScript. Setiap request yang mengubah data mengirim header `X-XSRF-TOKEN` dan `credentials: include`; token tidak disimpan di `localStorage`. Klien mobile tetap memakai Sanctum personal access token (`Authorization: Bearer <token>`) dan wajib menyimpannya di secure storage. Semua response resource memakai envelope `data`.

| Method | Path | Auth | Keterangan |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | publik, throttle 6/menit | Membuat user dan bearer token untuk mobile; tidak membuat business. |
| `POST` | `/api/v1/auth/login` | publik, throttle 6/menit | Menukar kredensial dengan bearer token untuk mobile. |
| `POST` | `/api/v1/auth/logout` | bearer | Menghapus token yang sedang dipakai; `204`. |
| `POST` | `/api/v1/auth/web/register` | publik, throttle 6/menit | Membuat user dan session web; response tidak memuat token. |
| `POST` | `/api/v1/auth/web/login` | publik, throttle 6/menit | Membuat session web; response tidak memuat token. |
| `POST` | `/api/v1/auth/web/logout` | session | Menghapus session web; `204`. |
| `GET` | `/api/v1/me` | bearer atau session | Profil user; tidak memuat password/remember token. |
| `POST` | `/api/v1/businesses` | bearer atau session | Onboarding atomik: business + outlet pertama + owner membership. |
| `GET` | `/api/v1/businesses/{business}` | bearer atau session, membership aktif | 404 bila business bukan milik user. |
| `PATCH` | `/api/v1/businesses/{business}` | bearer atau session, membership aktif | Update nama business. |
| `GET` | `/api/v1/outlets` | bearer atau session, membership aktif | Hanya outlet milik business user. |
| `POST` | `/api/v1/outlets` | bearer atau session, membership aktif | Menambah outlet pada business user. |
| `GET` | `/api/v1/outlets/{outlet}` | bearer atau session, membership aktif | 404 bila outlet di luar scope. |
| `PATCH` | `/api/v1/outlets/{outlet}` | bearer atau session, membership aktif | Update pengaturan dasar outlet. |
| `DELETE` | `/api/v1/outlets/{outlet}` | bearer atau session, membership aktif | Hard delete outlet; business harus tetap memiliki minimal satu outlet. |
| `GET` | `/api/v1/regions/provinces` | bearer atau session | Daftar provinsi dari cache backend. |
| `GET` | `/api/v1/regions/regencies/{province}` | bearer atau session | Daftar kabupaten/kota. |
| `GET` | `/api/v1/regions/districts/{regency}` | bearer atau session | Daftar kecamatan. |
| `GET` | `/api/v1/regions/villages/{district}` | bearer atau session | Daftar desa/kelurahan beserta kode pos. |

Business hanya menyimpan `name`. Outlet menyimpan `name` (wajib), `phone` (opsional), dan alamat komposit `address` (`street`, `village`, `district`, `regency`, `province`, `postal_code`) yang opsional. Pada onboarding, `business` hanya memuat `name`; `phone` dan alamat hanya dikirim di `outlet`.

Endpoint wilayah memakai cache backend (data fresh 1 hari, stale hingga 7 hari) dan circuit breaker (3 kegagalan berturut-turut membuka breaker selama 1 menit). Jika penyedia eksternal gagal, backend tetap melayani data cache terakhir; frontend tidak boleh memanggil penyedia wilayah secara langsung.

Contoh onboarding:

```json
{
  "business": { "name": "Warung Budi" },
  "outlet": {
    "name": "Outlet Pusat",
    "phone": "081298765432",
    "address": {
      "street": "Jl. Merdeka No. 1",
      "village": "Kelurahan Menteng",
      "district": "Kecamatan Menteng",
      "regency": "Jakarta Pusat",
      "province": "DKI JAKARTA",
      "postal_code": "10310"
    }
  }
}
```

Response sukses onboarding (`201`):

```json
{
  "data": {
    "business": {
      "id": 1,
      "name": "Warung Budi"
    },
    "outlet": {
      "id": 1,
      "business_id": 1,
      "name": "Outlet Pusat",
      "phone": "081298765432",
      "address": {
        "street": "Jl. Merdeka No. 1",
        "village": "Kelurahan Menteng",
        "district": "Kecamatan Menteng",
        "regency": "Jakarta Pusat",
        "province": "DKI JAKARTA",
        "postal_code": "10310"
      }
    }
  }
}
```

Error yang dipakai: `401` tanpa token valid, `404` untuk resource di luar scope tenant (tanpa membocorkan keberadaannya), `422` untuk validasi termasuk user yang sudah punya business, dan `429` untuk throttle register/login. Bentuk error validasi mengikuti default Laravel `{ "message": ..., "errors": { ... } }`.

## 8. Phase 2 contract — membership, role, permission

Authorization memakai middleware `permission:<resource.action>` yang memeriksa membership aktif dan permission preset. Tidak ada custom role atau permission override. `403` dipakai bila membership tidak aktif atau permission tidak dimiliki; `404` dipakai bila resource di luar Business/Outlet scope agar keberadaan data tenant lain tidak terbocorkan.

| Method | Path | Permission | Keterangan |
|---|---|---|---|
| `GET` | `/api/v1/me` | bearer atau session | Menambahkan `data.membership` berisi role, status, `business`, `outlets`, dan permission efektif. `null` bila user belum punya membership. |
| `GET` | `/api/v1/members` | `members.read` | Daftar membership pada Business user, termasuk Owner. |
| `POST` | `/api/v1/members` | `members.invite` | Membuat akun employee dan membership aktif langsung. Role hanya `MANAGER` atau `CASHIER`. |
| `PATCH` | `/api/v1/members/{membership}` | `members.update` | Ubah role preset, set outlet access, dan/atau status (`ACTIVE`/`INACTIVE`). Deaktivasi mencabut token tetapi mempertahankan record membership dan outlet access; reaktivasi memakai role/outlet yang sama. |
| `DELETE` | `/api/v1/members/{membership}` | `members.delete` | Hard delete membership employee; hanya Owner, tidak dapat menghapus Owner atau dirinya sendiri, dan token user dicabut. |
| `GET` | `/api/v1/roles` | `members.read` | Katalog tiga role preset beserta permission-nya untuk kebutuhan UI. |

`members.delete` menghapus record membership secara permanen, tetapi mempertahankan user untuk atribusi historis. Owner tidak dapat dihapus melalui endpoint ini. Untuk sekadar mencabut akses sementara, gunakan `PATCH` dengan field `status` agar membership dan outlet access dapat diaktifkan kembali.

Owner memiliki seluruh permission katalog dan akses ke semua outlet secara implisit. Manager dan Cashier hanya dapat mengakses outlet yang tercatat di `outlet_accesses`. Manager tidak dapat mengubah/menonaktifkan Owner, mengubah aksesnya sendiri, memberi role `OWNER`, atau memberi outlet access di luar outlet yang ia akses. Owner tidak dapat diubah melalui endpoint member karena Business harus tetap memiliki tepat satu Owner.

Contoh penambahan employee:

```json
{
  "name": "Kasir Satu",
  "email": "kasir@example.com",
  "password": "password123",
  "role": "CASHIER",
  "outlet_ids": [1]
}
```

Response `201` memakai envelope `data` berisi `id`, `user_id`, `business_id`, `role`, `status`, `user`, `business`, `outlets`, dan `permissions`. Katalog role mengembalikan `data` berisi `[{ "role": "OWNER", "permissions": [...] }]`. `POST`/`PATCH` memakai `422` untuk role di luar preset, email duplikat, atau `outlet_ids` yang bukan milik Business.

Catatan: alur undangan via email belum diputuskan; implementasi saat ini adalah penambahan employee langsung dengan password awal dari operator. Perubahan membership belum masuk audit log karena modul audit belum dibangun.

## 9. Phase 3 contract — catalog

Catalog adalah master data level Business (`categories`, `products`); satu Business memakai harga yang sama di semua Outlet sesuai D-25, sehingga tidak ada endpoint per-outlet. Path `/api/v1/products` dipakai alih-alih baseline `/menus` agar konsisten dengan permission D-03 (`products.*`). Menu tanpa kategori valid; menu bisa aktif tetapi tidak tersedia (`is_available` false, mis. sold out).

Skema kolom: `products.price` adalah integer rupiah utuh; `is_active` dan `is_available` boolean (default `true`); `category_id` nullable dengan FK ke kategori milik Business yang sama.

| Method | Path | Permission | Keterangan |
|---|---|---|---|
| `GET` | `/api/v1/categories` | `categories.read` | Paginated; filter `is_active`, `q` (nama). |
| `POST` | `/api/v1/categories` | `categories.create` | Body: `name` (wajib), `is_active`. |
| `GET` | `/api/v1/categories/{id}` | `categories.read` | `404` bila di luar Business. |
| `PATCH` | `/api/v1/categories/{id}` | `categories.update` | Update `name` dan/atau `is_active` (jalur deaktivasi). |
| `DELETE` | `/api/v1/categories/{id}` | `categories.delete` | Hard delete hanya bila masih kosong; `422` bila masih memiliki menu (gunakan `PATCH is_active`). |
| `GET` | `/api/v1/products` | `products.read` | Paginated; filter `category_id`, `is_active`, `is_available`, `q` (nama). |
| `POST` | `/api/v1/products` | `products.create` | Body: `name` (wajib), `price` (wajib, integer ≥ 0), `category_id` (nullable, wajib milik Business sendiri), `is_active`, `is_available`. |
| `GET` | `/api/v1/products/{id}` | `products.read` | `404` bila di luar Business. |
| `PATCH` | `/api/v1/products/{id}` | `products.update` | Update `name`, `price`, `category_id`, `is_active`, `is_available`. |
| `DELETE` | `/api/v1/products/{id}` | `products.delete` | Hard delete; setelah tabel order tersedia (Phase 4) endpoint ini wajib menolak menu yang sudah memiliki transaksi. |

Pagination memakai parameter `per_page` (default `20`, maksimum `100`) dan `page`, dengan envelope standar Laravel (`data` + `meta`/`links`). List endpoint selalu ter-scope ke Business membership yang aktif; `403` untuk permission/membership tidak sah, `404` untuk resource di luar Business, `422` untuk validasi.

**Kontrak snapshot nama/harga untuk Phase 4 (wajib diterapkan Order Engine):**

1. Saat order dibuat, tiap order item menyimpan snapshot `product_id`, `name`, dan `price` saat transaksi (plus field lain yang diperlukan receipt). Perubahan `name`/`price` catalog kemudian hari tidak boleh mengubah data order yang sudah tersimpan; jalur pembacaan receipt/histori mengambil nilai snapshot, bukan nilai catalog saat ini.
2. Checkout backend wajib mengambil ulang menu dari database melalui scope `App\Models\Product::sellable()` (`is_active = true AND is_available = true`), menghitung total dari harga snapshot tersebut, dan tidak pernah mempercayai `price`/`is_active`/`is_available`/`product_id` dari client. Menu nonaktif/tidak tersedia gagal checkout dengan `422`.
3. `DELETE` product yang sudah memiliki transaksi menolak; judulnya deaktivasi memakai `PATCH` `is_active = false` sehingga referensi `product_id` pada histori tetap valid. Referensi histori tidak digantungkan pada nama kategori (snapshot menyimpan nama), sehingga kategori dapat dinonaktifkan tanpa mengubah histori.

## 10. Phase 4 contract — order engine dan pembayaran (POS)

Order Engine adalah satu titik masuk untuk semua channel transaksi (POS, QR, ADMIN). Order disimpan dengan `business_id`, `outlet_id`, dan `membership_id` (aktor) agar isolasi tenant/outlet selalu dapat ditegakkan. Order item menyimpan snapshot `product_id`, `product_name`, dan `product_price` pada saat transaksi, sehingga perubahan catalog tidak mengubah receipt/histori yang sudah tersimpan.

IDR disimpan sebagai integer rupiah utuh; tidak ada perhitungan uang dengan float.

| Method | Path | Permission | Keterangan |
|---|---|---|---|
| `POST` | `/api/v1/orders` | `orders.create` | Checkout: membuat order, order items (snapshot), dan payment secara atomik dalam satu transaksi database. `idempotency_key` wajib; request ulang dengan kunci yang sama mengembalikan order yang sudah ada (tidak ada duplikasi). Menu diambil ulang lewat `Product::sellable()`; total dihitung ulang di backend, harga/kategori dari client tidak dipercaya. Untuk `payment_method=cash`, `amount_tendered` wajib berupa integer rupiah dan harus mencukupi total final server. |
| `GET` | `/api/v1/orders` | `orders.read` | Daftar order terpaginate, difilter Business, opsi `outlet_id`. |
| `GET` | `/api/v1/orders/{order}` | `orders.read` | Detail order + receipt: item, snapshot, dan payment. `404` bila di luar Business/Outlet scope. |
| `POST` | `/api/v1/orders/{order}/cancel` | `orders.cancel` | Batal order: hanya `PENDING` tanpa pembayaran `PAID`; otherwise `422`. |
| `POST` | `/api/v1/payments/{payment}/confirm` | `payments.create` | Konfirmasi pembayaran server-side `PENDING → PAID` (untuk metode non-tunai setelah verifikasi backend). Order `PENDING` ikut berubah menjadi `PAID`. |

Metode pembayaran MVP dikelompokkan dua alur:

- **Cash:** order dan payment langsung `PAID` pada checkout. Aktor konfirmasi (`payments.confirmed_by`) adalah operator yang melakukan checkout, `paid_at` terisi saat itu. Konsistensi Order–Payment–Cash Session harus terjaga saat Cash Session (Phase 5) menyambung total cash sales; tidak adanya gateway bukan alasan mengurangi integritas transaksi.
- Response payment menyediakan `amount_tendered` dan `change_amount` untuk transaksi cash (`null` pada payment lama/non-cash), serta `qr_code_payload` nullable. Payload QRIS hanya dirender frontend bila disediakan backend/provider; field kosong berarti QRIS belum tersedia. Kontrak ini tidak mengaktifkan atau mengimplementasikan gateway.
- **Non-cash (`qr_payment`, `bank_transfer`, `debit`, `credit`):** payment dibuat `PENDING`. `POST /payments/{payment}/confirm` mengubahnya menjadi `PAID` hanya untuk pengguna dengan permission `payments.create`, akses outlet yang sah, dan setelah pembayaran diverifikasi backend; aktor dan waktu konfirmasi dicatat (`confirmed_by`, `paid_at`). Endpoint ini bukan jalan pintas: pengguna tak berizin (401/403) atau payment non-PENDING (422) tidak dapat mengubah status. Belum ada klaim integrasi otomatis/gateway production — QR payment otomatis baru dapat diklaim setelah provider, verifikasi callback/webhook, dan pengujian settlement tersedia (D-15/D-16).

Satu order memakai satu metode (split payment bukan MVP, D-23).

Status payment: `PENDING`, `PAID`, `FAILED`, `REFUNDED`, `PARTIALLY_REFUNDED`. Status order: `PENDING`, `PAID`, `CANCELLED`. Transisi divalidasi di server; request arbitrer tidak dapat mengubah payment menjadi `PAID` tanpa jalur konfirmasi yang sah. **Refund belum didukung:** status `REFUNDED`/`PARTIALLY_REFUNDED` tersimpan sebagai enum model, tetapi belum ada state transition atau endpoint yang dapat mencapainya. Implementasi refund kelak membutuhkan aturan bisnis, otorisasi, audit trail, dan pencatatan finansial yang sesuai; penempatannya mengikuti roadmap (Phase 5 mencakup refund sebagai aktivitas Cash Session, billing D-12 mengidentifikasi refund pada `eligible_net_sales`). Ketersediaan enum/model tidak berarti fiturnya sudah didukung secara fungsional.

Idempotency: `orders.idempotency_key` wajib berformat UUID dan beda untuk setiap operasi checkout (validasi `uuid` di backend). Kolom memakai unique constraint global dan pertahankan untuk implementasi saat ini; pencarian dan pengembalian hasil replay selalu mencakup pemeriksaan `business_id` dan otorisasi membership/outlet, sehingga key milik Business lain tidak dapat dipakai untuk membaca atau menggandakan transaksi. Composite unique `(business_id, idempotency_key)` dievaluasi hanya jika kebutuhan sistem benar-benar memintanya — jangan migration ulang hanya untuk mengubah constraint; perlindungan race condition tetap melalui unique constraint + `lockForUpdate()` pada produk selama checkout.

## 11. Phase 5 contract — Cash Session

Cash Session (D-06/D-07/D-08) adalah konteks tanggung jawab kas per operator per outlet, bukan shift management. Aturan dasar:

- Satu session mempunyai tepat satu operator (`operator_membership_id`). Batas **satu session aktif per operator per outlet** divalidasi di backend dan diproteksi partial unique index PostgreSQL `cash_sessions_unique_active_operator (business_id, outlet_id, operator_membership_id) WHERE status = 'OPEN'`, sehingga request bersamaan tidak meloloskan session ganda.
- Setiap arus kas adalah baris ledger `cash_movements` yang append-only: `CASH_SALE` (positif, otomatis dari checkout cash), `CASH_IN` (+), `CASH_OUT` (−), `REFUND` (−), `ADJUSTMENT` (bertanda ±). Saldo tidak pernah diubah tanpa riwayat movement.
- Formula (mengikuti contoh requirement): `expected_cash = opening_cash + Σ amount` pada ledger; `variance = actual_cash − expected_cash` (bertanda, bisa negatif), dengan `variance_note` opsional dari operator. Expected cash dihitung di backend, tidak diterima dari client.
- Session `CLOSED` tidak menerima movement baru maupun penutupan ulang (422); koreksi pasca-close memakai alur eksplisit (session baru + movement), bukan pengubahan record lama.
- Checkout cash yang terjadi saat operator memiliki session aktif pada outlet yang sama mencatat movement `CASH_SALE` dalam transaksi database yang sama dengan order/payment (idempotency replay tidak menggandakan movement). Balapan close vs checkout diserialisasi dengan `lockForUpdate` pada baris session: close menghitung expected cash dari movement yang sudah commit; checkout ke session yang baru ditutup tidak menulis movement.

| Method | Path | Permission | Keterangan |
|---|---|---|---|
| `POST` | `/api/v1/cash-sessions` | `cash.open` | Buka session: `outlet_id` + `opening_cash` (integer rupiah ≥ 0). `422` bila operator masih punya session aktif di outlet sama (D-07). |
| `GET` | `/api/v1/cash-sessions` | `cash.read` | Daftar terpaginate; filter `outlet_id` dan `status`. Non-owner hanya melihat outlet dalam cakupan aksesnya (D-05). Response memuat `expected_cash` live. |
| `GET` | `/api/v1/cash-sessions/{session}` | `cash.read` | Detail session. `404` di luar Business, `403` bila outlet tidak dalam cakupan akses. |
| `GET` | `/api/v1/cash-sessions/{session}/movements` | `cash.read` | Ledger movement terpaginate. |
| `POST` | `/api/v1/cash-sessions/{session}/movements` | `cash.read` (route) + per-type di action | Catat movement: `CASH_IN` → `cash.cash_in`, `CASH_OUT` → `cash.cash_out`, `REFUND` dan `ADJUSTMENT` → `cash.reconcile`. Type `CASH_SALE` ditolak (hanya dibuat otomatis dari checkout). Nominal `CASH_IN`/`CASH_OUT`/`REFUND` wajib positif; `ADJUSTMENT` boleh negatif, tidak boleh 0. |
| `POST` | `/api/v1/cash-sessions/{session}/close` | `cash.close` | Tutup session: `actual_cash` (≥ 0) + `variance_note` opsional. Backend menghitung `expected_cash` dan `variance = actual_cash − expected_cash`. `422` untuk session yang sudah CLOSED. |

Keputusan yang dikunci untuk Phase 5 (disetujui Product Owner 2026-11-10, D-31):

1. **Checkout cash tanpa session aktif** diizinkan dan berjalan tanpa movement kas (order tetap `PAID`). Kebijakan wajib-session tidak diberlakukan.
2. **Movement `REFUND`/`ADJUSTMENT` memakai permission `cash.reconcile`** karena katalog permission MVP tidak memiliki `cash.refund`; konsekuensi: CASHIER tidak dapat mencatat refund/adjustment kas.
3. **Movement refund kas ≠ transition refund payment.** Refund kas adalah pengeluaran kas yang direkam sebagai ledger; status payment `REFUNDED` tetap belum didukung (D-30) sampai aturan bisnis refund payment disepakati.

## 12. Phase 6 contract — Basic Inventory

Basic inventory bersifat opsional dan tidak menjadi prasyarat POS. Item dimiliki satu Business+Outlet (`inventory_items`). Kuantitas disimpan sebagai integer pada base unit item (`unit` berupa string, mis. `g`, `ml`, `pcs`); **tidak ada unit conversion** pada fase ini. Costing juga tidak termasuk.

Aturan saldo dan movement:

- `stock_movements` adalah ledger append-only. Saldo item **tidak disimpan sebagai kolom**; `current_stock = Σ quantity_change` seluruh movement item tersebut, sehingga saldo selalu dapat direkonsiliasi dari ledger.
- Movement Phase 6 hanya `ADJUSTMENT` dengan `quantity_change` bertanda (positif masuk, negatif keluar), `reason` wajib, `membership_id` sebagai aktor, dan timestamp. Hard delete movement tidak tersedia.
- Adjustment berjalan dalam transaksi database dengan `lockForUpdate` pada baris item; saldo diperiksa di dalam lock. Adjustment yang menghasilkan saldo negatif ditolak `422` (mengikuti baseline D-10 yang masih menunggu persetujuan Product Owner).
- `idempotency_key` wajib UUID dan unik per Business (`unique (business_id, idempotency_key)`). Request ulang dengan key sama mengembalikan movement yang sama (`200`, bukan `201`) tanpa menambah baris; key yang sama untuk item lain ditolak `422`.
- Item dinonaktifkan dengan `PATCH is_active=false`, bukan dihapus, agar referensi movement historis tetap valid. Item nonaktif menolak adjustment baru tetapi masih dapat dibaca.
- Low stock: item dianggap low stock bila `low_stock_threshold` tidak null dan `current_stock <= low_stock_threshold`. Item tanpa threshold tidak pernah masuk low stock.

**Pengurangan stok dari penjualan belum diimplementasikan.** Belum ada mapping resmi produk → bahan/recipe (recipe/BOM adalah Phase 12A), sehingga checkout tidak mengubah stok. Penjualan biasa tetap berjalan meskipun merchant membuat item inventory; integrasi hanya boleh ditambahkan setelah aturan konsumsi disetujui.

| Method | Path | Permission | Keterangan |
|---|---|---|---|
| `GET` | `/api/v1/inventory` | `inventory.read` | Daftar item terpaginate; filter `outlet_id`, `q` (nama), `is_active`, `low_stock=true`. Non-owner hanya melihat outlet dalam cakupan aksesnya (D-05). Response memuat `current_stock` dan `is_low_stock`. |
| `POST` | `/api/v1/inventory` | `inventory.create` | Buat item: `outlet_id` (wajib, milik Business sendiri), `name`, `unit`, `low_stock_threshold` (nullable, ≥ 0), `is_active`. |
| `GET` | `/api/v1/inventory/{item}` | `inventory.read` | Detail item + saldo. `404` di luar Business, `403` bila outlet tidak dalam cakupan akses. |
| `PATCH` | `/api/v1/inventory/{item}` | `inventory.update` | Update `name`, `unit`, `low_stock_threshold`, `is_active`. Tidak ada perubahan outlet atau hard delete. `unit` tidak dapat diubah setelah item memiliki movement (agar arti kuantitas ledger tidak berubah). |
| `GET` | `/api/v1/inventory/{item}/movements` | `inventory.read` | Ledger movement item terpaginate, terbaru lebih dulu. |
| `POST` | `/api/v1/inventory/{item}/adjustments` | `inventory.adjust` | Adjustment stok: `quantity_change` (integer ≠ 0), `reason` (wajib), `idempotency_key` (UUID). New movement `201`; replay key sama `200`. Saldo negatif, item nonaktif, atau key lintas item ditolak `422`. |

Permission `inventory.create` dan `inventory.update` ditambahkan pada Phase 6 karena katalog D-03 sebelumnya hanya memuat `inventory.read`, `inventory.adjust`, dan `inventory.stock_opname`. `inventory.stock_opname` belum dipakai; stock opname/waste termasuk Phase 12B. Penambahan permission ini disetujui bersama D-32.
