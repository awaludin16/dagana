# Dagana — API Conventions (v1)

Dokumen ini menetapkan konvensi permintaan/respons untuk REST API Dagana. Semua endpoint publik berada di bawah `/api/v1`. Konvensi ini melengkapi `docs/engineering-standards.md` §6.

## 1. Format dan versioning

- Semua endpoint publik berada di bawah prefix `/api/v1` (dikonfigurasi di `apps/api/bootstrap/app.php`).
- Konten request/response adalah JSON (`Content-Type: application/json`).
- Timestamp dikirim sebagai ISO 8601 UTC (contoh: `2026-10-14T07:30:00Z`).
- Nilai uang dikirim sebagai **integer rupiah** tanpa desimal (lihat ADR-0003).

## 2. Bentuk respons sukses

- **Satu resource:** dibungkus key `data`.
  ```json
  { "data": { "id": 1, "name": "Es Kopi Susu" } }
  ```
- **Koleksi:** memakai bentuk paginasi Laravel (`data`, `links`, `meta`) melalui API Resource.
  ```json
  {
    "data": [ { "id": 1 } ],
    "links": { "first": "...", "last": "...", "prev": null, "next": null },
    "meta": { "current_page": 1, "per_page": 20, "total": 1 }
  }
  ```
- Status HTTP: `200` sukses, `201` resource dibuat, `204` sukses tanpa body.

## 3. Bentuk respons error

Semua error memakai key `message`, dan `errors` bila ada detail per-field.

- **422 Validation:**
  ```json
  {
    "message": "The given data was invalid.",
    "errors": { "name": ["The name field is required."] }
  }
  ```
- **401 / 403 / 404 / 409 / 500:** `{ "message": "..." }`.

Aturan:
- Jangan pernah menampilkan stack trace, SQL, path internal, atau kredensial.
- Gunakan status HTTP yang benar; jangan mengembalikan `200` untuk operasi gagal.
- Error otentikasi/otorisasi tidak boleh membocorkan keberadaan atau isi data tenant lain.

## 4. Autentikasi dan otorisasi

Autentikasi memakai **session cookie SPA** melalui Laravel Sanctum mode stateful (lihat ADR-0005), bukan Bearer token pada Phase 1.

Alur klien SPA:

1. Panggil `GET /sanctum/csrf-cookie` (middleware `web`) untuk menerima cookie `XSRF-TOKEN`.
2. Kirim request dengan `credentials: 'include'` dan header `X-XSRF-TOKEN` untuk method yang mengubah data.
3. Panggil `POST /api/v1/auth/login` atau `POST /api/v1/auth/register`; session cookie akan diset.
4. Panggil `POST /api/v1/auth/logout` untuk mencabut session.

Aturan:

- Endpoint yang dilindungi memakai middleware `auth:sanctum`; request tanpa session valid menerima `401`.
- Business/outlet context diambil dari membership terautentikasi di backend, tidak pernah dari input client (lihat ADR-0002).
- `business_id`/`outlet_id` dari client tidak dipercaya; route model binding di-scope ke membership aktif dan mengembalikan `404` bila tidak dapat diakses.
- Setiap endpoint tenant-owned wajib memiliki test isolasi lintas tenant.
- Role bersifat preset permission; otorisasi memakai pengecekan permission eksplisit, bukan label role (lihat `config/authorization.php` dan `app/Domain/Authorization/Enums/Permission.php`).

## 5. Endpoint fondasi

