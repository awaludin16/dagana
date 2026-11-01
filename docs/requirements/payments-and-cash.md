# Requirement — Payments & Cash

> **Jenis dokumen:** Functional / non-functional requirements
> **Status:** Draft
> **Tujuan:** Mengatur metode/status pembayaran, Cash Session, dan rekonsiliasi kas.

Dokumen ini adalah sumber requirement untuk cakupan yang disebutkan. Interpretasi teknis berada di `docs/architecture/`; acceptance criteria implementasi berada di `docs/planning/phase-targets.md`. Jika behavior diubah, perbarui dokumen ini dan catat keputusan yang relevan.

---

## Payment

MVP baseline:

- Cash
- QR payment
- Bank transfer
- Debit
- Credit

Payment menyimpan:

- order
- method
- amount
- status
- reference
- timestamp
- actor

Status:

```text
PENDING
PAID
FAILED
REFUNDED
PARTIALLY_REFUNDED
```

---

---

## Cash Session

Untuk MVP, Dagana menggunakan **Cash Session**, bukan Shift Management kompleks.

Cash Session berfungsi sebagai konteks tanggung jawab kas.

### 1 Opening

```text
Operator
   ↓
Open Cash Session
   ↓
Input Opening Cash
```

Contoh:

```text
Opening Cash
Rp500.000
```

### 2 During Session

Sistem mencatat:

- cash sales
- non-cash sales
- cash in
- cash out
- refund
- permitted adjustment

### 3 Closing

```text
Expected Cash
      vs
Actual Cash
```

Contoh:

```text
Opening Cash     Rp500.000
Cash Sales       Rp2.000.000
Cash In          Rp100.000
Cash Out         Rp50.000
Refund           Rp0
-------------------------
Expected Cash    Rp2.550.000
Actual Cash      Rp2.500.000
Difference       -Rp50.000
```

### 4 Variance

Formula:

```text
Difference =
Actual Cash - Expected Cash
```

Sistem tidak boleh langsung menyimpulkan penyebab selisih.

Operator dapat memberikan:

```text
Note / Explanation
```

Contoh:

```text
"Uang digunakan membeli gas."
```

---

---

## Why Cash Session Matters

Cash Session menjadi penghubung:

```text
Operator
   ↓
Transactions
   ↓
Payments
   ↓
Cash
   ↓
Reconciliation
```

Hal ini memungkinkan Dagana mengetahui:

> siapa yang sedang bertanggung jawab terhadap transaksi dan kas.

Ini tetap berlaku walaupun operator tersebut adalah Owner.

---

---

## Tidak Menggunakan Shift Management Kompleks di MVP

MVP tidak membutuhkan:

- jadwal kerja
- attendance
- shift scheduling
- payroll
- employee roster kompleks

Fokus:

> **Siapa yang sedang berjualan dan bagaimana kondisi kasnya?**

Fitur shift kompleks dapat dikembangkan kemudian jika benar-benar dibutuhkan.

---
