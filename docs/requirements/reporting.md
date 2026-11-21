# Requirement — Reporting

> **Jenis dokumen:** Functional / non-functional requirements
> **Status:** Draft
> **Tujuan:** Mengatur laporan dan owner dashboard.

Dokumen ini adalah sumber requirement untuk cakupan yang disebutkan. Interpretasi teknis berada di `docs/architecture/`; acceptance criteria implementasi berada di `docs/planning/phase-targets.md`. Jika behavior diubah, perbarui dokumen ini dan catat keputusan yang relevan.

Ketersediaan menu bukan bagian laporan; aturannya ada di [`catalog-and-pos.md`](catalog-and-pos.md) dan D-39.

---

## Reporting

MVP reporting fokus pada informasi yang benar-benar berguna untuk owner.

> **Implementasi (Phase 7):** laporan tersedia sebagai endpoint read-only `GET /api/v1/reports/{sales,payments,operators,cash}` dengan permission `reports.read`. Definisi agregasi (order `PAID` berbasis snapshot, pembatasan pending/failed, basis tanggal, periode maksimal 92 hari mengikuti jam aplikasi Asia/Jakarta) didokumentasikan di `docs/architecture/api-design.md` §12 dan D-33. `reports.export`, accounting penuh, dan AI analytics belum termasuk MVP.

### Sales

- sales today
- sales by date
- transaction count
- sales by payment method
- sales by product
- sales by operator
- refund
- discount

### Cash

- opening cash
- cash sales
- cash in
- cash out
- expected cash
- actual cash
- variance

### Business Summary

```text
Today
Sales             Rp...
Transactions      ...
Average Order     Rp...
Cash Variance     Rp...
```

---

## Owner Dashboard

Dashboard tidak boleh menjadi satu-satunya entry point.

Owner dapat melihat:

```text
Today's Sales
Transactions
Cash Status
Recent Orders
```

Tetapi primary action tetap:

> **Mulai Jualan**

Contoh:

```text
Good Morning, Budi
Today's Sales
Rp1.250.000
Transactions
82
Cash Session
OPEN
[ MULAI JUALAN ]
Recent Transactions
...
```

---
