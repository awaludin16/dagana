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
| GET | `/api/v1/roles` | Ya | Katalog role preset + permission bawaannya (katalog statis; dibaca semua user terautentikasi) |
| GET | `/api/v1/permissions` | Ya | Katalog permission final MVP (katalog statis; dibaca semua user terautentikasi) |
| GET | `/api/v1/businesses/{business}/members` | Ya | Daftar membership employee (permission `members.read`) |
| POST | `/api/v1/businesses/{business}/members` | Ya | Tambah employee terdaftar via email (permission `members.invite`) |
| PATCH | `/api/v1/businesses/{business}/members/{membership}` | Ya | Ubah role, outlet access, dan/atau override permission (permission `members.update`, plus `permissions.manage_membership` bila override diubah) |
| POST | `/api/v1/businesses/{business}/members/{membership}/disable` | Ya | Nonaktifkan membership (permission `members.disable`) |
| POST | `/api/v1/businesses/{business}/members/{membership}/enable` | Ya | Aktifkan kembali membership (permission `members.update`) |

Catatan employee management:

- Katalog permission dan enam role preset (Owner, Manager, Cashier, Inventory, Kitchen, Staff) bersifat **final untuk MVP**; custom role di luar scope. Katalog mengikuti `docs/decision-log.md` D-03; lihat PRD §15.
- Permission `roles.read`/`permissions.read` tersedia di katalog untuk gating UI fase berikutnya; endpoint katalog `/roles` dan `/permissions` saat ini dapat dibaca semua user terautentikasi karena isinya konfigurasi statis, bukan data tenant.
- Flow invite Fase 2 menargetkan **user Dagana yang sudah terdaftar** (dicari via `email`) dan langsung membuat membership `active`. Undangan berbasis email/token serta infrastruktur mail adalah pekerjaan lanjutan.
- `outlet_ids` hanya berlaku untuk role non-Owner; Owner selalu memiliki business-wide outlet access sehingga grant outlet eksplisit diabaikan.
- Sebuah business wajib menyisakan **minimal satu Owner aktif**. Upaya menurunkan role atau menonaktifkan Owner terakhir ditolak dengan `409 Conflict`.
- `{membership}` di-scope ke `{business}` melalui route model binding; membership milik tenant lain menghasilkan `404`.

### 5.1 Override permission per membership (D-04)

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
- Hindari query tanpa batas dan N+1 (gunakan eager loading).
