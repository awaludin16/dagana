# ADR-0004: Penyimpanan Waktu UTC dan Timezone Tampilan Asia/Jakarta

- **Status:** Accepted
- **Tanggal:** 2026-10-13
- **Pemilik:** Engineering

## Context

Dagana menghasilkan banyak data bertimestamp: order, payment, cash session (open/close), stock movement, audit log, dan laporan harian. Laporan harian sensitif terhadap batas hari, sehingga penanganan timezone harus konsisten dan ditetapkan sejak awal. Keputusan ini memengaruhi kueri laporan dan tampilan.

## Options considered

1. **Simpan UTC, tampilkan/agregasi di timezone lokal (Asia/Jakarta)** — standar industri, aman terhadap perubahan daylight/region. Keuntungan: konsisten dan dapat diprediksi. Risiko: laporan "hari ini" harus dikonversi eksplisit.
2. **Simpan waktu lokal Asia/Jakarta tanpa offset** — kueri laporan harian langsung. Risiko: ambigu saat multi-outlet/multi-timezone dan integrasi eksternal.
3. **Simpan waktu lokal per outlet** — fleksibel untuk multi-region. Risiko: kompleksitas tinggi, belum dibutuhkan MVP.

## Decision

- Simpan semua timestamp dalam **UTC** (mengikuti konfigurasi aplikasi Laravel).
- Gunakan **Asia/Jakarta** sebagai timezone tampilan/agregasi default untuk MVP.
- Batas hari untuk laporan dan cash session ditentukan oleh timezone bisnis; konversi dilakukan eksplisit pada kueri laporan, bukan diasumsikan dari waktu server.

## Consequences

- Data waktu aman untuk multi-outlet dan integrasi eksternal.
- Kueri laporan harian harus mengonversi batas hari dari timezone bisnis ke UTC.
- Konsisten dengan standar `docs/engineering-standards.md` §4.
- Trade-off: developer harus sadar timezone saat menulis laporan; uji laporan di sekitar batas tengah malam.

## Follow-up

- [ ] Tetapkan `config('app.timezone')` dan konfigurasi timezone bisnis saat domain Organization/Cash dibangun.
- [ ] Tambahkan test batas hari (midnight boundary) pada laporan saat domain Reporting dibangun.
