# Architecture — System Architecture

> **Status:** Draft baseline
> **Scope:** Gambaran komponen, batas tanggung jawab, dan prinsip arsitektur Dagana.

Dokumen ini menjelaskan bagaimana bagian-bagian sistem bekerja bersama. Ia tidak menggantikan requirement produk. Jika detail implementasi membutuhkan keputusan baru, catat pada `docs/planning/decision-log.md` atau ADR terkait.

## 1. Architectural direction

- **Modular monolith**: satu backend Laravel dengan batas domain yang jelas.
- **API-first**: seluruh client menggunakan kontrak API backend yang sama.
- **One source of truth**: backend dan PostgreSQL menjadi sumber data utama untuk transaksi tersinkronisasi.
- **Business-centric tenancy**: satu User terhubung ke satu Business pada MVP; Business memiliki satu atau banyak Outlet.
- **Channel separation**: POS mobile Flutter, Owner/Admin Web React, dan Customer Web React adalah client berbeda, bukan domain bisnis terpisah.
- **No premature microservices**: jangan membagi aplikasi menjadi microservices pada MVP tanpa keputusan arsitektur yang disetujui.

## 2. High-level system view

```text
Flutter POS ───────┐
React Admin Web ───┼── HTTPS / REST API ── Laravel Modular Monolith
React Customer ───┘                            │
                                               ├── PostgreSQL (system of record)
                                               ├── Redis (cache / queue / support services)
                                               ├── Object Storage (files/images)
                                               └── Realtime transport (when enabled)
```

## 3. Application responsibilities

### Laravel API

- Menjadi pemilik aturan bisnis, validasi otoritatif, authorization, dan lifecycle transaksi.
- Menyediakan endpoint ter-version di `/api/v1`.
- Menjalankan background work melalui queue saat diperlukan.
- Menjaga konsistensi order, payment, cash, inventory, billing, dan audit.

### Flutter POS

- Menyediakan workflow operasional mobile untuk owner/operator/cashier.
- Menjadi client dari API; tidak menggandakan aturan checkout, harga final, payment confirmation, atau stock deduction.
- Dapat menyimpan data lokal yang dibutuhkan untuk cache/draft/offline queue sesuai fase yang diaktifkan.

### React Admin Web

- Menyediakan pengalaman pengelolaan Business/Outlet, catalog, employee, laporan, dan pengaturan sesuai permission.
- Tidak menjadi sumber keputusan authorization; backend tetap memeriksa setiap operasi.

### React Customer Web

- Menyediakan customer-facing ordering flow seperti QR Ordering apabila fitur diaktifkan.
- Menggunakan API yang sama dan aturan order yang sama dengan POS.

## 4. Backend domain boundaries

Domain dibangun bertahap sesuai kebutuhan fase. Kandidat tanggung jawab meliputi Identity, Organization, Outlet, Authorization, Catalog, Sales/Orders, Payments, Cash, Inventory, Ordering, Kitchen, Reporting, Billing, Audit, dan Notifications. Batas modul merupakan batas kode dan ownership business logic, bukan service deployment terpisah.

## 5. Tenant and outlet boundaries

- Setiap data milik merchant harus terkait Business yang benar.
- Data operasional yang relevan harus memiliki Outlet context.
- Business/Outlet context ditentukan dari authenticated context yang tervalidasi backend, bukan dipercaya dari input client.
- Authorization diterapkan pada endpoint, query, export, job, dan subscription realtime yang relevan.
- Query tenant-owned records harus di-scope sebelum record diambil berdasarkan ID.

## 6. Data and infrastructure responsibilities

PostgreSQL adalah database utama dan source of truth. Redis digunakan untuk cache, queue, rate limiting, dan dukungan realtime sesuai kebutuhan. Object storage menyimpan file seperti logo Business dan gambar menu. Pemilihan provider dan kebijakan produksi dicatat dalam decision log.

## 7. Realtime and offline boundaries

Realtime hanya menjadi mekanisme penyampaian event; data persisted tetap dibaca dari backend. POS offline menggunakan local database dan sync queue yang dirancang untuk retry/idempotency, tetapi local database bukan source of truth cloud. Detail requirement ada di `docs/requirements/platform-quality.md`; keputusan strategi konflik dan provider ada di `docs/planning/decision-log.md`.

## 8. Related architecture documents

- [`technical-stack.md`](technical-stack.md) — teknologi, package, dan tooling.
- [`api-design.md`](api-design.md) — aturan desain API.
- [`data-model.md`](data-model.md) — domain relationship dan tanggung jawab data.
