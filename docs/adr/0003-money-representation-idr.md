# ADR-0003: Representasi Uang sebagai Integer Rupiah

- **Status:** Accepted
- **Tanggal:** 2026-10-13
- **Pemilik:** Engineering

## Context

Dagana fokus pada pasar Indonesia. Nilai transaksi (harga menu, pembayaran, kas, kembalian, platform fee) harus akurat dan tidak boleh kehilangan presisi. Keputusan ini menyentuh seluruh skema, perhitungan, dan kontrak API, sehingga sulit dibalik.

## Options considered

1. **Integer whole rupiah (`BIGINT`)** — uang disimpan sebagai bilangan bulat rupiah, tanpa desimal. Keuntungan: bebas galat floating-point, aritmetika eksak, sederhana. Risiko: tidak mendukung pecahan/valuta asing tanpa perubahan model.
2. **`NUMERIC(p,s)`** — presisi eksak untuk pecahan. Keuntungan: fleksibel valuta asing. Risiko: lebih berat, tidak dibutuhkan untuk IDR, dan rawan tercampur dengan float di layer aplikasi.
3. **Floating-point (`FLOAT`/`DOUBLE`)** — ditolak karena galat pembulatan pada uang.

## Decision

Representasikan seluruh nilai IDR sebagai **integer whole rupiah** menggunakan kolom `BIGINT` (dan tipe integer di aplikasi/API). Tidak menggunakan float/double untuk perhitungan uang. Nilai uang yang dikirim/diterima API adalah integer rupiah.

## Consequences

- Aritmetika kas, total order, dan platform fee bersifat eksak.
- Format tampilan (`Rp15.000`) dilakukan di layer presentasi, bukan disimpan sebagai string.
- Mendukung nilai besar (mis. harga mahal / omzet tinggi) dengan headroom `BIGINT`.
- Trade-off: dukungan pecahan atau valuta asing memerlukan ADR lanjutan dan transisi model (mis. minor units per mata uang).
- Semua perubahan pada model uang harus disertai unit test perhitungan.

## Follow-up

- [ ] Terapkan cast/config pada model uang saat domain Catalog/Sales dibangun.
- [ ] Dokumentasikan aturan ini pada panduan kontribusi/API.
