# Requirement — Catalog & POS

> **Jenis dokumen:** Functional / non-functional requirements
> **Status:** Draft
> **Tujuan:** Mengatur konteks operasional, catalog, POS, fast selling, quick sale, dan order.

Dokumen ini adalah sumber requirement untuk cakupan yang disebutkan. Interpretasi teknis berada di `docs/architecture/`; acceptance criteria implementasi berada di `docs/planning/phase-targets.md`. Jika behavior diubah, perbarui dokumen ini dan catat keputusan yang relevan.

---

## Operational Model

Dagana memiliki dua konteks utama:

### Operational Mode

Digunakan ketika merchant ingin bekerja:

```text
Sell
Orders
Payments
Cash
Kitchen
```

### Business Mode

Digunakan ketika merchant ingin mengelola:

```text
Products
Inventory
Employees
Reports
Settings
Billing
```

Keduanya berada dalam aplikasi yang sama.

---

---

## Catalog

Catalog harus sederhana untuk merchant kecil.

Merchant dapat mulai dengan:

```text
Category
Menu
Price
```

Tidak diwajibkan langsung membuat:

- ingredient
- recipe
- supplier
- SKU kompleks
- modifier kompleks

Contoh:

```text
Es Kopi Susu
Rp15.000
```

sudah cukup untuk mulai menjual.

---

---

## POS

POS adalah **core workflow Dagana**.

### 1 POS Principle

POS harus:

- cepat
- minim klik
- mudah dipahami
- usable di layar kecil
- tidak membutuhkan konfigurasi panjang

---

---

## Fast Selling Flow

Target flow:

```text
Open Cash Session
       ↓
POS
       ↓
Select Menu
       ↓
Cart
       ↓
Checkout
       ↓
Payment
       ↓
Transaction Complete
```

### 1 Returning Operator

Jika Cash Session masih aktif:

```text
Login
  ↓
Active Cash Session
  ↓
POS
```

Tidak perlu membuka session berulang kali.

---

---

## Quick Sale

Dagana dapat menyediakan konsep **Quick Sale** jika hasil validasi menunjukkan merchant sering menjual item yang belum terdaftar.

Contoh:

```text
Quick Sale
Rp10.000
```

Namun Quick Sale harus divalidasi sebelum menjadi bagian final MVP.

Tujuannya:

> Merchant tidak kehilangan transaksi hanya karena catalog belum lengkap.

---

---

## Order

Semua channel menggunakan Order Engine yang sama.

```text
POS
 ↓
Order Engine
 ↓
Payment
 ↓
Inventory
 ↓
Reporting
```

QR:

```text
QR
 ↓
Order Engine
 ↓
Payment
 ↓
Inventory
 ↓
Reporting
```

Order source:

```text
POS
QR
ADMIN
```

---
