# Architecture — Data Model Overview

> **Status:** Conceptual baseline
> **Catatan:** Dokumen ini menggambarkan relationship konseptual, bukan physical ERD final atau daftar kolom yang sudah disetujui.

## 1. Core relationship

```text
USER
  │
  ▼
MEMBERSHIP ───── PERMISSION / ROLE PRESET
  │
  ▼
BUSINESS
  ├────────────── CATALOG / MENU (business-level master data, lihat D-25)
  │
  ├────────────── BILLING
  │
  └── OUTLET (one or many)
        ├── OUTLET ACCESS
        ├── CASH SESSION ── OPERATOR
        ├── ORDER ── ORDER ITEMS
        │     └── PAYMENT
        ├── INVENTORY ── STOCK MOVEMENTS
        ├── TABLE / QR ORDER (when enabled)
        └── REPORTING (derived/read models)
```

## 2. Organization constraints

- Satu User hanya terhubung dengan satu Business pada MVP.
- Satu Business mempunyai satu Owner dan dapat mempunyai banyak Outlet serta employee.
- Membership menyimpan hubungan User–Business, role preset, status, dan outlet access sesuai keputusan produk.
- Business hanya menyimpan `name` pada MVP. Outlet menyimpan alamat komposit sebagai kolom flat: `street`, `village`, `district`, `regency`, `province`, dan `postal_code`, plus `phone` opsional.
- Catalog (category dan menu/produk) adalah master data milik Business dengan harga yang sama di semua Outlet sesuai D-25. Menu memakai `is_active` dan `is_available` boolean; availability per-outlet belum diputuskan. Price disimpan sebagai integer rupiah utuh.
- Constraint penting wajib dijaga pada database dan backend, bukan hanya frontend validation.

## 3. Operational data ownership

Data operasional yang relevan harus membawa `business_id` dan/atau `outlet_id` agar scope dan histori jelas. Contohnya order, payment, Cash Session, inventory, stock movement, table, QR, kitchen activity, dan laporan. Bentuk FK, unique constraints, indexes, deletion/deactivation policy, dan snapshot columns harus ditetapkan pada desain ERD sebelum migration dibuat.

## 4. Transactional history

Order item perlu menyimpan snapshot nilai penting yang menjaga histori transaksi. Payment, cash movement, stock movement, dan audit event adalah catatan historis; koreksi dilakukan dengan cancel/refund/reversal/adjustment yang tercatat, bukan hard delete.

## 5. Data architecture

- PostgreSQL adalah primary database dan system of record.
- Redis bukan source of truth transaksi; gunakan untuk cache/queue/temporary state sesuai kebutuhan.
- Object storage menyimpan file dan media, bukan data relational operasional.
- Data laporan dapat dihitung dari transaksi atau menggunakan read model yang konsisten; strategi materialisasi ditetapkan berdasarkan kebutuhan performa.

## 6. Next design artifacts

Sebelum Phase 1–4, buat ERD konseptual dan physical ERD yang sesuai dengan requirement fase terkait. Setiap perubahan model harus ditautkan ke migration, constraints, tests, dan API contract.
