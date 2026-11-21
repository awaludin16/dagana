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

Verifikasi email hanya diwajibkan untuk akun self-register (Owner): selama `email_verified_at` masih `null`, `EnsureEmailVerified` menolak endpoint bisnis dengan 403; akun employee yang dibuat Owner otomatis terverifikasi. Tautan verifikasi/reset di email mengarah ke halaman admin-web yang meneruskan parameternya ke endpoint API (keputusan email 2026-11-18).

| Method | Path | Auth | Keterangan |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | publik, throttle 6/menit | Membuat user dan bearer token untuk mobile; tidak membuat business. |
| `POST` | `/api/v1/auth/login` | publik, throttle 6/menit | Menukar kredensial dengan bearer token untuk mobile. |
| `POST` | `/api/v1/auth/logout` | bearer | Menghapus token yang sedang dipakai; `204`. |
| `POST` | `/api/v1/auth/web/register` | publik, throttle 6/menit | Membuat user dan session web; response tidak memuat token. |
| `POST` | `/api/v1/auth/web/login` | publik, throttle 6/menit | Membuat session web; response tidak memuat token. |
| `POST` | `/api/v1/auth/web/logout` | session | Menghapus session web; `204`. |
| `POST` | `/api/v1/auth/forgot-password` | publik, throttle 10/menit | Selalu `200` dengan pesan sama (anti email-enumeration); kirim tautan reset ke email terdaftar. |
| `POST` | `/api/v1/auth/reset-password` | publik, throttle 10/menit | Validasi token reset, ganti password, cabut semua API token user. |
| `GET` | `/api/v1/auth/email/verify/{id}/{hash}` | publik, middleware `signed` | Verifikasi email via tautan bertanda tangan (kedaluwarsa 60 menit); tanpa auth. |
| `POST` | `/api/v1/auth/email/verification-notification` | bearer atau session, throttle 6/menit | Kirim ulang email verifikasi untuk user yang belum terverifikasi. |
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

Business hanya menyimpan `name`. Outlet menyimpan `name` (wajib), `phone` (wajib sejak 2026-11-16, dinormalisasi ke digit saja lalu divalidasi 10–13 digit), dan alamat komposit `address` (`street`, `village`, `district`, `regency`, `province`, `postal_code`) yang **seluruhnya wajib** sejak 2026-11-16 (lihat decision log). Pada onboarding, `business` hanya memuat `name`; `phone` dan alamat hanya dikirim di `outlet`. Pada `PATCH` outlet, `address` boleh tidak dikirim (tidak berubah), tetapi bila dikirim harus lengkap; `phone` tidak dapat dikosongkan.

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

`members.delete` menghapus record membership secara permanen, tetapi mempertahankan user untuk atribusi historis. Owner tidak dapat dihapus melalui endpoint ini. Member yang masih menjadi referensi data historis (order, pembayaran, sesi kas, atau kas masuk/keluar) ditolak `422`; gunakan `PATCH` dengan field `status` untuk mencabut akses sementara agar membership dan outlet access dapat diaktifkan kembali.

`POST /members` dan `PATCH /members/{membership}` menerima field opsional `extra_permissions` (array izin `resource.action` dari katalog D-03, revisi D-04 2026-11-17): izin tambahan di luar preset role; mengirim daftar berarti mengganti seluruh izin tambahan member (izin dicabut dengan menghapusnya dari daftar). Hanya Owner yang dapat mengirim field ini (aktor lain → `403`). Izin preset role yang dikirim ulang atau izin di luar katalog ditolak `422`. Response `MemberResource` menambahkan `extra_permissions` (daftar izin tambahan) di samping `permissions` (izin efektif = preset ∪ extra).

