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

Autentikasi memakai Laravel Sanctum personal access token (`Authorization: Bearer <token>`). Token hanya dikembalikan sekali pada register/login dan disimpan client di secure storage. Semua response resource memakai envelope `data`.

| Method | Path | Auth | Keterangan |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | publik, throttle 6/menit | Membuat user dan token; tidak membuat business. |
| `POST` | `/api/v1/auth/login` | publik, throttle 6/menit | Menukar kredensial dengan token. |
| `POST` | `/api/v1/auth/logout` | bearer | Menghapus token yang sedang dipakai; `204`. |
| `GET` | `/api/v1/me` | bearer | Profil user; tidak memuat password/remember token. |
| `POST` | `/api/v1/businesses` | bearer | Onboarding atomik: business + outlet pertama + owner membership. |
| `GET` | `/api/v1/businesses/{business}` | bearer, membership aktif | 404 bila business bukan milik user. |
| `PATCH` | `/api/v1/businesses/{business}` | bearer, membership aktif | Update pengaturan dasar business. |
| `GET` | `/api/v1/outlets` | bearer, membership aktif | Hanya outlet milik business user. |
| `GET` | `/api/v1/outlets/{outlet}` | bearer, membership aktif | 404 bila outlet di luar scope. |
| `PATCH` | `/api/v1/outlets/{outlet}` | bearer, membership aktif | Update pengaturan dasar outlet. |

Field pengaturan dasar: `name` wajib; `phone` dan `address` opsional. Contoh onboarding:

```json
{
  "business": { "name": "Warung Budi", "phone": "081234567890", "address": "Jl. Merdeka No. 1" },
  "outlet": { "name": "Outlet Pusat", "phone": "081298765432", "address": "Jl. Merdeka No. 1" }
}
```

Response sukses onboarding (`201`):

```json
{
  "data": {
    "business": { "id": 1, "name": "Warung Budi", "phone": "081234567890", "address": "Jl. Merdeka No. 1" },
    "outlet": { "id": 1, "business_id": 1, "name": "Outlet Pusat", "phone": "081298765432", "address": "Jl. Merdeka No. 1" }
  }
}
```

Error yang dipakai: `401` tanpa token valid, `404` untuk resource di luar scope tenant (tanpa membocorkan keberadaannya), `422` untuk validasi termasuk user yang sudah punya business, dan `429` untuk throttle register/login. Bentuk error validasi mengikuti default Laravel `{ "message": ..., "errors": { ... } }`.

## 8. Phase 2 contract — membership, role, permission

Authorization memakai middleware `permission:<resource.action>` yang memeriksa membership aktif dan permission preset. Tidak ada custom role atau permission override. `403` dipakai bila membership tidak aktif atau permission tidak dimiliki; `404` dipakai bila resource di luar Business/Outlet scope agar keberadaan data tenant lain tidak terbocorkan.

| Method | Path | Permission | Keterangan |
|---|---|---|---|
| `GET` | `/api/v1/me` | bearer | Menambahkan `data.membership` berisi role, status, `business`, `outlets`, dan permission efektif. `null` bila user belum punya membership. |
| `GET` | `/api/v1/members` | `members.read` | Daftar membership pada Business user, termasuk Owner. |
| `POST` | `/api/v1/members` | `members.invite` | Membuat akun employee dan membership aktif langsung. Role hanya `MANAGER` atau `CASHIER`. |
| `PATCH` | `/api/v1/members/{membership}` | `members.update` | Ubah role preset dan/atau set outlet access. |
| `DELETE` | `/api/v1/members/{membership}` | `members.remove` | Menonaktifkan membership (`INACTIVE`), menghapus outlet access, dan mencabut token. Record membership dipertahankan. |
| `GET` | `/api/v1/roles` | `members.read` | Katalog tiga role preset beserta permission-nya untuk kebutuhan UI. |

Owner memiliki seluruh permission katalog dan akses ke semua outlet secara implisit. Manager dan Cashier hanya dapat mengakses outlet yang tercatat di `outlet_accesses`. Manager tidak dapat mengubah/menghapus Owner, mengubah aksesnya sendiri, memberi role `OWNER`, atau memberi outlet access di luar outlet yang ia akses. Owner tidak dapat diubah melalui endpoint member karena Business harus tetap memiliki tepat satu Owner.

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
