# Authentication & RBAC Design --- Dagana

> **Dokumen Teknis**
> **Modul:** Authentication & RBAC v0.1
> **Acuan:** PRD §17, §20, §21, §22; `docs/domain-modeling.md`; `docs/ERD.md`; `docs/API-Specification.md`
> **Stack:** Laravel + PostgreSQL (RLS)
> **Status:** Draft untuk implementasi Phase 0

---

## Table of Contents

1. [Tujuan & Prinsip](#1-tujuan--prinsip)
2. [Model Identitas & Akses](#2-model-identitas--akses)
3. [Token Lifecycle](#3-token-lifecycle)
4. [Multi-Tenant Scope](#4-multi-tenant-scope)
5. [Model RBAC](#5-model-rbac)
6. [Matriks Permission Lengkap](#6-matriks-permission-lengkap)
7. [Enforcement di Backend](#7-enforcement-di-backend)
8. [Integrasi RLS PostgreSQL](#8-integrasi-rls-postgresql)
9. [Audit Log](#9-audit-log)
10. [Keamanan](#10-keamanan)
11. [Implementasi Laravel](#11-implementasi-laravel)
12. [Open Items](#12-open-items)

---

## 1. Tujuan & Prinsip

Mendefinisikan bagaimana identitas, autentikasi, dan otorisasi bekerja di seluruh channel (POS, Admin Dashboard, Customer Web) dengan **satu mekanisme yang sama**.

Prinsip kunci (PRD §17, §20):

> -   **Authorization dilakukan di backend.** Frontend hanya mengontrol visibility/UX.
> -   **Tenant isolation diterapkan di backend**, RLS sebagai lapisan pengaman terakhir.
> -   Token/session aman; password disimpan secure.

---

## 2. Model Identitas & Akses

Sesuai ERD (Identity & Tenancy):

```
users (global)
  │
  ├── sessions            → refresh token (hash), expires, revoked
  │
  ├── memberships         → user ↔ tenant + role   (UNIQUE user+tenant)
  │     └── roles
  │           └── role_permission → permission
  │
  └── outlet_assignments  → user ↔ outlet          (per tenant)
```

| Konsep | Entity | Catatan |
|---|---|---|
| Identitas | `users` | Global; `status` = `ACTIVE`/`DISABLED` |
| Keanggotaan tenant | `memberships` | User bisa di banyak tenant (**D2**) |
| Role per tenant | `roles` | Role built-in yang bisa disalin ke custom role |
| Assignment outlet | `outlet_assignments` | User bisa kerja di banyak outlet (**D3**) |
| Sesi | `sessions` | Refresh token hashed; rotation |

> Satu user memiliki **satu role aktif per tenant** melalui membership. Variasi per outlet tidak didukung di MVP (dipertimbangkan post-MVP).

---

## 3. Token Lifecycle

Menggunakan **JWT access token + refresh token (rotation)**.

### 3.1 Jenis Token

| Token | Umur | Penyimpanan | Tujuan |
|---|---|---|---|
| Access token (JWT) | 15 menit | Client (POS: secure storage; Web: httpOnly cookie/memory) | Setiap request API + koneksi WebSocket |
| Refresh token | 30 hari | Server (`sessions`, **hanya hash disimpan**) | Mendapatkan access token baru |

### 3.2 Alur

```text
POST /auth/login
  → validate email+password (argon2id/bcrypt)
  → buat session row (refresh_token = random, simpan hash)
  → issue access token (claims di bawah)
  → 200 { access_token, refresh_token, expires_in, user, tenants[] }

POST /auth/refresh { refresh_token }
  → cari session by hash, cek expires & revoked
  → ROTASI: revoke session lama, buat session baru
  → issue access token baru
  → 200 { access_token, refresh_token (baru), expires_in }

POST /auth/logout { refresh_token }
  → revoke session → akses mati

POST /auth/switch-tenant { tenant_id }
  → validasi membership user di tenant tsb
  → issue access token baru dgn tenant_id aktif berubah
```

### 3.3 JWT Claims

```json
{
  "iss": "https://api.dagana.example",
  "sub": "<user_id>",
  "jti": "uuid-session-id",
  "iat": 1750000000,
  "exp": 1750000900,
  "tenant_id": "<tenant_uuid>",
  "outlet_ids": ["<outlet_uuid>", "..."],
  "role_code": "MANAGER",
  "session_version": 3
}
```

**Keputusan:** permission **tidak** diembed penuh ke JWT. Backend me-resolve permissions dari DB via cache Redis (`permissions:{tenant_id}:{role_id}`) setiap request. Alasannya: perubahan role langsung berlaku tanpa menunggu token expire, dan JWT tetap kecil.

### 3.4 Revocation

-   Access token short-lived → tidak butuh revoke massal.
-   Refresh token → revoke via `sessions.revoked = true`.
-   **Session versioning**: field `session_version` pada JWT untuk *force logout* semua sesi user (bump version → semua token lama ditolak).
-   `DISABLED` user → semua request ditolak (cek `users.status` di middleware auth).

---

## 4. Multi-Tenant Scope

Setiap request bisnis membawa scope aktif:

| Header | Sumber | Validasi |
|---|---|---|
| `X-Tenant-Context` | Token default (`tenant_id`) atau switch | Membership aktif (status) |
| `X-Outlet-Context` | Pilihan kasir/dashboard | OutletAssignment di tenant aktif |

Aturan middleware (urutan check):

```text
1. Auth: access token valid, user ACTIVE, session_version OK
2. Tenant scope: tenant_id ada & user punya membership aktif
3. Outlet scope: outlet_id ∈ user.outlet_ids (jika endpoint membutuhkan)
4. Permission: role aktif memiliki permission yang dibutuhkan
```

Setiap langkah gagal → `401` / `403` dengan kode error jelas (`UNAUTHENTICATED`, `FORBIDDEN`, `OUTLET_SCOPE_REQUIRED`).

---

## 5. Model RBAC

### 5.1 Role Built-in (PRD §17)

| Role | Konteks | Inti aktivitas |
|---|---|---|
| `OWNER` | Tenant | Semua akses, kelola tenant/outlet/user/reports |
| `MANAGER` | Tenant / outlet | Operasional outlet, kelola kasir & inventory & reports |
| `CASHIER` | Outlet | Transaksi POS, pembayaran, service pelanggan |
| `INVENTORY` | Outlet | Stock opname, adjustment, receiving |

### 5.2 Kode Permission (granular)

Format: `<resource>.<action>` — mengikuti contoh PRD §17.

```
tenants.read, tenants.update
outlets.read, outlets.create, outlets.update, outlets.delete
users.read, users.create, users.update, users.delete
roles.read, roles.update

categories.read, categories.create, categories.update, categories.delete
products.read, products.create, products.update, products.delete

inventory.read, inventory.adjust, inventory.stock_opname, inventory.receiving

orders.read, orders.create, orders.cancel, orders.refund
payments.read, payments.create, payments.refund

tables.read, tables.create, tables.update
menu.read, menu.update

customers.read, customers.create, customers.update
reports.read
audit_logs.read
```

### 5.3 Custom Role (post-scaffold)

`roles` per tenant bisa dibuat custom dengan memilih subset permission codes. Role **built-in** sebagai template awal (seeding).

---

## 6. Matriks Permission Lengkap

| Resource | Action | OWNER | MANAGER | CASHIER | INVENTORY |
|---|---|---|:---:|:---:|:---:|:---:|
| tenants | read / update | ✅ / ✅ | – / – | – | – |
| outlets | read / create / update / delete | ✅ x4 | ✅ / – / – / – | – | – |
| users | read / create / update / delete | ✅ x4 | ✅ / – / – / – | – | – |
| roles | read / update | ✅ x2 | ✅ / – | – | – |
| categories | read / create / update / delete | ✅ x4 | ✅ / ✅ / ✅ / – | – | – |
| products | read / create / update / delete | ✅ x4 | ✅ / ✅ / ✅ / – | ✅ / – / – / – | ✅ / – / – / – |
| inventory | read / adjust / stock_opname / receiving | ✅ x4 | ✅ x4 | read | ✅ x4 |
| orders | read / create / cancel / refund | ✅ x4 | ✅ x4 | ✅ / ✅ / – / – | read |
| payments | read / create / refund | ✅ x3 | ✅ x3 | ✅ / ✅ / – | read |
| tables | read / create / update | ✅ x3 | ✅ x3 | ✅ / – / – | – |
| menu | read / update | ✅ x2 | ✅ x2 | ✅ / – | – |
| customers | read / create / update | ✅ x3 | ✅ x3 | ✅ / ✅ / – | read |
| reports | read | ✅ | ✅ | – | – |
| audit_logs | read | ✅ | ✅ | – | – |

Konvensi: `✅ xN` = semua action; `–` = tidak ada akses; kolom kosong = tidak relevan. Detail matrix final disimpan sebagai seeder database.

---

## 7. Enforcement di Backend

### 7.1 Lapisan

```text
HTTP Request
   → Route middleware: auth (JWT)
   → TenantScope middleware  (set tenant_id aktif)
   → OutletScope middleware  (set outlet_id aktif jika perlu)
   → Permission middleware   (check permission codes via cache)
   → Controller / Service    (business logic + model policy)
   → DB (RLS sebagai jaring pengaman terakhir)
```

### 7.2 Contoh (konseptual Laravel)

```php
// routes per modul menggunakan middleware permission
Route::middleware(['auth:api', 'tenant.scope', 'permission:products.create'])
    ->group(function () {
        Route::post('/products', [ProductController::class, 'store']);
    });

// service layer tetap memvalidasi scope secara eksplisit (defense in depth)
$outlet = Outlet::findOrFail($request->header('X-Outlet-Context'));
$this->authorize('create', [$product, $outlet]);
```

Prinsip: **frontend dapat menyembunyikan UI sesuai permission, tetapi backend TIDAK PERNAH bergantung pada kehadiran/ketiadaan UI untuk keamanan.**

---

## 8. Integrasi RLS PostgreSQL

Keputusan D1 (shared schema + RLS) diterapkan dengan:

### 8.1 Setup Per-Tenant

```sql
-- Dalam transaksi request, middleware mengeksekusi:
SELECT set_config('app.current_tenant_id', :tenant_uuid, true); -- *local*
SELECT set_config('app.current_outlet_id', :outlet_uuid, true);

-- RLS diaktifkan utk semua tabel ber-tenant
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY products_tenant_isolation ON products
  USING (tenant_id = current_setting('app.current_tenant_id', true));
```

### 8.2 DB Role Terbatas

-   Koneksi aplikasi memakai DB role (mis. `dagana_app`) yang **tidak punya `BYPASSRLS`**.
-   Tidak ada jalan lain bagi aplikasi untuk membaca lintas-tenant kecuali melewati policy.
-   Policy outlet-level (opsional): barang/jurnal outlet terlihat hanya bila `current_setting('app.current_outlet_id')` sesuai, untuk akses CASHIER/INVENTORY.

### 8.3 Error Handling

Saat policy menolak → database mengembalikan `no rows`/`permission denied` → aplikasi memetakan ke `404 NOT_FOUND` atau `403 FORBIDDEN` (tidak membocorkan keberadaan data antar-tenant).

> Generator policy otomatis: migration membuat helper SQL yang menambahkan policy seragam ke semua tabel ber-`tenant_id` agar tidak terlewat.

---

## 9. Audit Log

Aktivitas mutasi penting dicatat (PRD §21): perubahan produk/harga, inventory adjustment, batalkan transaksi, refund, perubahan user/permission.

Struktur log (bisa kolom atau relasi ke `audit_logs`):

| Field | Isi |
|---|---|
| `actor_id` / `actor_name` | User pelaku |
| `tenant_id` / `outlet_id` | Konteks |
| `action` | `UPDATE_PRODUCT`, `STOCK_ADJUSTMENT`, `ORDER_CANCELLED`, `REFUND`, `ROLE_CHANGED` |
| `resource` + `resource_id` | Objek yang diubah |
| `old_value` / `new_value` | Snapshot JSON sebelum/sesudah |
| `ip`, `user_agent` | Metadata request |

Penerapan: middleware/observer otomatis untuk modul sensitive; endpoint `GET /audit-logs` hanya OWNER/MANAGER.

---

## 10. Keamanan

| Aspek | Kebijakan |
|---|---|
| Hash password | `argon2id` (Laravel default) atau bcrypt cost ≥ 10 |
| Transport | HTTPS wajib; token tidak pernah di URL |
| Penyimpanan token client | POS: secure storage (Keychain/Keystore); Web: refresh token di httpOnly+Secure cookie, access token di memory |
| Refresh rotation | Setiap refresh → session lama di-revoke (deteksi *token reuse* → revoke semua sesi user) |
| Session versioning | Force logout massal via `session_version` |
| Rate limit | `/auth/login` & `/auth/refresh` ketat (mis. 5/menit/IP + per-user lockout incremental) |
| CORS | Whitelist domain dashboard & POS origin |
| JWT secret | Dipecah per environment, rotasi aman |
| Request validation | Seluruh input via FormRequest/Laravel validation |
| Idempotency | Header `Idempotency-Key` pada checkout (PRD §15) |

---

## 11. Implementasi Laravel

### 11.1 Komponen

| Kebutuhan | Opsi |
|---|---|
| JWT | `lcobucci/jwt` atau `tymon/jwt-auth` (pakai custom claims) |
| Guard | Custom `JwtGuard` (resolve user by `sub`, cek `status` & `session_version`) |
| Middleware | `auth:api`, `tenant.scope`, `outlet.scope`, `permission:{code}` |
| Cache permission | Redis — invalidate saat role/user diubah (event `RoleChanged`) |
| Seeder | Role built-in + permission codes awal (sesuai matriks §6) |

### 11.2 Modul Kode (Modular Monolith)

```text
app/Modules/
├── Identity/
│   ├── Http/Middleware/JwtGuard.php
│   ├── Http/Controllers/AuthController.php (login, refresh, logout, switch-tenant)
│   ├── Models/User.php, Role.php, Permission.php, Session.php
│   └── Services/TokenService.php
├── Tenancy/
│   ├── Models/Tenant.php, Outlet.php, Membership.php, OutletAssignment.php
│   └── Http/Middleware/TenantScope.php, OutletScope.php
└── Shared/
    ├── Http/Middleware/Permission.php
    └── Database/Rls/ (policy generator + set_config wiring)
```

---

## 12. Open Items

-   [ ] Pilih library JWT (`lcobucci/jwt` vs `tymon/jwt-auth`) saat scaffold
-   [ ] Kebijakan refresh token expiry (30 hari?) & sliding session
-   [ ] Custom role builder UI (post-scaffold)
-   [ ] Apakah CASHIER/inventory perlu policy outlet-level pada RLS (default: ya)
-   [ ] 2FA / email verification (post-MVP)

---

## Document Status

| Property | Value |
|---|---|
| Product | Dagana |
| Document | Authentication & RBAC Design |
| Version | v0.1 |
| Status | Draft untuk implementasi Phase 0 |
| Next Step | System Architecture → Scaffold Phase 0 (repo, auth, tenant baseline) |