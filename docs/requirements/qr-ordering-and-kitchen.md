# Requirement — QR Ordering & Kitchen

> **Jenis dokumen:** Functional / non-functional requirements
> **Status:** Draft
> **Tujuan:** Mengatur pemesanan pelanggan melalui QR dan persiapan pesanan di kitchen.

Dokumen ini adalah sumber requirement untuk cakupan yang disebutkan. Interpretasi teknis berada di `docs/architecture/`; acceptance criteria implementasi berada di `docs/planning/phase-targets.md`. Jika behavior diubah, perbarui dokumen ini dan catat keputusan yang relevan.

---

## QR Ordering

QR Ordering adalah **optional channel**.

Jika disabled:

```text
POS tetap berjalan.
```

Jika enabled:

```text
Customer
 ↓
Scan QR
 ↓
Menu
 ↓
Cart
 ↓
Order
 ↓
Order Engine
```

QR tidak boleh menjadi dependency POS.

---

---

## Kitchen Operations

Kitchen menerima order yang membutuhkan preparation.

Flow:

```text
Order Created
      ↓
Kitchen Queue
      ↓
Preparing
      ↓
Ready
      ↓
Completed
```

KDS advanced merupakan roadmap.

---
