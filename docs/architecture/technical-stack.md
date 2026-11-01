# Architecture — Technical Stack

> **Status:** Draft baseline
> **Tujuan:** Mencatat teknologi yang digunakan per aplikasi serta aturan pemilihan dependency.

## 1. Stack per aplikasi

### POS Mobile

- Flutter stable + Dart stable; versi SDK dipatok dan dicatat pada repository.
- Material 3 sebagai dasar komponen UI dengan design tokens Dagana.
- `flutter_riverpod` untuk state management dan dependency injection.
- `go_router` untuk navigation dan route guard sisi UI.
- `dio` untuk HTTP client, timeout, interceptor, dan error handling.
- `flutter_secure_storage` untuk token/secret kecil melalui secure storage OS.
- `drift` + SQLite untuk cache lokal, draft/cart, outbox, dan sync state ketika fitur offline diaktifkan.
- `connectivity_plus` untuk indikasi perubahan konektivitas; request tetap harus menangani network failure.
- `mobile_scanner` hanya jika scan QR/barcode masuk scope.
- `flutter_test` dan `integration_test`; `mocktail` bila dibutuhkan.
- Printing thermal menggunakan adapter terpisah dan plugin dipilih setelah perangkat target diuji.

Dependency yang direkomendasikan bukan daftar instalasi wajib. Tambahkan hanya saat ada kebutuhan fitur yang jelas dan periksa kompatibilitas terhadap versi Flutter/Dart yang dipatok. Commit `pubspec.lock`.

### Owner/Admin Web dan Customer Web

- React + TypeScript + Vite.
- Tailwind CSS + shadcn/ui.
- TanStack Query untuk server state.
- Gunakan dependency dan komponen web hanya dalam workspace web; jangan membawa shadcn/ui ke Flutter.

### Backend API

- Laravel + PHP sebagai REST API modular monolith.
- PostgreSQL sebagai database utama.
- Redis untuk cache, queue, rate limiting, dan kebutuhan pendukung yang diaktifkan.
- WebSocket/realtime dan S3-compatible object storage sesuai decision log dan kebutuhan fase.

## 2. Repository workspaces

```text
apps/
├── api/             # Laravel
├── admin-web/       # React + TypeScript + Vite
├── customer-web/   # React + TypeScript + Vite
└── pos-mobile/      # Flutter + Dart
```

## 3. Dependency and version policy

- Pin/document runtime/toolchain version yang digunakan CI dan developer.
- Gunakan package manager resmi masing-masing stack.
- Untuk Flutter, cek kompatibilitas package terhadap SDK yang dipatok dan commit `pubspec.lock`.
- Jangan memasukkan dependency hanya karena direkomendasikan di dokumen; harus ada use case.
- Jangan memperbarui major dependency bersamaan dengan perubahan fitur yang tidak terkait tanpa alasan dan test yang memadai.

## 4. Source references

Untuk pola implementasi Laravel, Flutter, React, testing, dan dependency hygiene, lihat `docs/engineering/engineering-standards.md` dan `AGENTS.md`. Keputusan provider/vendor yang belum final dilacak di `docs/planning/decision-log.md`.
