# Requirement — MVP Scope & Primary Workflows

> **Jenis dokumen:** Product scope / functional requirements
> **Status:** Draft
> **Tujuan:** Menetapkan batas MVP dan alur utama agar implementasi tidak melebar.

Dokumen ini menjadi rujukan utama untuk fitur yang masuk/keluar MVP. Detail behavior modul tetap dijelaskan pada dokumen requirement khusus.

---

## Core modules

| Module | Tanggung jawab |
|---|---|
| Identity | Authentication dan user |
| Organization | Business dan membership |
| Outlet | Outlet dan operating context |
| Authorization | Role, permission, outlet access |
| Catalog | Menu, category, price |
| Sales / POS | Order dan selling workflow |
| Payment | Payment dan settlement |
| Cash | Cash Session dan rekonsiliasi |
| Inventory / Recipe | Stock, movement, recipe/BOM |
| Ordering / Tables | POS dan QR order, table/session |
| Kitchen | Preparation workflow |
| Reporting | Sales dan business reports |
| Billing | Platform fee |
| Audit / Notification | Riwayat aktivitas penting dan notifikasi |

---

## MVP Scope

MVP harus fokus pada:

> **Merchant dapat daftar → setup bisnis → tambah menu → buka kas → jual → bayar → tutup kas → melihat hasil penjualan.**

### 1 Authentication

Included:

- registration
- login
- logout
- user profile

### 2 Business & Outlet

Included:

- create business
- create first outlet
- business settings dasar
- outlet settings dasar

### 3 Owner-as-Operator

Included:

- Owner default POS access
- Owner dapat membuat transaksi
- Owner dapat menerima payment
- Owner dapat membuka Cash Session
- Owner dapat menutup Cash Session

### 4 Employee

Included:

- employee invitation
- membership
- role preset
- permission
- outlet access

Employee setup bersifat optional.

### 5 Catalog

Included:

- category
- menu
- price
- active/inactive
- basic availability

### 6 POS

Included:

- menu search
- cart
- quantity
- checkout
- payment
- transaction complete
- transaction history
- receipt dasar

### 7 Cash

Included:

- open Cash Session
- opening cash
- cash sales
- cash in
- cash out
- close Cash Session
- expected cash
- actual cash
- variance
- note

### 8 Basic Inventory

Included:

- ingredient/item
- stock
- stock adjustment
- stock movement
- low stock

Inventory tidak wajib diaktifkan untuk mulai berjualan.

### 9 Reporting

Included:

- daily sales
- transaction count
- payment report
- operator report
- cash reconciliation
- basic inventory report

### 10 QR Ordering

Optional MVP module:

- table
- QR
- customer menu
- guest cart
- order creation
- order status

POS tetap berfungsi jika QR disabled.

### 11 Billing

Infrastructure:

- billing configuration
- billing period
- billable sales
- platform fee
- billing statement
- billing view

---

---

## MVP Explicitly Excludes

Untuk menjaga scope:

- employee scheduling
- attendance
- payroll
- full accounting
- advanced CRM
- loyalty
- promotion engine
- advanced recipe
- supplier management
- purchase order
- central kitchen
- advanced KDS
- advanced table management
- split bill
- complex offline conflict resolution
- AI analytics

---

---

## Primary MVP Workflow

Workflow utama Dagana:

```text
REGISTER
   ↓
CREATE BUSINESS
   ↓
CREATE OUTLET
   ↓
ADD MENU
   ↓
START SELLING
   ↓
OPEN CASH SESSION
   ↓
POS
   ↓
SELECT MENU
   ↓
CHECKOUT
   ↓
PAYMENT
   ↓
TRANSACTION COMPLETE
   ↓
CASH / INVENTORY UPDATE
   ↓
DAILY REPORT
   ↓
CLOSE CASH SESSION
   ↓
RECONCILIATION
```

---

---

## Solo Merchant Workflow

Contoh:

```text
Budi
 │
 ├── Owner
 │
 ├── Operator
 │
 └── Cash Session Owner
```

Flow:

```text
Login
 ↓
Open Cash Session
 ↓
Mulai Jualan
 ↓
Customer
 ↓
POS
 ↓
Payment
 ↓
Transaction
 ↓
Continue Selling
 ↓
Close Cash Session
```

Tidak ada employee setup.

---

---

## Merchant with Employee Workflow

```text
Owner
 │
 ├── Owner + POS
 │
 └── Employee
       ↓
    CASHIER
       ↓
      POS
```

Owner masih dapat berjualan.

---

---

## Multi-Outlet Workflow

```text
Business
 │
 ├── Outlet A
 │     ├── Owner
 │     └── Cashier
 │
 ├── Outlet B
 │     ├── Manager
 │     └── Cashier
 │
 └── Outlet C
       └── Cashier
```

Permission dan outlet access menentukan apa yang dapat dilakukan setiap user.

---
