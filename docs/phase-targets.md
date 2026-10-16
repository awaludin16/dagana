# Dagana — Target & Acceptance Criteria Fase

> **Status dokumen:** kriteria penerimaan per fase, diturunkan dari `docs/PRD-Dagana.md` §58, keputusan di `docs/decision-log.md`, dan ADR terkait. Dokumen ini tidak menetapkan aturan produk baru; ia merangkum apa yang harus benar sebelum sebuah fase dinyatakan selesai. Bila scope fase berubah, perbarui dokumen ini (aturan pemeliharaan `docs/decision-log.md` §10.4).

Kriteria diberi status:

- `[x]` terpenuhi dan terverifikasi oleh test/kode pada repo saat ini.
- `[ ]` belum terpenuhi.
- `(N/A)` tidak berlaku untuk fase tersebut.

Setiap kriteria yang menyentuh authorization, transaksi, atau multi-tenancy wajib memiliki test otomatis; test adalah bukti, bukan sekadar daftar harapan.

---

## Phase 0 — Foundation

Fokus: kerangka proyek, lingkungan development, dan health check.

- [x] Monorepo dengan Laravel API (modular monolith) di `apps/api` (ADR-0001).
- [x] Lingkungan development berbasis Docker (API + PostgreSQL + Redis) dengan konfigurasi development-only (`compose.yaml`, `docker/php/Dockerfile.dev`).
- [x] Nilai uang sebagai integer rupiah (ADR-0003); waktu disimpan UTC (ADR-0004).
- [x] Health check: `GET /api/v1/health` (database + cache) dan `/up` runtime.
- [x] Test health endpoint lulus.

## Phase 1 — Identity, Business, Outlet

Fokus: identitas user, konteks business, dan outlet, beserta tenant scoping.

- [x] Autentikasi SPA berbasis session cookie via Sanctum stateful (ADR-0005): register, login, logout, `me`.
- [x] Dokumentasi alur CSRF/SPA di `docs/api-conventions.md`.
- [x] `User -> Membership -> Business -> Outlet`; satu user dapat menjadi anggota banyak business (D-01, D-02).
- [x] Pembuatan business menghasilkan membership Owner dan opsional outlet pertama.
- [x] Tenant scoping: `business`/`outlet` di-resolve dari membership aktif, bukan input client (ADR-0002). Akses lintas tenant `404`.
- [x] Otorisasi outlet memeriksa permission **dan** akses outlet.
- [x] Test isolasi lintas tenant dan outlet access lulus.

## Phase 2 — Membership, Role, Permission

Fokus: pengelolaan employee, role preset, katalog permission, dan switch ke otorisasi berbasis permission.

- [x] Katalog permission final MVP mengikuti `docs/decision-log.md` D-03 (`App\Domain\Authorization\Enums\Permission`); `GET /api/v1/permissions` mengembalikannya.
- [x] Enam role preset (Owner, Manager, Cashier, Inventory, Kitchen, Staff) dipetakan ke permission di `config/authorization.php`; `GET /api/v1/roles` mengembalikan preset + permission bawaannya.
- [x] Custom role tidak disediakan pada MVP (D-04).
- [x] Pengelolaan membership: list, invite (user terdaftar via email, membership langsung `active`), update role/outlet access, disable, enable.
- [x] Owner memegang seluruh katalog + business-wide outlet access; grant outlet eksplisit untuk Owner diabaikan.
- [x] Outlet access eksplisit untuk non-Owner; outlet di luar cakupan `404`.
- [x] **Override permission per membership (D-04)**: tabel `membership_permissions` dengan effect `allow`/`deny`; permission efektif = `(preset ∪ allow) \ deny`; `deny` menang atas preset.
- [x] Override dikelola hanya oleh aktor ber-`permissions.manage_membership`.
- [x] **Anti-eskalasi**: aktor tidak dapat memberikan role atau permission yang tidak dimilikinya sendiri (`403`).
- [x] Override pada membership Owner diabaikan (Owner selalu memegang katalog penuh).
- [x] Setiap business menyisakan minimal satu Owner aktif; pelanggaran `409 Conflict`, dilindungi `lockForUpdate` pada baris business.
- [x] Employee bersifat opsional; tidak ada prasyarat employee untuk penjualan.
- [x] Resource membership mengekspos `permissions` (efektif), `preset_permissions`, `permission_grants`, `permission_denials`.
- [x] Test: permission granted/denied, override + anti-eskalasi, membership inactive, tenant isolation, akses outlet, invariant owner terakhir.

### Dependency terbuka setelah Phase 2 (bukan blocker fase)

- [ ] Audit log untuk perubahan membership/role/permission penting — menunggu modul Audit (Phase 11). Dicatat sebagai dependency di ADR-0006.
- [ ] Undangan berbasis email/token beserta infrastruktur mail/queue — ditunda; Phase 2 menargetkan user terdaftar.
- [ ] Pagination daftar membership — ditunda selama jumlah employee per business masih kecil; ditinjau kembali bila data bertambah.

---

## Cara memverifikasi

```bash
# Seluruh test
docker compose --env-file .env.docker exec api composer test

# Format
docker compose --env-file .env.docker exec api ./vendor/bin/pint
```

Fase dinyatakan **selesai** bila seluruh kriteria `[x]` untuk fase tersebut benar-benar dijalankan dan lulus, dependency terbuka tercatat (bukan disembunyikan), dan dokumentasi terkait (`api-conventions.md`, ADR, PRD) sudah sinkron.