`GET /api/v1/members` mengembalikan seluruh membership Business tanpa parameter pagination; diterima Product Owner (2026-11-16) sebagai pengecualian kecil dari aturan pagination umum karena jumlah membership per Business terbatas pada MVP.

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
| `GET` | `/api/v1/products` | `products.read` | Paginated; filter `category_id`, `is_active`, `is_available`, `q` (nama), dan `outlet_id` opsional (D-37/D-38/D-39). Jika `outlet_id` dikirim, `is_available` dihitung efektif untuk outlet tersebut dan response menyertakan `is_available_at_outlet`, `stock_quantity` (`null` = tanpa batas), `low_stock_threshold`, dan `low_stock`. |
| `POST` | `/api/v1/products` | `products.create` | Body: `name` (wajib), `price` (wajib, integer ≥ 0), `category_id` (nullable, wajib milik Business sendiri), `is_active`, `is_available`. Opsional untuk satu outlet: `initial_stock` dan `initial_stock_outlet_id` (wajib berpasangan) membuat baris stok awal + movement `Stok awal`. |
| `GET` | `/api/v1/products/{id}` | `products.read` | `404` bila di luar Business. Menerima `outlet_id` opsional seperti list. |
| `PATCH` | `/api/v1/products/{id}` | `products.update` | Update `name`, `price`, `category_id`, `is_active`, `is_available` (master switch Business). Response selalu menyertakan `category`. |
| `PATCH` | `/api/v1/products/{id}/stock` | `products.update_stock` | Body: `outlet_id` (wajib, milik Business + dalam akses outlet), `quantity` (wajib, `number \| null`), `low_stock_threshold` (opsional, `number \| null`), `reason` (opsional). `quantity: null` menghapus baris stok dan menolak threshold non-null dengan `422`. Response menyertakan `stock_quantity`, `low_stock_threshold`, dan `low_stock` untuk outlet tersebut. |
| `DELETE` | `/api/v1/products/{id}` | `products.delete` | Hard delete hanya bila produk belum punya `order_items`; `422` bila sudah ada histori (gunakan `PATCH is_active=false`). |

**Ketersediaan per outlet (D-39):** `products.is_available` adalah master switch Business. Tidak ada override ketersediaan per outlet. `is_available_at_outlet` = `is_available && (stok tidak dipantau ATAU quantity != 0)`; checkout lewat `Product::sellable($outletId)` menambahkan `is_active = true`. Menu yang habis di outlet A tetap dapat dijual di outlet B dan sebaliknya. Kasier menandai habis lewat stok 0 dengan `products.update_stock`; mengubah master produk tetap memerlukan `products.update`.

**Stok numerik opsional (D-37):** stok per menu disimpan di `product_stocks` per outlet. Tidak ada baris = tanpa batas; `quantity = 0` = habis. `Product::sellable($outletId)` dan filter `is_available=true` juga menolak/menyembunyikan menu dengan stok 0. Checkout mengunci baris stok, mengagregasi item duplikat, menolak stok tidak cukup dengan `422 items`, lalu memotong stok dan menulis satu movement `sale` per menu per order dalam transaksi yang sama. Penyesuaian manual dan untrack (`quantity: null`) ditulis ke `product_stock_movements` dengan tipe `adjustment`. Permission `products.update_stock` diberikan ke OWNER/MANAGER/CASHIER (D-39) dan tetap memeriksa akses outlet. Ledger belum memiliki endpoint baca; pelaporan/refund stok belum masuk scope.

**Stok awal dan batas menipis (D-38):** `POST /products` menerima `initial_stock` + `initial_stock_outlet_id` hanya bila keduanya hadir; outlet divalidasi milik Business dan dalam akses user. Baris stok dibuat bersama produk dan movement `Stok awal` dalam satu transaksi. `product_stocks.low_stock_threshold` nullable dengan default **10 porsi** yang dimaterialisasi saat stok pertama kali diset (baris lama di-backfill). `low_stock = quantity <= threshold`; `0` menonaktifkan peringatan. Batas tidak dapat diatur tanpa stok yang dipantau. UI katalog memakai kolom `Stok` terpisah dan badge `Menipis`; status tetap menampilkan `Aktif`/`Nonaktif` plus label efektif menurut D-39. Belum ada filter `?low_stock=true`, ringkasan dashboard, atau notifikasi aktif.

**Stok sebagai penentu habis (D-39):** D-35 dibatalkan penuh. Tabel `product_outlet_availabilities`, endpoint availability, permission `products.update_availability`, field `unavailable_reason`, dan toggle jeda dihapus oleh migration `2026_11_21_000200_drop_product_outlet_availabilities_table.php`. `is_available_at_outlet` dihitung dari master switch dan stok outlet; UI memakai `Habis di semua outlet`, `Habis di outlet ini`, atau `Tersedia di outlet ini`. Kasier memperoleh `products.update_stock` dan menetapkan stok 0 untuk menandai habis. Migration tidak melakukan backfill override lama ke stok 0 agar angka stok tidak rusak.

Pagination memakai parameter `per_page` (default `20`, maksimum `100`) dan `page`, dengan envelope standar Laravel (`data` + `meta`/`links`). List endpoint selalu ter-scope ke Business membership yang aktif; `403` untuk permission/membership tidak sah, `404` untuk resource di luar Business, `422` untuk validasi.

**Kontrak snapshot nama/harga untuk Phase 4 (wajib diterapkan Order Engine):**

