# Domain Modeling --- Dagana

> **Dokumen Teknis**
> **Modul:** Domain Modeling v0.1
> **Acuan:** `Dagana_PRD_v0.1.md`
> **Status:** Final untuk ERD & implementation planning
> **Tanggal:** 2026-09-20

---

## Table of Contents

1. [Tujuan](#1-tujuan)
2. [Prinsip Desain](#2-prinsip-desain)
3. [Bounded Context](#3-bounded-context)
4. [Keputusan yang Terkunci](#4-keputusan-yang-terkunci)
5. [Primary Keys & Penjangkaran Data](#5-primary-keys--penjangkaran-data)
6. [Aggregates per Modul](#6-aggregates-per-modul)
7. [Enums & State Machine](#7-enums--state-machine)
8. [Aturan Bisnis Kunci](#8-aturan-bisnis-kunci)
9. [Data yang Wajib di-Snapshot](#9-data-yang-wajib-di-snapshot)
10. [Open Decisions Tersisa](#10-open-decisions-tersisa)

---

## 1. Tujuan

Dokumen ini menjadi acuan utama untuk:

-   ERD & database design (`docs/ERD.md`)
-   API specification
-   Authentication & RBAC design
-   Struktur kode Modular Monolith (module boundary per bounded context)

Domain model diturunkan langsung dari PRD v0.1 tanpa mengubah aturan bisnis yang sudah ditetapkan.

---

## 2. Prinsip Desain

Mengikuti **Architecture Principles** pada PRD §24:

| Prinsip | Implementasi pada domain model |
|---|---|
| **API First** | Domain model dipisah dari serialization; API `v1` menjadi satu-satunya pintu masuk data |
| **Multi Tenant** | Semua entity bisnis wajib memiliki `tenant_id`; isolasi di backend + RLS |
| **Domain Oriented** | Business logic dikelompokkan per bounded context, bukan per jenis file |
| **Event Driven Internally** | Modul berkomunikasi lewat domain events, bukan saling memanggil service |
| **Realtime Ready** | Entities memuat status & timestamp yang dibutuhkan event propagation |
| **Offline Ready** | `idempotency_key` pada Order & Transaction untuk mendukung sync POS offline |

---

## 3. Bounded Context

```
┌──────────────────────────────────────────────────────────────┐
│                     DAGANA PLATFORM                          │
│                                                              │
│  IDENTITY      → auth, user, role, permission, session       │
│  TENANCY       → tenant, outlet, membership, assignment      │
│  CATALOG       → category, product, variant, modifier, menu  │
│  INVENTORY     → stock, movement, receiving, opname, rule    │
│  SALES         → order, transaction, item, refund, discount  │
│  PAYMENTS      → payment, payment method                     │
│  CUSTOMERS     → customer profile + riwayat order            │
│  TABLES        → table, table QR, table session              │
│  ORDERING      → order source, order status, kitchen order   │
│  NOTIFICATIONS → domain events, notifikasi low-stock         │
│  REPORTING     → read model / projection analitik            │
└──────────────────────────────────────────────────────────────┘
             satu backend (Modular Monolith)
```

Interaksi antar-modul hanya melalui **domain events**, contohnya:

-   `SALES → INVENTORY`: `StockDeducted` (saat checkout sukses)
-   `ORDERING → NOTIFICATIONS`: `OrderCreated`, `OrderReady`
-   `INVENTORY → NOTIFICATIONS`: `LowStockAlert`

---

## 4. Keputusan yang Terkunci

Hasil konfirmasi terhadap Open Decisions PRD §32 (yang berdampak ke struktur data):

| # | Keputusan | Hasil | Dampak pada model |
|---|---|---|---|
| D1 | Tenant isolation | **Shared schema + `tenant_id` + Postgres RLS** | Semua tabel bisnis ber-`tenant_id`; RLS aktif; `tenant_id` di index setiap lokasi potensial |
| D2/D3 | Scope akses user | **Multi-tenant (Membership) + multi-outlet (OutletAssignment)** | Auth token membawa pilihan tenant aktif; request POS/dashboard wajib menyertakan scope |
| D4 | Variant & modifier | **Ya, sederhana** (tanpa matrix/kombinatorial) | `products → product_variants`; `modifier_groups → modifier_options` |
| D5 | Payment QR Ordering | Ya, opsional per merchant | Payment tidak wajib mengikuti order; status payment independen |
| D6 | ID strategy | **UUID v7** | Klien bisa generate ID (offline POS); tidak membocorkan urutan data |

> D1 merupakan keputusan paling mahal jika salah. RLS berfungsi sebagai lapisan pengaman terakhir di level database, sementara backend tetap melakukan validasi scope pada lapisan aplikasi.

---

## 5. Primary Keys & Penjangkaran Data

### 5.1 Identitas

-   Seluruh primary key menggunakan **UUID v7**.
-   `order_number`, `transaction_number`, `sku`, `barcode`, `token` QR menggunakan kolom unik terpisah (human-readable/increment, bukan PK).

### 5.2 Konteks Tenant

```
GLOBAL (tanpa tenant)
├── users, roles(acuan), permissions, sessions, payment_methods(global)

TENANT-SCOPED (wajib tenant_id)
├── products, categories, modifier_groups, customers,
│   discount_rules, tax_rates, low_stock_rules, notifications

OUTLET-SCOPED (wajib tenant_id + outlet_id)
├── transactions, orders, payments, stocks, stock_movements,
│   tables, table_sessions, menu_items
```

---

## 6. Aggregates per Modul

### 6.1 Identity

| Entity | Catatan |
|---|---|
| `User` (AR) | Kredensial & data dasar user. Global (tidak ber-tenant). |
| `Role` (AR) | Nama + kumpulan permission. Role built-in: `OWNER`, `MANAGER`, `CASHIER`, `INVENTORY` (PRD §17). |
| `Permission` | Value object/entity global, dikode seperti `products.read`. |
| `Session` | Refresh token, expiry, revoked. |

### 6.2 Tenancy

| Entity | Catatan |
|---|---|
| `Tenant` (AR) | Representasi satu merchant/bisnis; berisi plan & status. |
| `Outlet` (AR) | Lokasi operasional; `business_type` (`retail`/`restaurant`). |
| `Membership` | Relasi User ↔ Tenant + Role (user bisa bergabung ke banyak tenant). |
| `OutletAssignment` | Relasi User ↔ Outlet dalam satu tenant (user bisa kerja di banyak outlet). |

> Model ini menjawab D2/D3: satu user dapat mengakses **beberapa tenant** dan **beberapa outlet** di dalam tenant yang sama.

### 6.3 Catalog

| Entity | Catatan |
|---|---|
| `Category` (AR) | Hierarki opsional via `parent_id`. |
| `Product` (AR) | Data inti produk; milik tenant. |
| `ProductVariant` | SKU & barcode unik; memiliki `price` (harga jual) dan `cost_price` (harga modal untuk COGS). |
| `ModifierGroup` (AR) | Contoh: *Level Pedas*; berisi aturan `min_select`, `max_select`, `required`. |
| `ModifierOption` | Nilai/opsi modifier dengan `price_adjustment`. |
| `Menu` / `MenuItem` | Mapping produk ke outlet; `is_active` untuk kontrol tampilan QR Ordering. |

### 6.4 Inventory

| Entity | Catatan |
|---|---|
| `Stock` (AR) | Balance per variant per outlet — **merupakan ringkasan**, bukan sumber kebenaran. |
| `StockMovement` (AR) | **Append-only ledger.** `quantity` bertanda (+/−), `movement_type`, `reference_type` + `reference_id`, `actor`, `timestamp`. |
| `StockReceiving` | Penerimaan barang masuk. |
| `StockOpname` | Batch opname; berisi banyak `StockAdjustment`. |
| `StockAdjustment` | `system_qty` vs `counted_qty` ± `diff` + `reason`. |
| `LowStockRule` | Threshold per variant, bisa per outlet atau seluruh outlet tenant. |

Aturan kunci: **stock hanya berubah lewat StockMovement** (PRD §12).

### 6.5 Sales

| Entity | Catatan |
|---|---|
| `Order` (AR) | Berisi `order_source` (`POS`/`QR`/`ADMIN`/`ONLINE`), `status`, `customer_id` (nullable), `table_session_id` (nullable), `idempotency_key`. |
| `OrderItem` | **Snapshot** nama/SKU/harga + modifiers saat order dibuat. |
| `Transaction` (AR) | Hitungan financial: subtotal − discount + tax = grand_total; `idempotency_key`. |
| `TransactionItem` | Snapshot per item yang dibayar. |
| `Discount` / `DiscountRule` | Aturan diskon (persen/nominal) per tenant. |
| `TaxRate` | Rate pajak per tenant, `is_default`. |
| `Refund` (AR) | Refund parsial/full, mereferensikan transaction & payment. |

### 6.6 Payments

| Entity | Catatan |
|---|---|
| `Payment` (AR) | `method`, `amount`, `status`, `reference`, `reference_external`, `actor`, `paid_at`. |
| `PaymentMethod` | Konfigurasi metode (Cash, QR, Transfer, Debit, Credit) — bisa global atau per tenant. |

### 6.7 Customers

| Entity | Catatan |
|---|---|
| `Customer` (AR) | Profil pelanggan + history order. QR ordering tanpa login = **guest** (`customer_id` nullable). |

### 6.8 Tables & Ordering

| Entity | Catatan |
|---|---|
| `Table` (AR) | Nomor/area/kapasitas; status `AVAILABLE`/`OCCUPIED`/`RESERVED`/`INACTIVE`. |
| `TableQR` | Token unik (hash) — **tidak pernah** memakai id table langsung (PRD §10.1). |
| `TableSession` | Dibuka saat pelanggan duduk; menampung order selama sesi. |

### 6.9 Notifications & Reporting

| Entity | Catatan |
|---|---|
| `Notification` | Domain event ter-publish (Redis + WebSocket); contoh `OrderCreated`, `StockUpdated`, `LowStockAlert`. |
| `DailySalesSummary` (projection) | Read model harian per outlet untuk dashboard/report tanpa membebani tabel transaksi. |

---

## 7. Enums & State Machine

### 7.1 Order Status (PRD §11)

```
PENDING → CONFIRMED → PREPARING → READY → COMPLETED
              ↘ CANCELLED (dari PENDING/CONFIRMED)
```

### 7.2 Payment Status (PRD §18)

```
PENDING → PAID
       ↘ FAILED
PAID    → REFUNDED
```

### 7.3 Order Source (PRD §10.3)

```
POS | QR | ADMIN | ONLINE
```

### 7.4 Payment Method (MVP, PRD §18)

```
CASH | QR | TRANSFER | DEBIT | CREDIT
```

### 7.5 Stock Movement Type (PRD §12)

```
SALE        (penjualan)
ADJUSTMENT  (koreksi stok)
OPNAME      (hasil stock opname)
RECEIVING   (barang masuk)
DAMAGED     (rusak)
RETURN      (retur barang)
```

### 7.6 Status Lain

```
User      : ACTIVE | DISABLED
Table     : AVAILABLE | OCCUPIED | RESERVED | INACTIVE
StockOpname : DRAFT | IN_PROGRESS | COMPLETED | CANCELLED
Refund    : PENDING | REFUNDED | FAILED
```

---

## 8. Aturan Bisnis Kunci

1.  **Checkout atomic** (PRD §13): Order + Items + Payment + Inventory update + StockMovement dalam **satu transaksi DB** (`BEGIN` ... `COMMIT`; rollback jika ada yang gagal).
2.  **Stock append-only**: tidak ada UPDATE pada balance di luar creation of movement; `Stock` dihitung ulang dari ledger (atau disimpan sebagai materialized summary yang diturunkan dari ledger).
3.  **Urutan entity Order sebelum Transaction**: satu Order dapat memiliki 0..n Transaction (misal split bill post-MVP); Transaction mereferensikan OrderItems.
4.  **Snapshotting**: OrderItem, TransactionItem, dan `modifiers_snapshot` menyimpan salinan data saat transaksi agar perubahan harga produk di masa depan tidak mengubah riwayat.
5.  **Idempotency**: `idempotency_key` pada Order & Transaction di-unique per outlet → klien offline mengirim ulang request yang sama tidak menciptakan duplikasi.
6.  **Authorization di backend** (PRD §17): Frontend hanya mengontrol visibilitas; permission dicek pada service layer.
7.  **Tenant isolation di backend** (PRD §20): RLS sebagai lapisan pengaman terakhir; service layer tetap memaksa scope aktif pada setiap query.

---

## 9. Data yang Wajib di-Snapshot

| Kolom | Alasan |
|---|---|
| `order_items.product_name`, `sku`, `unit_price` | Harga/nama produk bisa berubah |
| `order_items.modifiers_snapshot` (JSON) | Opsi modifier bisa berubah/terhapus |
| `transaction_items.snapshot` (JSON) | Keperluan audit & refund akurat |
| `stock_movements.reference_type` + `reference_id` | Melacak asal-usul setiap perubahan stok |
| `payments.reference` / `reference_external` | Trace payment ke gateway/merchant |

---

## 10. Open Decisions Tersisa

Keputusan yang tidak memblokir ERD & bisa diputuskan saat tahap berikutnya:

-   [ ] Provider WebSocket
-   [ ] Object storage provider
-   [ ] Payment gateway integration (post-MVP, PRD §26)
-   [ ] Thermal printer hardware target
-   [ ] Barcode hardware target
-   [ ] Model subscription SaaS
-   [ ] Detail strategi offline sync & conflict resolution
-   [ ] Apakah KDS (Kitchen Display System) masuk MVP (saat ini: dimodelkan sebagai event `OrderCreated` ke POS/Kitchen)

---

## Document Status

| Property | Value |
|---|---|
| Product | Dagana |
| Document | Domain Modeling |
| Version | v0.1 |
| Status | Final (untuk ERD & implementation planning) |
| Next Step | ERD & Database Design → API Specification |