| Method | Path | Auth | Keterangan |
| --- | --- | --- | --- |
| GET | `/api/v1/health` | Tidak | Status API + konektivitas database & cache |
| GET | `/up` | Tidak | Health check runtime (bawaan Laravel) |
| GET | `/sanctum/csrf-cookie` | Tidak | Menyetel cookie CSRF untuk SPA |
| POST | `/api/v1/auth/register` | Tidak | Registrasi user; otomatis login (throttle 6/menit) |
| POST | `/api/v1/auth/login` | Tidak | Login user (throttle 6/menit) |
| POST | `/api/v1/auth/logout` | Ya | Logout + invalidasi session |
| GET | `/api/v1/me` | Ya | Profil user + membership (business, outlet, permission) |
| GET | `/api/v1/businesses` | Ya | Daftar business milik user |
| POST | `/api/v1/businesses` | Ya | Buat business + owner membership (+ outlet pertama opsional) |
| GET | `/api/v1/businesses/{business}` | Ya | Detail business (owner anggota) |
| PATCH | `/api/v1/businesses/{business}` | Ya | Ubah business (permission `business.update`) |
| GET | `/api/v1/businesses/{business}/outlets` | Ya | Daftar outlet (permission `outlets.read`) |
| POST | `/api/v1/businesses/{business}/outlets` | Ya | Buat outlet (permission `outlets.create`) |
| GET | `/api/v1/outlets/{outlet}` | Ya | Detail outlet (permission `outlets.read` + akses outlet) |
| PATCH | `/api/v1/outlets/{outlet}` | Ya | Ubah outlet (permission `outlets.update` + akses outlet) |
| POST | `/api/v1/outlets/{outlet}/disable` | Ya | Nonaktifkan outlet tanpa menghapus histori (permission `outlets.disable`) |
| POST | `/api/v1/outlets/{outlet}/enable` | Ya | Aktifkan kembali outlet (permission `outlets.disable`) |
| GET | `/api/v1/roles` | Ya | Katalog role preset + permission bawaannya (katalog statis; dibaca semua user terautentikasi) |
| GET | `/api/v1/permissions` | Ya | Katalog permission final MVP (katalog statis; dibaca semua user terautentikasi) |
| GET | `/api/v1/businesses/{business}/members` | Ya | Daftar membership dan undangan dengan pagination (permission `members.read`) |
| POST | `/api/v1/businesses/{business}/invitations` | Ya | Buat undangan employee melalui email/token (permission `members.invite`) |
| POST | `/api/v1/businesses/{business}/invitations/{invitation}/resend` | Ya | Rotasi token dan kirim ulang undangan (permission `members.invite`) |
| POST | `/api/v1/businesses/{business}/invitations/{invitation}/cancel` | Ya | Batalkan undangan pending (permission `members.invite`) |
| POST | `/api/v1/invitations/accept` | Ya | Terima undangan setelah login/register; email akun harus cocok (membuat membership `active`, `201`) |
| PATCH | `/api/v1/businesses/{business}/members/{membership}` | Ya | Ubah role, outlet access, dan/atau override permission (permission `members.update`, plus `permissions.manage_membership` bila override diubah) |
| POST | `/api/v1/businesses/{business}/members/{membership}/disable` | Ya | Nonaktifkan membership (permission `members.disable`) |
| POST | `/api/v1/businesses/{business}/members/{membership}/enable` | Ya | Aktifkan kembali membership (permission `members.update`) |
| GET/POST | `/api/v1/businesses/{business}/categories` | Ya | Daftar kategori terpaginasikan / membuat kategori (`categories.read` / `categories.create`) |
| GET | `/api/v1/businesses/{business}/categories/{category}` | Ya | Detail kategori (`categories.read`) |
| PATCH | `/api/v1/businesses/{business}/categories/{category}` | Ya | Mengubah kategori (`categories.update`) |
| POST | `/api/v1/businesses/{business}/categories/{category}/disable` | Ya | Menonaktifkan kategori tanpa menghapus histori (`categories.archive`) |
| POST | `/api/v1/businesses/{business}/categories/{category}/enable` | Ya | Mengaktifkan kembali kategori (`categories.archive`) |
| GET/POST | `/api/v1/businesses/{business}/menus` | Ya | Daftar menu terpaginasikan / membuat menu (`products.read` / `products.create`) |
| GET | `/api/v1/businesses/{business}/menus/{menu}` | Ya | Detail menu (`products.read`) |
| PATCH | `/api/v1/businesses/{business}/menus/{menu}` | Ya | Mengubah menu, harga, kategori, atau ketersediaan (`products.update`) |
| POST | `/api/v1/businesses/{business}/menus/{menu}/disable` | Ya | Menonaktifkan menu tanpa menghapus histori (`products.archive`) |
| POST | `/api/v1/businesses/{business}/menus/{menu}/enable` | Ya | Mengaktifkan kembali menu (`products.archive`) |
| GET | `/api/v1/outlets/{outlet}/categories` | Ya | Kategori aktif untuk katalog POS; outlet harus aktif dan dapat diakses |
| GET | `/api/v1/outlets/{outlet}/menus` | Ya | Menu aktif dan tersedia untuk outlet yang diakses; harga berlaku di seluruh outlet Business |
| GET/POST | `/api/v1/outlets/{outlet}/orders` | Ya | Riwayat transaksi terpaginasikan / checkout (`orders.read` / `orders.create` + `payments.create`) |
| GET | `/api/v1/outlets/{outlet}/orders/{order}` | Ya | Detail order dan receipt berbasis snapshot (`orders.read`) |
| POST | `/api/v1/outlets/{outlet}/orders/{order}/confirm-payment` | Ya | Konfirmasi manual payment `PENDING` (`payments.create`) |

