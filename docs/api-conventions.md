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
| PATCH | `/api/v1/businesses/{business}` | Ya | Ubah setting business (permission `settings.update`) |
| GET | `/api/v1/businesses/{business}/outlets` | Ya | Daftar outlet (permission `outlets.read`) |
| POST | `/api/v1/businesses/{business}/outlets` | Ya | Buat outlet (permission `outlets.manage`) |
| GET | `/api/v1/outlets/{outlet}` | Ya | Detail outlet (perlu akses outlet) |
| PATCH | `/api/v1/outlets/{outlet}` | Ya | Ubah outlet (permission `outlets.manage` + akses outlet) |

## 6. Pagination dan limit

- Endpoint list berpotensi besar wajib dipaginasi dengan batas maksimum `per_page`.
- Hindari query tanpa batas dan N+1 (gunakan eager loading).
