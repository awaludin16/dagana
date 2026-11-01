# Architecture — API Design

> **Status:** Draft baseline
> **API style:** REST
> **Version prefix:** `/api/v1`

## 1. Prinsip

- Laravel API adalah satu-satunya pemilik business rules dan authorization.
- Semua client memakai API yang sama. Jangan membuat aturan checkout berbeda untuk POS dan QR Ordering.
- Endpoint harus memvalidasi input di server dan memeriksa permission serta Business/Outlet scope.
- API response harus stabil dan tidak mengekspos field internal secara tidak sengaja.
- Perubahan kontrak harus disertai pembaruan tests dan dokumentasi.

## 2. Resource groups awal

Resource group berikut adalah baseline untuk pengelompokan endpoint, bukan spesifikasi endpoint final. Detail method, payload, status code, dan schema ditentukan sebelum implementasi fase terkait.

```text
/api/v1/auth
/api/v1/me
/api/v1/businesses
/api/v1/outlets
/api/v1/memberships
/api/v1/employees
/api/v1/roles
/api/v1/permissions
/api/v1/categories
/api/v1/menus
/api/v1/inventory
/api/v1/stock-movements
/api/v1/orders
/api/v1/payments
/api/v1/cash-sessions
/api/v1/tables
/api/v1/qr
/api/v1/reports
/api/v1/billing
/api/v1/audit-logs
```

## 3. Request processing boundary

```text
Route
  -> Authentication / trusted context
  -> Request validation
  -> Policy / permission + tenant/outlet scope
  -> Controller (HTTP adapter)
  -> Service / Action (use case)
  -> Database transaction / domain operations
  -> API Resource / consistent response
```

## 4. Contract details that must be documented per feature

Sebelum endpoint digunakan oleh lebih dari satu client, dokumentasikan minimal: method dan path, auth requirement, permission, Business/Outlet scope, request schema, response schema, error cases, pagination/filtering, idempotency requirement, dan event side effects. Gunakan OpenAPI atau format kontrak yang dipilih repository; jangan membuat kontrak duplikat yang tidak sinkron.

## 5. Operational endpoints

- `GET /up` — liveness Laravel; dipakai healthcheck container untuk memastikan proses aplikasi berjalan.
- `GET /api/v1/health` — readiness; memeriksa koneksi PostgreSQL dan Redis. Mengembalikan `200` dengan `{"status":"ok","checks":{...}}` saat siap dan `503` dengan `{"status":"unavailable"}` saat ada dependency gagal. Endpoint ini tidak memerlukan autentikasi dan tidak mengembalikan detail error internal.

## 6. Security and compatibility

- Jangan percaya `business_id`, `outlet_id`, role, atau membership dari client sebelum divalidasi terhadap authenticated user.
- Jangan expose stack trace, SQL error, secret, atau internal filesystem path.
- Paginate list besar dan batasi filter/search.
- Perubahan enum/status/field/permission adalah perubahan kontrak dan harus diuji.
- Callback payment tidak boleh dianggap sukses hanya dari redirect client; verifikasi signature/webhook server-side.

Requirement produk yang mendasari API: `docs/requirements/identity-and-access.md`, `payments-and-cash.md`, dan `platform-quality.md`.
