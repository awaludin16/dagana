# Requirement — Inventory & Reporting

> **Jenis dokumen:** Functional / non-functional requirements
> **Status:** Draft
> **Tujuan:** Mengatur inventory, recipe/BOM, laporan, dan owner dashboard.

Dokumen ini adalah sumber requirement untuk cakupan yang disebutkan. Interpretasi teknis berada di `docs/architecture/`; acceptance criteria implementasi berada di `docs/planning/phase-targets.md`. Jika behavior diubah, perbarui dokumen ini dan catat keputusan yang relevan.

---

## Inventory

Inventory tetap tersedia, tetapi tidak boleh menghambat merchant untuk mulai berjualan.

Merchant dapat menggunakan:

```text
POS
```

tanpa harus menyelesaikan setup inventory terlebih dahulu.

Basic inventory:

- stock
- stock movement
- adjustment
- low stock

Recipe/BOM dapat digunakan oleh merchant yang membutuhkannya.

---

---

## Recipe & BOM

Recipe merupakan fitur untuk merchant yang membutuhkan kontrol bahan baku.

Contoh:

```text
Es Kopi Susu
    ↓
18g Coffee Bean
150ml Milk
20ml Syrup
1 Cup
1 Lid
```

Ketika transaksi terjadi:

```text
Sale
 ↓
Recipe
 ↓
Inventory Deduction
```

Recipe bukan dependency untuk transaksi sederhana jika inventory/recipe belum digunakan.

---

---

## Reporting

MVP reporting fokus pada informasi yang benar-benar berguna untuk owner.

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

### Inventory

- current stock
- stock movement
- low stock

### Business Summary

```text
Today
Sales             Rp...
Transactions      ...
Average Order     Rp...
Cash Variance     Rp...
```

---

---

## Owner Dashboard

Dashboard tidak boleh menjadi satu-satunya entry point.

Owner dapat melihat:

```text
Today's Sales
Transactions
Cash Status
Low Stock
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
