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
/api/v1/menus
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
