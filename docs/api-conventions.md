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

- Endpoint yang dilindungi memerlukan token; mekanisme token ditetapkan pada Phase 1 (Identity).
- Business/outlet context diambil dari membership terautentikasi di backend, tidak pernah dari input client (lihat ADR-0002).
- Setiap endpoint tenant-owned wajib memiliki test isolasi lintas tenant.

## 5. Endpoint fondasi

| Method | Path | Auth | Keterangan |
| --- | --- | --- | --- |
| GET | `/api/v1/health` | Tidak | Status API + konektivitas database & cache |
| GET | `/up` | Tidak | Health check runtime (bawaan Laravel) |

## 6. Pagination dan limit

- Endpoint list berpotensi besar wajib dipaginasi dengan batas maksimum `per_page`.
- Hindari query tanpa batas dan N+1 (gunakan eager loading).
