# ADR-0001: Modular Monolith sebagai Arsitektur Awal

- **Status:** Accepted
- **Tanggal:** 2026-10-13
- **Pemilik:** Engineering

## Context

Dagana menangani beberapa domain yang saling berkaitan secara transaksional: POS, Order, Payment, Cash Session, Inventory, dan Reporting. PRD menetapkan bahwa semua channel (POS, QR, Admin) harus memakai satu order engine dan satu source of truth, serta bahwa checkout harus atomic.

Kita perlu memilih bentuk deployment dan batas modul awal. Opsi yang dipertimbangkan: monolith tradisional tanpa batas domain, microservices per domain, atau modular monolith.

## Options considered

1. **Modular monolith** — satu aplikasi Laravel, satu database PostgreSQL, dipisah berdasarkan domain/use case. Keuntungan: transaksi lintas domain tetap satu database transaction, operasional sederhana, batas domain tetap jelas. Risiko: disiplin batas modul harus dijaga manual.
2. **Microservices per domain** — keuntungan: scaling dan isolasi per domain. Risiko: transaksi lintas domain menjadi terdistribusi (saga/outbox), beban operasional besar, tidak sepadan untuk tahap MVP.
3. **Monolith tanpa batas** — keuntungan: paling cepat. Risiko: sulit dipisah dan diuji, melanggar PRD.

## Decision

Gunakan **modular monolith**: satu backend Laravel, satu primary database PostgreSQL, dengan batas domain yang eksplisit (lihat `docs/engineering-standards.md`). Pemisahan domain dilakukan pada level kode (namespace `app/Domain/<Domain>`), bukan level deployment.

## Consequences

- Checkout/payment/cash/inventory dapat berada dalam satu `DB::transaction()`, memenuhi persyaratan atomicity PRD.
- Satu source of truth untuk semua channel.
- Tidak ada kompleksitas jaringan internal, service discovery, atau distributed tracing di tahap ini.
- Trade-off: disiplin menjaga batas domain tidak ditegakkan oleh runtime; review dan struktur folder menjadi penjaga.
- Migrasi ke pemisahan service di masa depan tetap mungkin karena batas domain sudah jelas.

## Follow-up

- [ ] Tetapkan struktur `app/Domain/<Domain>` saat domain pertama dibangun (Phase 1+).
- [ ] Tambahkan aturan review agar controller tidak memuat business rule.
