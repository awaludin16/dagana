# Operations — Development Environment

> **Status:** Phase 0 backend dan frontend aktif (development-only)
> **Tujuan:** Menjelaskan baseline lingkungan local untuk clean rebuild Dagana dan perintah yang sudah diverifikasi.

## 1. Prinsip clean initialization

Dagana dibangun ulang dari baseline project baru. Scaffold masing-masing aplikasi menggunakan tooling resmi stack terkait. Jangan menyalin kode aplikasi, migration, database dump, credential, build output, atau lockfile lama tanpa persetujuan eksplisit. Jika repository target tidak kosong, inspeksi dan laporkan isinya sebelum melakukan perubahan.

## 2. Workspace

| Workspace           | Stack                     | Status                     |
| ------------------- | ------------------------- | -------------------------- |
| `apps/api`          | Laravel 13 / PHP 8.5      | Tersedia (Phase 0 backend) |
| `apps/admin-web`    | React + TypeScript + Vite | Tersedia (Phase 0 frontend) |
| `apps/customer-web` | React + TypeScript + Vite | Tersedia (Phase 0 frontend) |
| `apps/pos-mobile`   | Flutter + Dart            | Tersedia (Phase 0 frontend) |

Semua workspace memakai scaffold resmi (`create vite`, `flutter create`) tanpa menyalin kode project lama. Aplikasi web dan mobile belum berisi modul bisnis; halaman yang ada hanya shell dan halaman not-found.

## 3. Docker local runtime

File yang tersedia:

- `compose.yaml` — service `api`, `postgres`, `redis` dengan health check.
- `docker/php/Dockerfile.dev` — PHP 8.5 CLI + `pdo_pgsql`, `redis`, `intl`.
- `docker/php/entrypoint.sh` — menjalankan `composer install` bila `vendor` belum ada.
- `docker/postgres/init/01-test-database.sh` — membuat database uji `<POSTGRES_DB>_test` saat volume pertama kali dibuat.
- `.env.docker.example` — contoh override Compose; salin ke `.env` (sudah di-gitignore).
- Named volume `postgres_data` untuk data PostgreSQL.

### Perintah setup dan operasi

```bash
cp .env.docker.example .env      # opsional: override default development
docker compose config            # validasi konfigurasi Compose
docker compose up -d --build     # build image dan jalankan api + postgres + redis
docker compose exec api php artisan migrate
docker compose ps                # status health tiap service
```

### Health check

```bash
curl http://localhost:8000/up                # liveness Laravel: aplikasi hidup
curl http://localhost:8000/api/v1/health     # readiness: PostgreSQL + Redis
```

`/up` hanya membuktikan proses aplikasi berjalan. `/api/v1/health` mengembalikan `200` dengan `{"status":"ok"}` bila database dan Redis dapat dihubungi, atau `503` dengan `{"status":"unavailable"}` beserta penanda dependency yang gagal. Detail error hanya masuk log, tidak dikembalikan ke client.

### Test, lint, dan formatter

```bash
docker compose exec api php artisan test
docker compose exec api ./vendor/bin/pint --test   # cek format
docker compose exec api ./vendor/bin/pint          # perbaiki format
```

Test memakai database `dagana_test` (lihat `apps/api/phpunit.xml`), sehingga `RefreshDatabase` tidak menyentuh schema development. Nilai `APP_ENV`, `DB_DATABASE`, dan `CACHE_STORE` dipaksa lewat elemen `<server force="true">` agar environment Compose tidak menimpa konfigurasi test; rate limit test tidak memakai Redis development.

### Catatan penting

- Koneksi antar-container memakai nama service `postgres` dan `redis`. Nilai `127.0.0.1` hanya dipakai untuk akses dari host (mis. `apps/api/.env` saat menjalankan PHP langsung di host).
- Container API tidak memakai `apps/api/.env`; konfigurasi runtime berasal dari blok `environment` pada `compose.yaml`. File `.env` di `apps/api` hanya untuk workflow host.
- Server dijalankan dengan `php -S 0.0.0.0:8000 -t public public/index.php`, bukan `php artisan serve`. `artisan serve` men-spawn child process dengan environment bersih sehingga `.env` hasil scaffold (`sqlite`, `127.0.0.1`) menimpa environment Compose.
- Container berjalan sebagai root; `vendor` yang dibuat saat boot pertama dimiliki root di host. Jalankan Composer dari dalam container agar konsisten.
- Menghapus data development bersifat destruktif dan harus eksplisit: `docker compose down -v`. Perintah ini menghapus named volume `postgres_data`.
- Konfigurasi ini development-only dan tidak boleh dipakai untuk production.