1. Saat order dibuat, tiap order item menyimpan snapshot `product_id`, `name`, dan `price` saat transaksi (plus field lain yang diperlukan receipt). Perubahan `name`/`price` catalog kemudian hari tidak boleh mengubah data order yang sudah tersimpan; jalur pembacaan receipt/histori mengambil nilai snapshot, bukan nilai catalog saat ini.
2. Checkout backend wajib mengambil ulang menu dari database melalui scope `App\Models\Product::sellable()` (`is_active = true AND is_available = true`, ditambah guard stok 0 bila `outlet_id` dikirim), menghitung total dari harga snapshot tersebut, dan tidak pernah mempercayai `price`/`is_active`/`is_available`/`product_id` dari client. Menu nonaktif/tidak tersedia atau stoknya tidak cukup gagal checkout dengan `422`.
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

## 12. Phase 7 contract — Reporting

Reporting MVP bersifat read-only dan dihitung langsung dari data transaksi (orders, payments, cash ledger) pada `app/Domain/Report/ReportService.php`; tidak ada tabel agregat, tidak ada penghitungan ulang dari harga catalog terkini, dan bukan accounting penuh.

Definisi agregasi (baseline D-33):

- **Penjualan** = order dengan status `PAID`. Nilai = snapshot `orders.total_amount`. Tanggal transaksi = tanggal konfirmasi pembayaran `PAID` pertama (`MIN(payments.paid_at)`), sehingga satu order dihitung tepat satu kali walau memiliki lebih dari satu payment. `PENDING`, `FAILED`, `CANCELLED`, dan payment `REFUNDED`/`PARTIALLY_REFUNDED` tidak dihitung sebagai penjualan (refund belum didukung, D-30).
- **Laporan payment** memakai basis tanggal pencatatan payment (`payments.created_at`). `by_method` hanya payment `PAID` (total + jumlah transaksi per metode); `by_status` memuat semua status yang ada (termasuk `PENDING`/`FAILED`) sehingga pending/failed tidak pernah menyatu ke angka paid.
- **Laporan operator** = agregasi order `PAID` per membership operator (`orders.membership_id`), basis tanggal sama dengan sales, diurutkan dari total terbesar.
- **Cash reconciliation** = daftar Cash Session dengan `opened_at` dalam rentang: `opening_cash`, arus ledger per tipe (`CASH_SALE`, `CASH_IN`, `CASH_OUT`, `REFUND`, `ADJUSTMENT`), `net_movement`, `expected_cash = opening_cash + net_movement` (formula Phase 5), `actual_cash`, dan `variance = actual_cash - expected_cash`; session `OPEN` masih `null` pada actual/variance.
- **Periode** mengikuti jam aplikasi (`config app.timezone` = **Asia/Jakarta**, keputusan Product Owner 2026-11-11): `from`/`to` wajib (`YYYY-MM-DD`), `from <= to`, maksimal 92 hari. Batas hari laporan adalah batas hari WIB, sesuai jam operasional outlet Indonesia.

Semua endpoint memakai permission `reports.read` (CASHIER tidak memilikinya pada katalog D-03, sehingga laporan hanya OWNER/MANAGER), scope Business dari membership, dan batasan outlet akses (D-05): OWNER melihat semua outlet Business, non-owner hanya outlet yang diberi akses; `outlet_id` di luar cakupan → `403`.

| Method | Path | Permission | Keterangan |
|---|---|---|---|
| `GET` | `/api/v1/reports/sales` | `reports.read` | Params: `from`, `to` (wajib), `outlet_id`, `per_page`. Response: `summary` (`sales_total`, `transactions`) dan `days` per tanggal dalam rentang (hari tanpa transaksi tetap muncul dengan nilai 0; `average_order_value` dibulatkan ke bawah, `null` bila 0 transaksi). |
| `GET` | `/api/v1/reports/payments` | `reports.read` | Params: `from`, `to`, `outlet_id`. Response: `by_method` (PAID saja) dan `by_status` (semua bucket). |
| `GET` | `/api/v1/reports/operators` | `reports.read` | Params: `from`, `to`, `outlet_id`, `per_page`. Response terpaginate: `membership_id`, `operator_name`, `transactions`, `sales_total`. |
| `GET` | `/api/v1/reports/cash` | `reports.read` | Params: `from`, `to`, `outlet_id`, `per_page`. Response terpaginate per session termasuk `movements_by_type`. |

Endpoint list terbatas pagination (`per_page` 1–100, default 20) atau lebar rentang (≤ 92 hari), sehingga response tidak terbuka. Validasi rentang dilaporkan `422` untuk parameter kurang, `from > to`, atau rentang > 92 hari.