Catatan employee management:

- Katalog permission dan enam role preset (Owner, Manager, Cashier, Inventory, Kitchen, Staff) bersifat **final untuk MVP**; custom role di luar scope. Katalog mengikuti `docs/decision-log.md` D-03; lihat PRD §15.
- Permission `roles.read`/`permissions.read` tersedia di katalog untuk gating UI fase berikutnya; endpoint katalog `/roles` dan `/permissions` saat ini dapat dibaca semua user terautentikasi karena isinya konfigurasi statis, bukan data tenant.
- Flow invite menerima email terdaftar maupun belum terdaftar. Undangan menyimpan hash token acak, berlaku terbatas, sekali pakai, terikat ke email/business, dan membership baru dibuat setelah penerima login/register lalu menerima token. Jangan membuat password atau akun atas nama employee, dan jangan menyimpan token mentah.
- Pengiriman email sinkron menggunakan mailer environment yang dikonfigurasi; error pengiriman harus terlihat dan undangan tidak boleh dilaporkan terkirim bila delivery gagal.
- Daftar anggota dan outlet memakai pagination Laravel (`data`, `links`, `meta`); `per_page` dibatasi maksimal 100. Endpoint anggota menerima filter status opsional. Endpoint outlet menerima filter status (`active`, `disabled`, `all`), default `active`.
- Outlet dinonaktifkan, bukan dihapus permanen. Endpoint operasi baru harus menolak outlet nonaktif; resource operasional lama tetap mempertahankan referensi dan histori.
- Nama outlet unik per business setelah spasi tepi dihapus dan tanpa membedakan huruf besar/kecil; validasi aplikasi dan unique index database menjaga aturan ini termasuk pada request bersamaan.
- `outlet_ids` hanya berlaku untuk role non-Owner; Owner selalu memiliki business-wide outlet access sehingga grant outlet eksplisit diabaikan.
- Sebuah business wajib menyisakan **minimal satu Owner aktif**. Upaya menurunkan role atau menonaktifkan Owner terakhir ditolak dengan `409 Conflict`.
- `{membership}` di-scope ke `{business}` melalui route model binding; membership milik tenant lain menghasilkan `404`.

### 5.1 Catalog (Phase 3)

- Endpoint catalog mengambil Business dari route yang terikat ke membership aktif; `business_id` tidak diterima dari payload. Resource yang bukan milik Business pada URL menghasilkan `404`.
- Menu dapat tidak memiliki kategori. Kategori yang dipilih harus aktif dan milik Business yang sama. Harga adalah integer rupiah positif; `is_available` adalah boolean tingkat Business, bukan jadwal atau override outlet.
- Daftar kategori/menu Business menerima `page` dan `per_page` (default 20, maksimum 100) serta mengembalikan pagination Laravel. Daftar manajemen menerima `status=active|disabled|all` (default `active`); menu juga mendukung pencarian nama tanpa membedakan kapital (maksimum 100 karakter) dan `category_id`. Daftar menu POS menggunakan default `per_page=20`, sedangkan kategori POS menggunakan `per_page=100`; keduanya maksimal 100.
- Endpoint POS `/outlets/{outlet}/menus` memeriksa outlet aktif, akses outlet, dan permission baca; hasilnya hanya menu `status=active` dan `is_available=true`. Kategori POS hanya menampilkan kategori aktif.
- Kategori/menu dinonaktifkan tanpa menghapus record. Menonaktifkan kategori hanya menghilangkan kategorinya dari filter POS; menu di dalamnya tidak otomatis dinonaktifkan. Ketersediaan menu dapat diubah dengan `PATCH` melalui `is_available`.