## 4. Frontend workspace

### Web (`apps/admin-web`, `apps/customer-web`)

Prasyarat: Node.js 22.12+ (terverifikasi dengan Node 24.22.1 / npm 12.2.1).

```bash
cd apps/admin-web          # atau apps/customer-web
npm install
cp .env.example .env       # opsional; default API sudah dipakai bila file tidak ada
npm run dev                # http://localhost:5173
```

Perintah pemeriksaan yang tersedia di kedua app:

```bash
npm run lint            # oxlint
npm run type-check      # tsc -b
npm run test            # vitest run
npm run build           # tsc -b && vite build
npm run format:check    # prettier --check
npm run format          # prettier --write
```

Catatan web:

- Tailwind CSS v4 dipakai lewat plugin `@tailwindcss/vite`; token warna/radius shadcn/ui berada di `src/index.css`.
- Komponen shadcn/ui berada di `src/components/ui` dan ditambahkan dengan `npx shadcn@latest add <component> -y`. Registry default CLI v4 menghasilkan import `cn`/`radix-ui` yang belum dipakai proyek; gunakan registry `new-york` sampai baseline dependency diperbarui: `npx shadcn@latest add https://ui.shadcn.com/r/styles/new-york/<component>.json -y --overwrite`. Alias `@/*` tersedia di `tsconfig.json` (dibaca CLI) dan `tsconfig.app.json`.
- TanStack Query dipakai untuk server state (sesi, business, outlet, member, dan wilayah); state UI lokal tetap memakai React state.
- Router memakai `react-router` 8.5.1 (disetujui 2026-11-01, lihat `docs/planning/decision-log.md`) dengan route publik, onboarding, dan workspace yang dijaga status sesi.
- `VITE_API_BASE_URL` di `.env` mengatur base URL API untuk pengembangan; `VITE_API_ORIGIN` opsional untuk origin cookie/CSRF (default diturunkan dari base URL). Jangan menaruh secret di variabel `VITE_*` karena nilainya ikut ter-bundle ke browser.
- Admin web memakai Sanctum SPA session, bukan token di `localStorage`. Pastikan `FRONTEND_URL` dan `SANCTUM_STATEFUL_DOMAINS` pada Compose mencakup origin dev (default `http://localhost:5173` dan `localhost:5173,127.0.0.1:5173`), lalu recreate container API setelah mengubah env.

### Mobile (`apps/pos-mobile`)

Prasyarat: Flutter 3.35.7 / Dart 3.9.2 (stable). Di WSL, SDK Linux berada di `~/development/flutter` dan Android tooling/emulator dijalankan dari host.

Pastikan `which flutter` menunjuk `~/development/flutter/bin/flutter` (sudah ditambahkan ke `~/.profile` dan `~/.bashrc`). Memakai SDK Windows `/mnt/c/Android/flutter/bin/flutter` dari WSL gagal dengan `env: $'bash\r': No such file or directory` karena skrip bash-nya ber-CRLF.

```bash
cd apps/pos-mobile
flutter pub get
cp env/dev.example.json env/dev.json   # opsional
flutter run --dart-define-from-file=env/dev.json
```

Pratinjau UI tanpa emulator Android (target web untuk development, bukan channel produk):

```bash
flutter run -d web-server --web-port=8090 --web-hostname=0.0.0.0
```

Perintah pemeriksaan:

```bash
flutter analyze
flutter test
dart format .                             # format
dart format --output=none --set-exit-if-changed .   # cek format
```

Catatan mobile:

- `API_BASE_URL` dibaca dengan `String.fromEnvironment` (`lib/config/env.dart`). Default `http://10.0.2.2:8000/api/v1` hanya untuk emulator Android; perangkat fisik memerlukan IP host di jaringan lokal.
- `env/dev.json` tidak dicatat di Git; hanya `env/dev.example.json` yang menjadi contoh.
- Routing memakai `go_router` dengan route `/` dan `errorBuilder` untuk alamat tak dikenal.
- `pubspec.lock` dicatat di version control. Belum ada dependency Riverpod/Dio karena belum diperlukan pada Phase 0.
- Emulator Android tidak tersedia di WSL ini: tidak ada `/dev/kvm`, Android SDK/JDK Linux, atau perangkat fisik yang terhubung, sehingga `flutter run` untuk Android belum dapat diverifikasi di WSL. Jalankan dari host atau perangkat fisik.

