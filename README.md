# Dagana

**Multi-Tenant POS & Ordering Platform**

POS untuk kasir, QR Ordering untuk pelanggan, dan Admin Dashboard untuk owner — terhubung oleh satu backend (Laravel · PostgreSQL · Redis) dengan prinsip *One platform, multiple channels, one source of truth*.

## Struktur Monorepo

```text
dagana/
├── apps/
│   ├── api/              # Backend Laravel 13 (Modular Monolith)
│   ├── admin-web/        # Admin Dashboard — React + Vite + TS + Tailwind v4
│   └── customer-web/     # QR Ordering — React + Vite + TS + Tailwind v4
├── docs/                 # PRD + dokumen teknis (domain model, ERD, API, RBAC, arsitektur)
├── infra/
│   └── docker/           # Dockerfile, compose.yaml, nginx.conf, php config
├── scripts/              # setup.sh / setup.ps1
└── .github/workflows/    # CI (test backend, build frontend)
```

Dokumentasi teknis lengkap di [`docs/`](docs/): [PRD](docs/Dagana_PRD_v0.1.md) · [Domain Modeling](docs/domain-modeling.md) · [ERD](docs/ERD.md) · [API Spec](docs/API-Specification.md) · [Auth & RBAC](docs/Authentication-RBAC.md) · [System Architecture](docs/System-Architecture.md) · [UI/UX Design System](docs/UI-UX-Design-System.md)

> **Design system:** tokens tema (warna, font, dsb.) — blok `@theme` di `src/index.css` —
> **identik** di `admin-web` dan `customer-web`; rujukan tunggal: `docs/UI-UX-Design-System.md`.
> Komponen UI dapat ditemukan di `src/components/ui/*` di kedua app.

## Status Phase

| Phase | Status |
|---|---|
| 0 — Foundation | ✅ baseline: monorepo, backend + auth JWT, tenant/outlet middleware, RBAC, RLS, catalog minimal, seeder demo, CI, 2 frontend |
| 1 — Catalog | ✅ Phase 1: CRUD produk (SKU/barcode/harga/variant), kategori, filter & soft-delete produk, UI admin (produk + kategori) dengan design system v1 |
| 2 — Inventory | 📋 terencana |
| 3 — POS | 📋 terencana |
| 4 — QR Ordering | 📋 terencana |
| 5 — Admin Dashboard | 📋 terencana |
| 6 — Stabilization | 📋 terencana |

## Prasyarat

| Tool | Versi |
|---|---|
| PHP + Composer | PHP ≥ 8.3, Composer 2 |
| Node.js | ≥ 20 |
| PostgreSQL | 14+ (wajib untuk RLS; tes lokal dapat pakai SQLite) |
| Redis | 6+ |

> **Nota driver:** driver PHP `pdo_pgsql` wajib aktif untuk PostgreSQL. Tes lokal memakai SQLite in-memory (`phpunit.xml`), jadi `php artisan test` tetap bisa jalan tanpa PostgreSQL.

> **Nota cache/queue dev:** `.env.example` menargetkan `CACHE_STORE=file` + `QUEUE_CONNECTION=sync` sehingga `php artisan serve` langsung jalan **tanpa Redis** (phpredis tidak wajib diinstal). `REDIS_*` & Reverb tetap tersedia untuk stack Docker penuh (`infra/docker/compose.yaml`) dan fase realtime.

## Menjalankan Backend (Laravel)

```bash
cd apps/api
cp .env.example .env
composer install
php artisan key:generate
# set nilai JWT_SECRET di .env (contoh):
#   php -r "echo bin2hex(random_bytes(32));"
php artisan migrate --seed    # schema + role/permission + tenant demo
php artisan test              # 26 test (auth, RBAC, isolasi tenant, catalog)
php artisan serve             # http://localhost:8000
```

Kredensial demo: **owner@dagana.test** / **password**

> **Catatan Windows:** Horizon membutuhkan `ext-pcntl` & `ext-posix` (hanya ada di Linux/Docker).
> `composer.json` sudah mendeklarasikannya di `config.platform`, jadi `composer install`
> tetap mulus. Reverb (WebSocket) juga sudah terpasang — service `reverb` & `worker`
> (Horizon) di `infra/docker/compose.yaml` siap dipakai fase realtime (Phase 3/4).

Konvensi request API (`docs/API-Specification.md`):
- `Authorization: Bearer <access_token>`
- `X-Tenant-Context: <uuid tenant>` (divalidasi via membership)
- `X-Outlet-Context: <uuid outlet>` (opsional)

## Menjalankan Frontend

```bash
# Admin Dashboard (http://localhost:5173, proxy /api → 8000)
cd apps/admin-web && npm install && npm run dev

# Customer Web (http://localhost:5174; placeholder Phase 4)
cd apps/customer-web && npm install && npm run dev
```

## Menjalankan Seluruh Stack (Docker)

```bash
docker compose -f infra/docker/compose.yaml up -d
# app      → http://localhost:8080
# reverb   → ws://localhost:8081
# minio    → http://localhost:9001 (console)
```

## CI

`.github/workflows/ci.yml`:
- **Backend**: PHP 8.3 + PostgreSQL 16 + Redis, `composer install`, `composer run lint` (Pint), `php artisan test`.
- **Frontend**: matrix `admin-web`/`customer-web`, `npm ci`, `npm run lint` (oxlint), `npx tsc -b`, `npm run build`.