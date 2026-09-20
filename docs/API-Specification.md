# API Specification --- Dagana

> **Dokumen Teknis**
> **Modul:** API Specification v0.1
> **Acuan:** `Dagana_PRD_v0.1.md` (§10, §11, §13, §17, §18, §22), `docs/domain-modeling.md`, `docs/ERD.md`
> **Base Path:** `/api/v1`
> **Status:** Draft untuk implementasi Phase 0 & 3

---

## Table of Contents

1. [Konvensi Umum](#1-konvensi-umum)
2. [Autentikasi & Scope Multi-Tenant](#2-autentikasi--scope-multi-tenant)
3. [Response Envelope & Error](#3-response-envelope--error)
4. [Endpoint per Modul](#4-endpoint-per-modul)
5. [Alur Kritis](#5-alur-kritis)
6. [Realtime WebSocket Events](#6-realtime-websocket-events)
7. [Status Code & Versioning](#7-status-code--versioning)

---

## 1. Konvensi Umum

### 1.1 Base URL & Versioning

```
https://api.dagana.example/api/v1/...
```

-   Versioning inline pada path (`/api/v1`) — perubahan besar menghasilkan `/api/v2`.
-   Request data → `Content-Type: application/json`.
-   Timestamp → ISO 8601 UTC (`2026-09-20T10:30:00Z`).
-   Money → string desimal `"15000.00"` (decimal-safe, bukan float).

### 1.2 Headers Standar

| Header | Wajib | Keterangan |
|---|---|---|
| `Authorization: Bearer <token>` | Ya (kecuali endpoint publik) | Token akses (JWT) |
| `X-Tenant-Context` | Scanner QR / multi-tenant | `tenant_id` aktif; validasi via Membership |
| `X-Outlet-Context` | Operasional outlet | `outlet_id` aktif; validasi via OutletAssignment |
| `Idempotency-Key` | Checkout & create order | UUID dari klien; mencegah duplikasi (offline sync) |
| `Accept-Language` | Opsional | `id` / `en` |

> **Prinsip isolasi (PRD §20):** backend selalu memaksa scope aktif pada query, RLS sebagai lapisan pengaman. Jika `X-Tenant-Context` tidak diberikan, dipakai tenant default dari token.

### 1.3 Pagination, Filter, Sort

```
GET /api/v1/orders?tenant_id=...&outlet_id=...
    &page=2&per_page=25&status=PENDING&created_from=2026-09-01&created_to=2026-09-20
    &sort=-created_at
```

-   Pagination default `page=1, per_page=25`, max `per_page=100`.
-   `sort` dengan prefix `-` untuk descending.
-   Filter mengikuti field yang di-*index* pada ERD (status, created_at, outlet).

---

## 2. Autentikasi & Scope Multi-Tenant

### 2.1 Alur

```text
POST /auth/login
  → 200 { access_token, refresh_token, user, tenants[] }
POST /auth/refresh
  → 200 { access_token }
POST /auth/switch-tenant
  → 200 menetapkan tenant aktif, validasi membership, kirim ulang claims
```

JWT `claims`:

```json
{
  "sub": "uuid-user",
  "tenant_id": "uuid-aktif",
  "outlet_ids": ["uuid-outlet-1", "uuid-outlet-2"],
  "permissions": ["products.read", "orders.create"],
  "exp": 1750000000
}
```

### 2.2 Matriks Permission per Endpoint

| Modul | `read` | `create` | `update` | `delete` / khusus |
|---|---|---|---|---|
| Tenant/Outlet | OWNER | OWNER | OWNER | — |
| Users/Roles | OWNER, MANAGER | OWNER | OWNER | — |
| Products | semua role | OWNER, MANAGER | OWNER, MANAGER | OWNER |
| Inventory | OWNER, MANAGER, INVENTORY | INVENTORY, MANAGER | — | `adjust`, `stock_opname` |
| Orders (POS) | semua | CASHIER, MANAGER | `orders.cancel` | `orders.refund` |
| Payments | semua | CASHIER, MANAGER | — | `payments.refund` |
| Reports | OWNER, MANAGER | — | — | — |
| Customers | semua | CASHIER, MANAGER | MANAGER | — |

> Authorization dicek di backend (PRD §17). Rincian lengkap ada di dokumen RBAC (tahap berikutnya).

---

## 3. Response Envelope & Error

### 3.1 Format Sukses

```json
{
  "data": { "...": "..." },
  "meta": {
    "page": 1,
    "per_page": 25,
    "total": 320,
    "tenant_id": "uuid",
    "outlet_id": "uuid"
  }
}
```

### 3.2 Format Error

```json
{
  "error": {
    "code": "OUTLET_SCOPE_REQUIRED",
    "message": "Endpoint ini memerlukan X-Outlet-Context.",
    "details": { "field": "outlet_id", "reason": "required" },
    "trace_id": "trc_abc123"
  }
}
```

### 3.3 Kode Error Umum

| HTTP | Code | Kasus |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Input tidak valid |
| 401 | `UNAUTHENTICATED` | Token invalid/expired |
| 403 | `FORBIDDEN` | Bukan anggota tenant / permission kurang |
| 404 | `NOT_FOUND` | Resource tidak ada (dalam scope tenant) |
| 409 | `CONFLICT` | Duplikat SKU/barcode, idempotency conflict |
| 422 | `UNPROCESSABLE` | Aturan bisnis gagal (mis. stock kurang) |
| 429 | `TOO_MANY_REQUESTS` | Rate limit tercapai |

---

## 4. Endpoint per Modul

### 4.1 Auth

| Method | Path | Deskripsi | Permission |
|---|---|---|---|
| POST | `/auth/login` | Login, kirim token + daftar tenant | publik |
| POST | `/auth/refresh` | Perbarui access token | publik |
| POST | `/auth/logout` | Revoke refresh token | auth |
| POST | `/auth/switch-tenant` | Ganti tenant aktif | auth |
| GET | `/auth/me` | Profil + permissions + tenants | auth |

### 4.2 Tenancy

| Method | Path | Deskripsi | Role |
|---|---|---|---|
| GET | `/tenants` | Daftar tenant milik user | auth |
| POST | `/tenants` | Buat tenant (registrasi merchant) | OWNER |
| GET | `/tenants/{id}` | Detail tenant | OWNER |
| GET | `/tenants/{id}/outlets` | List outlet | OWNER, MANAGER |
| POST | `/tenants/{id}/outlets` | Buat outlet | OWNER |
| PATCH | `/outlets/{id}` | Update outlet | OWNER |
| POST | `/tenants/{id}/memberships` | Tambah user + role ke tenant | OWNER |
| POST | `/tenants/{id}/outlet-assignments` | Assign user ke outlet | OWNER |

### 4.3 Users & RBAC

| Method | Path | Deskripsi | Role |
|---|---|---|---|
| GET | `/users` | Daftar user tenant | OWNER, MANAGER |
| POST | `/users` | Buat user tenant | OWNER |
| GET | `/roles` | Daftar role + permissions | OWNER, MANAGER |
| PATCH | `/users/{id}` | Update user/role | OWNER |

### 4.4 Catalog

| Method | Path | Deskripsi | Role |
|---|---|---|---|
| GET | `/categories` | Daftar kategori | semua (tenant) |
| POST | `/categories` | Buat kategori | OWNER, MANAGER |
| PUT | `/categories/{id}` | Update kategori | OWNER, MANAGER |
| DELETE | `/categories/{id}` | Hapus kategori | OWNER |
| GET | `/products` | Daftar produk (filter `category`, `status`, `search`) | semua |
| POST | `/products` | Buat produk (dengan variant/price) | OWNER, MANAGER |
| GET | `/products/{id}` | Detail produk + variants + modifiers | semua |
| PUT | `/products/{id}` | Update produk | OWNER, MANAGER |
| DELETE | `/products/{id}` | Hapus (soft: status) | OWNER |
| POST | `/products/{id}/variants` | Tambah variant (sku/barcode) | OWNER, MANAGER |
| PUT | `/variants/{id}` | Update harga/COGS/status variant | OWNER, MANAGER |
| GET | `/products/{id}/modifier-groups` | List modifier group produk | semua |
| POST | `/modifier-groups` | Buat modifier group | OWNER, MANAGER |
| GET | `/outlets/{id}/menu` | Menu aktif untuk QR Ordering (publik) | publik |
| PUT | `/outlets/{id}/menu` | Atur menu_item (aktif/sort) | MANAGER |

**Contoh buat produk:**

```http
POST /api/v1/products
X-Tenant-Context: <tenant_id>
```

```json
{
  "name": "Kopi Susu Gula Aren",
  "category_id": "uuid",
  "variants": [
    { "sku": "KPG-R-12", "barcode": "8991234567890", "unit": "cup", "price": "18000.00", "cost_price": "9000.00" }
  ],
  "modifier_group_ids": ["uuid-group-pedas"]
}
```

`201` → body produk lengkap. Duplikat SKU/barcode → `409 CONFLICT`.

### 4.5 Inventory

| Method | Path | Deskripsi | Role |
|---|---|---|---|
| GET | `/inventory/stocks` | Balance stok (filter `product_variant_id`, `low_stock=true`) | OWNER, MANAGER, INVENTORY |
| GET | `/inventory/stocks/{variant_id}` | Stok satu variant per outlet | OWNER, MANAGER, INVENTORY |
| GET | `/inventory/stock-movements` | Ledger movements (paginasi) | OWNER, MANAGER, INVENTORY |
| POST | `/inventory/adjustments` | Stock adjustment (generate movement) | INVENTORY, MANAGER |
| POST | `/inventory/receivings` | Receiving barang masuk | INVENTORY, MANAGER |
| POST | `/inventory/opnames` | Mulai stock opname | INVENTORY, MANAGER |
| POST | `/inventory/opnames/{id}/adjustments` | Input hasil hitung fisik | INVENTORY |
| POST | `/inventory/opnames/{id}/complete` | Tutup opname + buat movements | INVENTORY |
| GET | `/inventory/low-stock-rules` | List threshold | MANAGER |
| PATCH | `/inventory/low-stock-rules/{id}` | Update threshold | MANAGER |

**Contoh stock adjustment:**

```json
POST /api/v1/inventory/adjustments
X-Outlet-Context: <outlet_id>
{
  "product_variant_id": "uuid",
  "quantity": -2,
  "reason": "DAMAGED",
  "note": "botol pecah"
}
```

`201` → movement dibuat; stok otomatis diperbarui lewat ledger.

### 4.6 Sales (Order & Transaction)

| Method | Path | Deskripsi | Role |
|---|---|---|---|
| GET | `/orders` | Daftar order (filter `status`, `source`, `table_session_id`) | semua |
| GET | `/orders/{id}` | Detail order + items | semua |
| POST | `/orders` | Buat order (**atomic checkout**, lihat §5.2) | CASHIER, MANAGER |
| PATCH | `/orders/{id}/status` | Update status (`CONFIRMED`→`PREPARING`→`READY`→`COMPLETED`) | CASHIER, MANAGER |
| POST | `/orders/{id}/cancel` | Batalkan order | MANAGER (permission `orders.cancel`) |
| GET | `/transactions` | Daftar transaksi | semua |
| GET | `/transactions/{id}` | Detail transaksi + payments + refunds | semua |
| POST | `/transactions/{id}/refunds` | Refund parsial/full | MANAGER (`orders.refund`) |

**Payload buat order (POS):**

```json
POST /api/v1/orders
Idempotency-Key: <uuid-klien>
X-Outlet-Context: <outlet_id>
{
  "order_source": "POS",
  "items": [
    { "product_variant_id": "uuid", "quantity": 2, "modifier_option_ids": ["uuid-opt-1"] }
  ],
  "discount_rule_id": "uuid" | null,
  "customer_id": "uuid" | null,
  "table_session_id": "uuid" | null,
  "payments": [
    { "payment_method": "CASH", "amount": "50000.00" },
    { "payment_method": "QR", "amount": "5000.00" }
  ]
}
```

`201` → `{ order, transaction, payments[], stock_movements[] }`. Idempotency-Key yang sama dikirim ulang → mengembalikan hasil order yang sama (tidak duplikat, **PRD §15 offline sync**).

### 4.7 Payments

| Method | Path | Deskripsi | Role |
|---|---|---|---|
| GET | `/payments` | List payment per transaksi/outlet | semua |
| GET | `/payments/{id}` | Detail payment + status | semua |
| GET | `/payment-methods` | Metode aktif tenant | semua |
| PATCH | `/payments/{id}` | Update status (pending→paid, gagal, refunded) | CASHIER, MANAGER |
| POST | `/payments/{id}/refund` | Refund payment | MANAGER |

### 4.8 Customers

| Method | Path | Deskripsi | Role |
|---|---|---|---|
| GET | `/customers` | Daftar pelanggan (search nama/phone) | semua |
| POST | `/customers` | Buat/upsert pelanggan | CASHIER, MANAGER |
| GET | `/customers/{id}` | Detail + riwayat order | semua |
| PUT | `/customers/{id}` | Update profil | MANAGER |

### 4.9 Tables & QR

| Method | Path | Deskripsi | Role |
|---|---|---|---|
| GET | `/tables` | List table + status per outlet | semua |
| POST | `/tables` | Buat table | MANAGER |
| PATCH | `/tables/{id}` | Update table (number/kapasitas/status) | MANAGER |
| POST | `/tables/{id}/qr` | Generate QR token baru (revoke lama) | MANAGER |
| GET | `/tables/{id}/qr` | Ambil QR token & URL | MANAGER |
| POST | `/table-sessions` | Buka sesi (seat) | CASHIER |
| POST | `/table-sessions/{id}/close` | Tutup sesi + flag table AVAILABLE | CASHIER |

QR token: `hash(token)` tersimpan; URL: `https://order.<domain>/?t=<token>`. Token **bukan** `table_id` langsung (PRD §10.1).

### 4.10 QR Ordering (Publik / Customer)

| Method | Path | Deskripsi |
|---|---|---|
| GET | `/qr/menu?token=...` | Validasi token → outlet + menu + table info |
| POST | `/qr/orders` | Buat order dari cart customer (source=`QR`) |
| GET | `/qr/orders/{id}` | Status order customer (guest auth via order token) |
| POST | `/qr/orders/{id}/pay` | Pembayaran QR (jika diaktifkan merchant — D5) |

**Contoh `GET /qr/menu`:**

```json
{
  "data": {
    "outlet": { "id": "uuid", "name": "Cafe ABC Bandung", "business_type": "restaurant" },
    "table": { "id": "uuid", "number": "12" },
    "session_token": "uuid-generate-di-sini",
    "menu": [
      { "id": "uuid-product", "name": "Kopi Susu Gula Aren", "price": "18000.00",
        "variants": [], "modifier_groups": [ { "id": "uuid", "name": "Level", "options": [] } ] }
    ]
  }
}
```

**Contoh `POST /qr/orders`:**

```json
{
  "order_source": "QR",
  "table_token": "<token-dari-qr>",
  "items": [ { "product_variant_id": "uuid", "quantity": 1, "modifier_option_ids": ["uuid"] } ]
}
```

Order masuk ke antrian realtime `OrderCreated` → POS & Kitchen Display (PRD §11, §14).

### 4.11 Reports

| Method | Path | Deskripsi | Role |
|---|---|---|---|
| GET | `/reports/sales` | Penjualan per hari/outlet/kasir/metode | OWNER, MANAGER |
| GET | `/reports/products` | Best-seller & qty produk | OWNER, MANAGER |
| GET | `/reports/inventory` | Current stock, movement, low stock | OWNER, MANAGER, INVENTORY |
| GET | `/reports/profit` | Gross profit = sales − COGS (PRD §19) | OWNER |

Parameter: `from`, `to`, `group_by` (`day|week|month`), `outlet_id`.

### 4.12 Notifications & Audit Logs

| Method | Path | Deskripsi | Role |
|---|---|---|---|
| GET | `/notifications` | Riwayat notifikasi tenant | semua |
| GET | `/audit-logs` | Log aktivitas (PRD §21) | OWNER, MANAGER |

---

## 5. Alur Kritis

### 5.1 Login Multi-Tenant

```text
POST /auth/login ───────────► 200 { access_token, refresh_token, tenants[] }
      │
      ▼
User pilih tenant → POST /auth/switch-tenant { tenant_id }
      │
      ▼
Setiap request: Authorization: Bearer <token> + X-Outlet-Context: <outlet_id>
```

### 5.2 Checkout Atomic (PRD §13)

```text
POST /orders  (Idempotency-Key)
   ↓
BEGIN DB TRANSACTION
├── 1. Validasi harga & stok (cek ledger)
├── 2. Create order + order_items (snapshot)
├── 3. Create transaction + transaction_items
├── 4. Create payments (status PAID)
├── 5. Deduct stock → stock_movements (create)
└── 6. Update table session / items status
COMMIT ──► publish OrderCreated, StockUpdated
```

Jika salah satu langkah gagal → **rollback seluruh transaksi**, tidak ada state parsial.

### 5.3 Offline POS Sync (PRD §15)

```text
POS offline ─► simpan transaksi lokal + Idempotency-Key
    ↓ koneksi pulih
POST /orders (payload sama, Idempotency-Key sama)
    ↓
Backend: key sudah ada? → return hasil yang sama (bukan duplikat)
         key baru        → proses normal, 201
```

### 5.4 QR Ordering Realtime (PRD §14)

```text
Customer scan QR → GET /qr/menu → cart → POST /qr/orders
    ↓
Backend publish event → Redis
    ↓
WebSocket send ke POS & Kitchen: OrderCreated { order }
    ↓
Kasir/koki update status → POST /orders/{id}/status → OrderPreparing/OrderReady
    ↓
Customer menerima update via EventSource/WS (status order)
```

---

## 6. Realtime WebSocket Events

Channel per tenant yang disaring per outlet (PRD §14):

| Event | Arah | Payload |
|---|---|---|
| `OrderCreated` | → POS, Kitchen | order minified |
| `OrderConfirmed` | → POS, Customer | order_id, status |
| `OrderPreparing` | → Customer | order_id, status |
| `OrderReady` | → POS, Customer | order_id, status |
| `OrderCompleted` | → POS, Customer | order_id, status |
| `OrderCancelled` | → POS, Customer | order_id, reason |
| `PaymentCompleted` | → POS | transaction_id, amount |
| `StockUpdated` | → POS, Inventory UI | variant_id, new_balance |
| `LowStockAlert` | → Inventory UI | variant_id, threshold, balance |

Endpoint WS: `wss://api.dagana.example/ws?token=<access_token>` dengan subscribe channel `tenant:{tenant_id}:outlet:{outlet_id}`.

---

## 7. Status Code & Versioning

-   `200` sukses, `201` created, `204` deleted/no-content.
-   `4xx` error client sesuai tabel §3.3, `5xx` error server (minimal `500`, ideal `503` saat maintenance).
-   Perubahan breaking → `/api/v2`; penambahan field → minor update, dokumentasi changelog.
-   Semua endpoint aman: HTTPS, rate limiting (`429`), audit logging untuk mutasi.

---

## Document Status

| Property | Value |
|---|---|
| Product | Dagana |
| Document | API Specification |
| Version | v0.1 |
| Status | Draft untuk implementasi Phase 0 & 3 |
| Next Step | Authentication & RBAC design → System Architecture → Scaffold Phase 0 |