## 5. Toolchain

Versi yang diverifikasi saat Phase 0:

| Komponen                | Versi                           |
| ----------------------- | ------------------------------- |
| PHP (WSL dan image dev) | 8.5.4                           |
| Composer                | 2.11.1                          |
| Laravel                 | 13.11.0 (framework 13.39.0)     |
| PostgreSQL              | 18 (image `postgres:18-alpine`) |
| Redis                   | 8 (image `redis:8-alpine`)      |
| Docker Engine / Compose | 29.8.0 / v5.5.1                 |
| Node.js / npm           | 24.22.1 / 12.2.1                |
| React / Vite            | 19.3.1 / 8.3.5                  |
| TypeScript              | 7.0.2                           |
| Tailwind CSS            | 4.3.3                           |
| react-router            | 8.5.1                           |
| TanStack Query          | 5.105.0                         |
| Vitest                  | 5.0.5                           |
| Flutter / Dart          | 3.35.7 / 3.9.2                  |
| go_router               | 17.2.3                          |

PHP dan Composer mengikuti constraint `apps/api/composer.json` dan `apps/api/composer.lock`. Versi JavaScript mengikuti `package-lock.json` masing-masing app; versi Flutter/Dart mengikuti `pubspec.lock`. Flutter SDK tidak dimasukkan ke image Laravel; Android SDK dan emulator dijalankan di host.

## 6. Environment dan secret

- `.env` (root, untuk Compose) dan `apps/api/.env` (untuk workflow host) tidak dicatat di Git.
- `.env` di `apps/admin-web` dan `apps/customer-web` tidak dicatat di Git; `.env.example` hanya berisi base URL development.
- `apps/pos-mobile/env/dev.json` tidak dicatat di Git; `env/dev.example.json` hanya berisi base URL development.
- `.env.docker.example` dan `apps/api/.env.example` hanya berisi nilai disposable untuk development.
- `APP_KEY` default pada `compose.yaml` hanya untuk development. Ganti dengan `php artisan key:generate --show` bila perlu; jangan gunakan nilai ini di production.
- Jangan mengarahkan development tooling ke database production.

## 7. Status verifikasi

Yang sudah dijalankan dan lulus: `docker compose config`, build image, `docker compose up` dengan ketiga service healthy, `php artisan migrate` ke PostgreSQL 18, readiness endpoint `200` (database + Redis), persistensi data setelah restart container PostgreSQL, `php artisan test`, dan `pint --test`.

Verifikasi ulang 2026-11-01 pada stack yang sedang berjalan: `/up` dan `/api/v1/health` mengembalikan `200` (`database` dan `redis` ok), `migrate:status` menunjukkan tiga migration `Ran`, `php artisan test` lulus 4 test (11 assertion), dan `pint --test` lulus setelah satu style issue `concat_space` pada `config/database.php` diperbaiki dengan `pint`.

Frontend (`apps/admin-web` dan `apps/customer-web`): `npm run lint` (0 error, 2 warning `react/only-export-components` pada `button.tsx` dan `badge.tsx`), `npm run type-check`, `npm run test` (2 test per app), `npm run build`, dan `npm run format:check` berhasil.

Mobile (`apps/pos-mobile`): `flutter analyze` tanpa issue, `flutter test` lulus 3 widget test (termasuk cek overflow pada lebar ponsel 390x844), dan `dart format --output=none --set-exit-if-changed .` bersih.

Verifikasi render aplikasi POS 2026-11-01: target Android belum dapat dijalankan di WSL karena tidak ada emulator/perangkat (tanpa `/dev/kvm` dan Android SDK/JDK Linux). Target web diaktifkan di repository sebagai pratinjau development; `flutter build web` berhasil dan `flutter run -d web-server` (port 8090) merender beranda serta route not-found dengan benar (diperiksa dengan Edge headless + screenshot).

Verifikasi browser 2026-11-01: dev server `apps/admin-web` (port 5173) dan `apps/customer-web` (port 5174) melayani `200`, deep link route tak dikenal menampilkan halaman not-found, dan render diperiksa dengan Edge headless (`--dump-dom` + screenshot) untuk judul, badge, skip link, dan API base URL.

Yang belum dijalankan atau belum tersedia: menjalankan aplikasi mobile di emulator/perangkat fisik; test end-to-end; CI pipeline; serta konfigurasi production.