### 5.2 Sales dan Payment (Phase 4)

- Checkout menerima `payment_method` (`cash`, `qr_payment`, `bank_transfer`, `debit`, `credit`) dan array `items` berisi `menu_id` serta `quantity`. Total atau harga dari client tidak digunakan. Server memuat ulang menu aktif/tersedia milik Business outlet dan menghitung total integer rupiah.
- Header `Idempotency-Key` wajib (16–128 karakter), unik dalam scope Business + Outlet. Retry dengan key dan payload yang sama mengembalikan order semula (`200`); key sama dengan payload berbeda menghasilkan `409`. Payload yang di-hash mencakup method dan pasangan menu/quantity; harga tetap berasal dari checkout awal.
- Checkout menulis order, snapshot item, dan payment dalam satu transaksi. Cash langsung membuat order/payment `PAID`; metode lain membuat `PENDING_PAYMENT`/`PENDING`. Order item menyimpan nama menu, quantity, harga satuan, dan line total ketika checkout.
- Transisi yang tersedia: `PENDING_PAYMENT`/`PENDING` → `PAID` hanya melalui checkout cash atau endpoint `confirm-payment` yang memeriksa `payments.create`, outlet access, dan status order/payment. Konfirmasi order yang sudah ada tetap diizinkan pada outlet nonaktif; outlet nonaktif tidak dapat menerima checkout baru. Konfirmasi mengisi actor dan waktu; request tidak menerima field status. Endpoint ini adalah konfirmasi manual operator, bukan bukti provider/webhook.
- Integrasi gateway, webhook, Cash Session, dan proses refund belum termasuk Phase 4. Status PRD `FAILED`, `REFUNDED`, dan `PARTIALLY_REFUNDED` belum memiliki transisi API.
- `GET /outlets/{outlet}/orders` memakai pagination Laravel, default `per_page=20`, maksimum 100. Detail order menjadi receipt dasar dan menampilkan snapshot item, nilai payment, serta timestamp, bukan relasi catalog terkini.

### 5.3 Override permission per membership (D-04)

`POST` dan `PATCH` membership menerima dua field opsional:

```json
{
  "permission_grants": ["reports.export"],
  "permission_denials": ["payments.create"]
}
```

- Permission efektif membership = `(preset role ∪ permission_grants) \ permission_denials`. `permission_denials` selalu menang atas preset.
- Mengubah override memerlukan permission `permissions.manage_membership` sebagai tambahan `members.update`.
- **Anti-eskalasi:** aktor hanya boleh memberikan role atau permission yang dimilikinya sendiri; jika tidak, respons `403`.
- Satu permission tidak boleh muncul sekaligus di `permission_grants` dan `permission_denials` (`422`).
- Nilai permission di luar katalog D-03 ditolak (`422`).
- Membership **Owner** selalu memegang seluruh katalog; override pada Owner diabaikan.
- Respons membership menyertakan `permissions` (efektif), `preset_permissions`, `permission_grants`, dan `permission_denials`.


## 6. Pagination dan limit

- Endpoint list berpotensi besar wajib dipaginasi dengan batas maksimum `per_page`.
- Daftar anggota dan outlet menerima `page` serta `per_page` (default 20, maksimum 100) dan mengembalikan bentuk Laravel `data`, `links`, `meta`.
- Parameter `status` hanya menerima nilai yang didokumentasikan untuk endpoint; input tidak valid menerima `422`.
- Hindari query tanpa batas dan N+1 (gunakan eager loading).
