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
- amount tendered dan change untuk transaksi cash
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

### Alur pembayaran MVP (tanpa gateway)

Fase Order Engine berjalan **tanpa integrasi payment gateway**. Metode dikelompokkan dua alur:

- **Cash:** pembayaran langsung dicatat berhasil (`PAID`) saat checkout. Backend menyimpan payment record lengkap (termasuk siapa yang mengonfirmasi dan kapan), lalu order dapat diselesaikan sesuai aturan transaksi. Konsistensi Order–Payment–Cash Session harus terjaga begitu Cash Session tersedia; penjualan cash tidak boleh mengurangi integritas transaksi hanya karena gateway belum ada.
- **Non-cash (QR payment, bank transfer, debit, credit):** payment dapat berstatus `PENDING`. Konfirmasi manual ke `PAID` hanya boleh dilakukan pengguna yang memiliki izin (`payments.create`, akses outlet sah) dan sudah memverifikasi pembayaran. Sistem harus mencatat siapa yang melakukan konfirmasi dan kapan (`confirmed_by`, `paid_at`). Pembayaran non-cash belum boleh ditandai sebagai terverifikasi otomatis; QR payment otomatis baru dapat diklaim setelah integrasi provider, verifikasi callback/webhook, dan pengujian settlement tersedia (D-15/D-16).
- Pada checkout cash, `amount_tendered` wajib dikirim sebagai integer rupiah, divalidasi terhadap total final backend, dan `change_amount` disimpan untuk receipt. `qr_code_payload` adalah field response nullable; QRIS tidak dapat dipakai bila backend belum menyediakan payload. Penambahan kontrak ini tidak mengaktifkan payment gateway.

### Refund

Refund **belum tersedia** pada MVP saat ini. Status `REFUNDED`/`PARTIALLY_REFUNDED` hanya tersimpan sebagai nilai status di model; belum ada state transition atau endpoint yang dapat mencapainya. Implementasi refund harus memiliki aturan bisnis, otorisasi, audit trail, dan pencatatan finansial yang sesuai sebelum diaktifkan. Jangan menganggap enum/model tersedia berarti fiturnya sudah didukung secara fungsional.

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
