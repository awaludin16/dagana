# ADR-0002: Model Multi-Tenancy dan Outlet Scoping

- **Status:** Accepted
- **Tanggal:** 2026-10-13
- **Pemilik:** Engineering

## Context

Dagana adalah SaaS multi-tenant. Relasi inti dari PRD adalah `User -> Membership -> Business -> Outlet -> Permission`. Business A tidak boleh mengakses data Business B, dan user tanpa outlet access tidak boleh beroperasi pada outlet tersebut. Keputusan ini sulit dibalik karena menentukan bentuk tabel, query scoping, dan authorization.

## Options considered

1. **Single database, row-level tenant scoping (`business_id`)** — satu database, setiap record milik tenant diberi `business_id` (dan `outlet_id` bila relevan). Keuntungan: sederhana secara operasional, mudah diuji, cocok untuk modular monolith. Risiko: setiap query wajib di-scope; kesalahan scoping berakibat kebocoran data.
2. **Database per tenant** — isolasi fisik kuat. Risiko: operasional berat, migrasi tersebar, tidak cocok untuk MVP.
3. **Schema per tenant** — kompromi. Risiko: kompleksitas migration/connection, tetap tidak diperlukan sekarang.

## Decision

Gunakan **single database dengan row-level tenant scoping** berbasis `business_id`, ditambah `outlet_id` pada record operasional yang memang outlet-scoped (order, payment, cash session, inventory, stock movement, table, QR, kitchen, reporting).

Aturan wajib:
- Semua business record memiliki `business_id`.
- Record operasional outlet memiliki `outlet_id`.
- Context bisnis/outlet di-resolve dari authenticated membership yang tervalidasi di backend, bukan dari input client.
- Query selalu di-scope ke `business_id`/`outlet_id` sebelum mengambil record by ID.
- Permission dan outlet access diperiksa server-side.

## Consequences

- Satu skema migration untuk seluruh tenant; mudah diuji dan di-deploy.
- Wajib ada test lintas tenant (Business A tidak bisa baca/ubah data Business B) dan test outlet access.
- Foreign key dan composite unique index harus menyertakan `business_id`/`outlet_id` bila relevan.
- Risiko human error scoping dimitigasi lewat helper context eksplisit, Policy, dan test negatif.

## Follow-up

- [ ] Buat helper resolusi active business/outlet context saat domain Organization dibangun.
- [ ] Tambahkan test lintas tenant pada setiap endpoint tenant-owned.
