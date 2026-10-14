# Dagana

Dagana adalah **F&B Business Operating Platform**: POS, order, payment, cash session, basic inventory, dan reporting dalam satu backend dan satu source of truth.

- Product specification: `docs/PRD-Dagana.md`
- Aturan untuk coding agent: `AGENTS.md`
- Standar engineering: `docs/engineering-standards.md`
- Lingkungan development: `docs/development-environment.md`
- Konvensi API: `docs/api-conventions.md`
- Architecture Decision Records: `docs/adr/`

## Struktur repositori

```text
.
├── apps/
│   └── api/             # Laravel 13 API (modular monolith) — Phase 0 aktif
│       ├── app/
│       ├── routes/api.php   # endpoint /api/v1
│       └── tests/
├── docker/php/Dockerfile.dev
├── docs/
├── compose.yaml
└── .env.docker.example
```

`apps/admin-web` (React), `apps/customer-web` (React), dan `apps/pos` (Flutter) akan diinisialisasi pada fase berikutnya sesuai `docs/development-environment.md`.

## Prasyarat

- Docker Desktop dengan Docker Compose v2.
- Git.
- Opsional di host: Node.js (React), Flutter SDK + emulator (POS).

## Menjalankan secara lokal (Docker)

```bash
# 1. Siapkan variabel Compose (file ini tidak di-commit)
cp .env.docker.example .env.docker

# 2. Nyalakan API, PostgreSQL, dan Redis
docker compose --env-file .env.docker up -d --build

# 3. Generate application key (sekali saja per checkout)
docker compose --env-file .env.docker exec api php artisan key:generate

# 4. Migrasi database
docker compose --env-file .env.docker exec api php artisan migrate
```

Setelah berjalan:

- API: `http://localhost:8000`
- Health API: `http://localhost:8000/api/v1/health`
- Health runtime: `http://localhost:8000/up`
- PostgreSQL (host): `localhost:54329`
- Redis (host): `localhost:6380`

Langkah inisialisasi Laravel lengkap ada di `docs/development-environment.md`.

## Perintah umum

```bash
# Test
docker compose --env-file .env.docker exec api composer test

# Format (Laravel Pint)
docker compose --env-file .env.docker exec api ./vendor/bin/pint

# Daftar route
docker compose --env-file .env.docker exec api php artisan route:list

# Hentikan container (data tetap aman)
docker compose --env-file .env.docker down
```

> Jangan menjalankan `docker compose down -v` tanpa sengaja: opsi `-v` menghapus volume database lokal.

## Catatan

- Compose dan PHP built-in server di `Dockerfile.dev` **hanya untuk development**, bukan konfigurasi produksi.
- Jangan commit `.env.docker` atau `apps/api/.env`.
- Uang direpresentasikan sebagai integer rupiah; waktu disimpan dalam UTC (lihat `docs/adr/`).
