# ADR-0005: Autentikasi SPA Berbasis Session Cookie dengan Laravel Sanctum

- **Status:** Accepted
- **Tanggal:** 2026-10-15
- **Pemilik:** Engineering

## Context

Phase 1 (Identity, Business, Outlet) menuntut endpoint autentikasi untuk klien first-party: React admin (`apps/admin-web`) dan, nanti, Flutter POS (`apps/pos`). PRD memerlukan register, login, logout, dan profil pengguna tanpa menyebut mekanisme token secara eksplisit.

Opsi yang dipertimbangkan:

1. **Bearer token (Sanctum Personal Access Token)** — token opaque per perangkat, cocok untuk klien mobile/POS.
2. **Session cookie SPA (Sanctum stateful mode)** — cookie session + proteksi CSRF untuk klien browser first-party.
3. **Laravel Passport (OAuth2)** — paling lengkap, tetapi berat untuk kebutuhan MVP.
4. **Rollback ke mekanisme buatan sendiri** — ditolak; menghindari reinventing keamanan.

## Decision

Gunakan **Sanctum dalam mode SPA stateful**: autentikasi memakai **session cookie** (`web` guard) plus proteksi CSRF, bukan Bearer token. Konfigurasi:

- `$middleware->statefulApi()` di `apps/api/bootstrap/app.php` mengaktifkan `EnsureFrontendRequestsAreStateful` pada grup `api`.
- Domain stateful ditentukan `SANCTUM_STATEFUL_DOMAINS`; CORS memakai kredensial dengan origin eksplisit (`CORS_ALLOWED_ORIGINS`).
- SPA memanggil `GET /sanctum/csrf-cookie` (disediakan Sanctum) lalu mengirim header `X-XSRF-TOKEN` untuk request yang mengubah data.
- Route dilindungi middleware `auth:sanctum`, yang pada request stateful memakai user dari guard `web`.

Karena murni memakai mode stateful, tabel `personal_access_tokens` **tidak** dibuat pada Phase 1.

## Consequences

- Tidak ada token yang disimpan klien; sesi dicabut lewat logout/invalidasi session di Redis.
- Kredensial CORS harus eksplisit (tidak boleh `*`) ketika `supports_credentials=true`.
- Request lintas-origin dari SPA wajib mengirim `credentials: 'include'` dan header CSRF.
- Pengujian otentikasi perlu mengirim header `Origin` agar request dianggap stateful, atau memakai `actingAs`.
- **Flutter POS belum tercakup.** Cookie+CSRF kurang praktis untuk klien native tanpa cookie jar. Ini keputusan terbuka yang harus diselesaikan di Phase 4 (POS): menambah guard token (Sanctum PAT) untuk perangkat POS, atau menangani cookie+CSRF di klien Flutter.
- Belum ada verifikasi email dan reset password; keduanya di luar MVP Phase 1.

## Follow-up

- [ ] Putuskan strategi autentikasi perangkat untuk Flutter POS saat Phase 4 dimulai (kemungkinan menambah Sanctum PAT + tabel `personal_access_tokens`).
- [ ] Pertimbangkan email verification dan reset password sebelum produksi.
- [ ] Tetapkan kebijakan rotasi/expiry session untuk klien POS yang berjalan lama.
