# Requirement — Platform Billing

> **Jenis dokumen:** Functional / non-functional requirements
> **Status:** Draft
> **Tujuan:** Mengatur billing platform sebagai domain terpisah dari pembayaran customer.

Dokumen ini adalah sumber requirement untuk cakupan yang disebutkan. Interpretasi teknis berada di `docs/architecture/`; acceptance criteria implementasi berada di `docs/planning/phase-targets.md`. Jika behavior diubah, perbarui dokumen ini dan catat keputusan yang relevan.

---

## Billing

Billing merupakan domain platform.

Flow:

```text
Completed Transactions
       ↓
Eligible Sales
       ↓
Billing Rule
       ↓
Platform Fee
       ↓
Billing Statement
```

Billing tidak boleh mengubah data transaksi operasional.

Formula dan rate belum final.

---
