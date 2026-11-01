# Requirement — Platform Quality & Security

> **Jenis dokumen:** Functional / non-functional requirements
> **Status:** Draft
> **Tujuan:** Mengatur persyaratan kualitas lintas modul: integritas transaksi, isolasi tenant, outlet context, realtime, offline, audit, dan keamanan.

Dokumen ini adalah sumber requirement untuk cakupan yang disebutkan. Interpretasi teknis berada di `docs/architecture/`; acceptance criteria implementasi berada di `docs/planning/phase-targets.md`. Jika behavior diubah, perbarui dokumen ini dan catat keputusan yang relevan.

---

## Transaction Integrity

Checkout harus atomic.

```text
BEGIN
Create Order
Create Order Items
Create Payment
Update Inventory
Create Stock Movement
Update Cash Session
Create Audit Event
COMMIT
```

Jika operasi kritis gagal:

```text
ROLLBACK
```

API transaksi harus mendukung idempotency.

---

---

## Multi-Tenancy

Model:

```text
Platform
   ↓
Business
   ↓
Outlet
   ↓
Membership
   ↓
Permission
```

Business A tidak boleh mengakses data Business B.

Authorization harus dilakukan di backend.

---

---

## Outlet Context

Data operasional harus memiliki outlet context jika relevan:

- order
- transaction
- payment
- cash session
- inventory
- stock movement
- table
- QR
- kitchen
- reporting

Untuk merchant satu outlet:

```text
Business
└── Outlet A
```

Untuk merchant berkembang:

```text
Business
├── Outlet A
├── Outlet B
└── Outlet C
```

Domain tetap sama.

---

---

## Realtime

WebSocket dapat digunakan untuk:

- QR order notification
- kitchen updates
- order status
- payment status
- stock updates

WebSocket hanya event delivery layer.

Database tetap menjadi source of truth.

---

---

## Offline POS

Offline tetap menjadi kemampuan arsitektur, tetapi tidak harus menjadi fitur kompleks pada tahap awal development.

Baseline:

- cached catalog
- local cart
- local transaction
- sync queue
- idempotency

Fitur seperti:

- QR Ordering
- centralized reporting
- billing
- external payment gateway

membutuhkan koneksi.

---

---

## Audit Log

Aktivitas kritis harus dapat dilacak.

Minimal:

- product changes
- price changes
- inventory adjustment
- transaction cancellation
- refund
- cash adjustment
- employee changes
- permission changes
- billing changes
- settings changes

Contoh:

```text
User: Budi
Action: CASH_SESSION_CLOSED
Expected: Rp2.550.000
Actual:   Rp2.500.000
Difference: -Rp50.000
Timestamp: ...
```

---

---

## Security

Minimal:

- HTTPS
- secure authentication
- authorization
- tenant isolation
- outlet authorization
- input validation
- rate limiting
- secure password storage
- token/session security
- idempotency
- audit logging

Frontend hanya membantu UX.

Security tetap berada di backend.

---
