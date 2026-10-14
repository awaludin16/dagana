# Dagana — F&B Business Operating Platform

> **Product Requirements Document (PRD)**

| Field   | Value                                                                                                                                                        |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Version | Draft v1.1 — Engineering Baseline                                                                                                                                         |
| Status  | Draft                                                                                                                                                        |
| Purpose | Menjadi acuan utama untuk product strategy, domain modeling, ERD, API specification, authorization design, system architecture, dan implementation planning. |

---

## Daftar Isi

- [1. Product Overview](#1-product-overview)
- [2. Product Vision](#2-product-vision)
- [3. Problem Statement](#3-problem-statement)
- [4. Product Positioning](#4-product-positioning)
- [5. Target Market](#5-target-market)
- [6. Product Goals](#6-product-goals)
- [7. Non-Goals](#7-non-goals)
- [8. Business Model](#8-business-model)
- [9. Organization & Multi-Tenancy](#9-organization--multi-tenancy)
- [10. Owner-as-Operator Model](#10-owner-as-operator-model)
- [11. Single Operator Mode](#11-single-operator-mode)
- [12. Onboarding](#12-onboarding)
- [13. User, Membership, Role & Permission](#13-user-membership-role--permission)
- [14. Role sebagai Permission Preset](#14-role-sebagai-permission-preset)
- [15. Permission Model](#15-permission-model)
- [16. Owner Default Permissions](#16-owner-default-permissions)
- [17. Employee Management](#17-employee-management)
- [18. Operational Model](#18-operational-model)
- [19. Core Modules](#19-core-modules)
- [20. Catalog](#20-catalog)
- [21. POS](#21-pos)
- [22. Fast Selling Flow](#22-fast-selling-flow)
- [23. Quick Sale](#23-quick-sale)
- [24. Order](#24-order)
- [25. Payment](#25-payment)
- [26. Cash Session](#26-cash-session)
- [27. Why Cash Session Matters](#27-why-cash-session-matters)
- [28. Tidak Menggunakan Shift Management Kompleks di MVP](#28-tidak-menggunakan-shift-management-kompleks-di-mvp)
- [29. Inventory](#29-inventory)
- [30. Recipe & BOM](#30-recipe--bom)
- [31. QR Ordering](#31-qr-ordering)
- [32. Kitchen Operations](#32-kitchen-operations)
- [33. Reporting](#33-reporting)
- [34. Owner Dashboard](#34-owner-dashboard)
- [35. Transaction Integrity](#35-transaction-integrity)
- [36. Multi-Tenancy](#36-multi-tenancy)
- [37. Outlet Context](#37-outlet-context)
- [38. Realtime](#38-realtime)
- [39. Offline POS](#39-offline-pos)
- [40. Audit Log](#40-audit-log)
- [41. Billing](#41-billing)
- [42. Security](#42-security)
- [43. API Architecture](#43-api-architecture)
- [44. Data Architecture](#44-data-architecture)
- [45. Architecture](#45-architecture)
- [46. Core Domain Relationship](#46-core-domain-relationship)
- [47. MVP Scope](#47-mvp-scope)
- [48. MVP Explicitly Excludes](#48-mvp-explicitly-excludes)
- [49. Primary MVP Workflow](#49-primary-mvp-workflow)
- [50. Solo Merchant Workflow](#50-solo-merchant-workflow)
- [51. Merchant with Employee Workflow](#51-merchant-with-employee-workflow)
- [52. Multi-Outlet Workflow](#52-multi-outlet-workflow)
- [53. Product Principles](#53-product-principles)
- [54. Product UX Philosophy](#54-product-ux-philosophy)
- [55. Success Metrics](#55-success-metrics)
- [56. Validation Metrics](#56-validation-metrics)
- [57. Post-MVP Roadmap](#57-post-mvp-roadmap)
- [58. Development Phases](#58-development-phases)
- [59. Initial Technical Stack](#59-initial-technical-stack)
- [60. Key Architectural Decisions](#60-key-architectural-decisions)
- [61. Open Decisions](#61-open-decisions)
- [62. Documentation Milestones](#62-documentation-milestones)
- [63. Revised Product Definition](#63-revised-product-definition)
- [64. Engineering Standards & Agent Rules](#64-engineering-standards--agent-rules)
- [65. Docker & Local Development](#65-docker--local-development)
- [Closing](#closing)

---

## 1. Product Overview

### 1.1 Product Name

**Dagana**

### 1.2 Product Category

**F&B Business Operating Platform**

Dagana adalah platform operasional bisnis Food & Beverage yang mengintegrasikan:

- Point of Sale (POS)
- Order Management
- Payment
- Cash Management
- Basic Inventory
- Product/Menu Management
- Reporting
- Employee & Permission Management
- QR Ordering
- Kitchen Operations
- Multi-outlet Management
- Usage-based Billing

Seluruh modul menggunakan:

> **Satu backend, satu business domain, dan satu source of truth.**

### 1.3 Product Scope

Dagana fokus pada bisnis F&B, terutama:

- warung
- food stall
- kedai
- booth makanan/minuman
- coffee stall
- usaha kuliner rumahan
- bakery kecil
- cafe kecil
- coffee shop
- restoran kecil
- bisnis F&B yang berkembang menjadi multi-outlet

Retail non-F&B bukan target awal Dagana.

---

## 2. Product Vision

> **Membantu bisnis F&B mencatat transaksi dengan cepat, mengelola operasional dengan sederhana, dan memahami kondisi bisnis dari satu platform yang dapat berkembang bersama usahanya.**

Dagana harus dapat digunakan oleh merchant yang:

```text
1 Owner
    ↓
1 Outlet
    ↓
Owner jualan sendiri
```

maupun:

```text
1 Owner
    ↓
1 Business
    ↓
1 Outlet
    ↓
Beberapa Employee
    ↓
Owner + Employee dapat berjualan
```

hingga:

```text
1 Owner
    ↓
1 Business
    ↓
Banyak Outlet
    ↓
Manager / Cashier / Inventory / Kitchen
    ↓
Centralized Reporting
```

Perbedaan skala tidak boleh membuat merchant harus berpindah sistem.

---

## 3. Problem Statement

Berdasarkan eksplorasi awal terhadap operasional bisnis F&B kecil, masalah utama bukan selalu karena merchant tidak memiliki aplikasi.

Sebagian merchant sudah nyaman menggunakan:

- Excel
- catatan manual
- kalkulator
- QRIS
- aplikasi pembayaran

Masalah muncul ketika transaksi terjadi dalam kondisi sibuk.

Contoh:

```text
Customer datang
      ↓
Merchant sibuk melayani
      ↓
Transaksi tidak langsung dicatat
      ↓
Mencoba mengingat kembali
      ↓
Pencatatan terlambat / tidak akurat
      ↓
Data transaksi berbeda dengan kondisi kas
```

Akibat yang mungkin terjadi:

- transaksi terlupa
- nominal tidak sesuai
- transaksi dicatat berdasarkan perkiraan
- kas aktual berbeda dengan catatan
- owner kesulitan mengetahui kondisi penjualan secara akurat

Karena itu, Dagana tidak diposisikan sebagai:

> "Excel versi aplikasi."

Dagana harus menyelesaikan workflow:

```text
TRANSACTION
    ↓
PAYMENT
    ↓
CASH
    ↓
REPORT
```

dengan inventory sebagai bagian operasional tambahan:

```text
TRANSACTION
    ↓
INVENTORY
```

### 3.1 Problem Utama MVP

> **Bagaimana membuat merchant dapat mencatat transaksi secara cepat dan akurat pada saat transaksi terjadi, sekaligus mengetahui kondisi kas dan penjualan tanpa proses administrasi yang rumit?**

---

## 4. Product Positioning

Dagana adalah:

> **F&B Operations Platform dengan POS sebagai core operational workflow.**

Core value flow:

```text
SELL
 ↓
PAY
 ↓
RECORD
 ↓
RECONCILE
 ↓
UNDERSTAND
```

Inventory menjadi bagian dari platform:

```text
SALE
 ↓
Inventory Impact
 ↓
Stock Information
```

QR Ordering dan Kitchen merupakan channel/modul tambahan yang menggunakan order engine yang sama.

### 4.1 Core Message

> **Catat transaksi lebih cepat. Tahu kondisi usaha lebih jelas.**

### 4.2 Product Philosophy

Dagana tidak berusaha menang melalui jumlah fitur.

Dagana harus:

- cepat
- sederhana
- mudah dipahami
- sedikit klik
- tidak memaksa setup yang belum dibutuhkan
- tetap memiliki fondasi teknis untuk berkembang

---

## 5. Target Market

### 5.1 Primary ICP — Solo / Micro F&B

Contoh:

- warung
- kedai minuman
- food stall
- booth
- coffee stall
- usaha kuliner rumahan

Karakteristik:

- 1 owner
- 1 outlet
- 0–5 employee
- owner sering ikut berjualan
- operasional sederhana
- transaksi dilakukan langsung di outlet

Kebutuhan utama:

- POS
- pembayaran
- pencatatan transaksi
- cash management
- laporan sederhana
- menu/product management

#### Karakteristik penting

Owner **tidak selalu bertindak sebagai manager saja**.

Owner dapat menjadi:

> **pemilik + kasir + operator.**

---

### 5.2 Secondary ICP — Small F&B Business

Contoh:

- cafe kecil
- coffee shop
- bakery
- restoran kecil
- kedai dengan beberapa pegawai

Karakteristik:

- 1–3 outlet
- beberapa employee
- owner mulai mendelegasikan operasional
- membutuhkan permission
- membutuhkan inventory lebih terstruktur

Kebutuhan tambahan:

- employee
- role
- outlet access
- inventory
- recipe
- QR Ordering
- table
- kitchen

---

### 5.3 Growing / Multi-Outlet

Contoh:

- cafe chain
- restaurant chain
- F&B group
- central kitchen

Kebutuhan:

- multi-outlet
- centralized catalog
- stock transfer
- outlet-level permission
- centralized reporting
- manager
- consolidated revenue
- billing

---

## 6. Product Goals

### 6.1 Primary Goals

1. Menyediakan POS F&B yang cepat.
2. Memungkinkan Owner langsung menggunakan POS.
3. Memungkinkan merchant mulai berjualan dengan setup minimal.
4. Menyediakan pencatatan transaksi yang akurat.
5. Menyediakan Cash Session untuk menghubungkan transaksi dengan kondisi kas.
6. Menyediakan laporan penjualan sederhana.
7. Menyediakan basic inventory.
8. Menyediakan permission yang fleksibel.
9. Mendukung employee tanpa memaksakan employee setup.
10. Mendukung satu maupun banyak outlet.
11. Menyediakan QR Ordering sebagai channel opsional.
12. Menjaga architecture siap berkembang tanpa membuat UX menjadi kompleks.

### 6.2 Business Goals

- Mendukung merchant F&B skala mikro hingga multi-outlet.
- Memungkinkan merchant mulai menggunakan Dagana tanpa setup panjang.
- Mengembangkan revenue platform melalui usage-based billing.
- Membangun fondasi SaaS F&B yang dapat berkembang secara bertahap.

---

## 7. Non-Goals

Tidak menjadi fokus awal:

- full accounting
- payroll
- HR management
- attendance
- employee scheduling
- marketplace
- delivery fleet management
- full ERP
- advanced CRM
- enterprise procurement
- retail non-F&B
- AI analytics
- loyalty kompleks
- promotion engine kompleks
- advanced KDS
- central kitchen kompleks

Fitur tersebut dapat dipertimbangkan setelah core operational workflow stabil.

---

## 8. Business Model

### 8.1 Principle

Dagana menggunakan konsep:

> **Pay as you grow.**

Merchant dengan omzet rendah tetap dapat menggunakan platform.

### 8.2 Usage-Based Platform Fee

Konsep awal:

```text
Completed Sales
      ↓
Eligible Sales
      ↓
Billing Rule
      ↓
Platform Fee
      ↓
Billing Statement
```

Formula final belum ditetapkan.

Billing harus menjadi domain terpisah dari payment customer.

---

## 9. Organization & Multi-Tenancy

### 9.1 Core Organization Model

Model organisasi:

```text
User
  ↓
Business Membership
  ↓
Business
  ↓
Outlet Access
  ↓
Permissions
```

Bukan:

```text
User
  ↓
Fixed Role
  ↓
Fixed Application
```

Role tidak boleh menentukan seluruh pengalaman aplikasi secara kaku.

---

## 10. Owner-as-Operator Model

Ini merupakan **keputusan product utama Dagana**.

### 10.1 Owner Dapat Berjualan

Owner harus dapat melakukan seluruh aktivitas operasional yang dibutuhkan tanpa harus membuat akun Cashier terlebih dahulu.

Contoh:

```text
Owner
  ↓
Login
  ↓
Open Cash Session
  ↓
POS
  ↓
Sell
  ↓
Payment
  ↓
Close Cash Session
```

Tidak boleh ada requirement:

```text
Owner
  ↓
Create Cashier
  ↓
Assign Cashier
  ↓
Login Cashier
  ↓
Start Selling
```

untuk merchant yang hanya dijalankan oleh satu orang.

---

## 11. Single Operator Mode

Dagana harus mendukung mode:

> **Single Operator**

Digunakan untuk merchant yang menjalankan bisnis sendiri.

Contoh:

```text
Pak Budi
   ↓
Owner
   ↓
Warung Budi
   ↓
1 Outlet
   ↓
Pak Budi jualan sendiri
```

Pada kondisi ini, Dagana tidak perlu menampilkan:

- employee management
- shift scheduling
- role administration
- employee assignment

sebagai bagian dari onboarding awal.

Fitur tersebut baru muncul ketika merchant membutuhkannya.

---

## 12. Onboarding

Onboarding harus mengikuti kebutuhan merchant, bukan struktur enterprise.

### 12.1 Target Flow

```text
Register
   ↓
Business Name
   ↓
Outlet
   ↓
Add Menu
   ↓
Start Selling
```

### 12.2 First-Time Merchant

Setelah registration:

```text
Create User
      ↓
Create Business
      ↓
Create First Outlet
      ↓
Create Owner Membership
      ↓
Grant Default Owner Permissions
      ↓
Add Menu
      ↓
Ready to Sell
```

### 12.3 Primary CTA

Aplikasi harus memiliki entry point yang jelas:

> **Mulai Jualan**

bukan:

> Kelola Organisasi

atau:

> Setup Business

Dashboard tetap tersedia, tetapi aktivitas menjual harus menjadi workflow utama.

---

## 13. User, Membership, Role & Permission

### 13.1 User

User merepresentasikan identitas seseorang.

Contoh:

```text
User
Muhamad
```

User tidak secara otomatis menjadi "cashier".

---

### 13.2 Business Membership

Membership merepresentasikan hubungan User dengan Business.

Contoh:

```text
Muhamad
   ↓
Member of
   ↓
Kopi Senja
```

Membership menyimpan konteks:

- business
- role/preset
- status
- permissions
- outlet access

---

### 13.3 Outlet Access

User dapat memiliki akses ke satu atau beberapa outlet.

Contoh:

```text
Muhamad
  ↓
Business: Kopi Senja
  ↓
Access:
- Bogor
- Depok
```

Owner secara default memiliki Business-wide access.

---

## 14. Role sebagai Permission Preset

Role bukan pembatas absolut.

Role merupakan kumpulan permission default.

Minimal preset:

```text
OWNER
MANAGER
CASHIER
INVENTORY
KITCHEN
STAFF
```

Contoh:

```text
OWNER
\= products.*
+ orders.*
+ payments.*
+ cash.*
+ reports.*
+ employees.*
+ settings.*
```

Namun permission tetap menjadi sumber authorization.

---

## 15. Permission Model

Contoh permission:

```text
products.read
products.create
products.update
products.delete
orders.read
orders.create
orders.update
orders.cancel
orders.refund
payments.read
payments.create
payments.refund
cash.open
cash.read
cash.cash_in
cash.cash_out
cash.close
cash.reconcile
inventory.read
inventory.adjust
inventory.stock_opname
reports.read
reports.export
employees.read
employees.create
employees.update
employees.disable
outlets.read
outlets.manage
settings.read
settings.update
qr.read
qr.manage
```

### 15.1 Important Rule

Jika user memiliki:

```text
orders.create
```

maka user dapat membuat transaksi.

Tidak peduli apakah role-nya:

```text
OWNER
CASHIER
MANAGER
CUSTOM ROLE
```

Authorization ditentukan oleh permission.

---

## 16. Owner Default Permissions

Owner yang membuat Business mendapatkan permission default untuk menjalankan bisnis.

Minimal:

```text
POS
Payment
Cash
Products
Reports
Inventory
Employees
Business Settings
Outlet Settings
Billing
```

Owner dapat langsung menjual tanpa konfigurasi tambahan.

---

## 17. Employee Management

Employee tidak wajib dibuat pada onboarding.

Employee management hanya dibutuhkan ketika merchant mulai bekerja dengan orang lain.

Flow:

```text
Owner
  ↓
Employee Management
  ↓
Invite Employee
  ↓
Select Role / Permission
  ↓
Select Outlet Access
  ↓
Employee Ready
```

Owner tetap dapat menggunakan POS setelah employee ditambahkan.

---

## 18. Operational Model

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

## 19. Core Modules

| Module        | Responsibility                  |
| ------------- | ------------------------------- |
| Identity      | Authentication, user            |
| Organization  | Business, membership            |
| Outlet        | Outlet & operating context      |
| Authorization | Role, permission, outlet access |
| Catalog       | Menu, category, price           |
| Sales         | Order, transaction              |
| POS           | Selling workflow                |
| Payment       | Payment & settlement            |
| Cash          | Cash Session                    |
| Inventory     | Stock & movement                |
| Recipe        | Recipe/BOM                      |
| Ordering      | POS/QR order                    |
| Tables        | Table & session                 |
| Kitchen       | Preparation workflow            |
| Customers     | Customer data                   |
| Reporting     | Sales & business reports        |
| Billing       | Platform fee                    |
| Audit         | Critical activity history       |
| Notification  | Realtime/system notification    |

---

## 20. Catalog

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

## 21. POS

POS adalah **core workflow Dagana**.

### 21.1 POS Principle

POS harus:

- cepat
- minim klik
- mudah dipahami
- usable di layar kecil
- tidak membutuhkan konfigurasi panjang

---

## 22. Fast Selling Flow

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

### 22.1 Returning Operator

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

## 23. Quick Sale

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

## 24. Order

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

## 25. Payment

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

## 26. Cash Session

Untuk MVP, Dagana menggunakan **Cash Session**, bukan Shift Management kompleks.

Cash Session berfungsi sebagai konteks tanggung jawab kas.

### 26.1 Opening

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

### 26.2 During Session

Sistem mencatat:

- cash sales
- non-cash sales
- cash in
- cash out
- refund
- permitted adjustment

### 26.3 Closing

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

### 26.4 Variance

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

## 27. Why Cash Session Matters

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

## 28. Tidak Menggunakan Shift Management Kompleks di MVP

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

## 29. Inventory

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

## 30. Recipe & BOM

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

## 31. QR Ordering

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

## 32. Kitchen Operations

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

## 33. Reporting

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

## 34. Owner Dashboard

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

## 35. Transaction Integrity

Checkout harus atomic.

```text
BEGIN
Create Order
Create Order Items
Create Payment
Update Inventory
Create Stock Movement
Update Cash Session
Create Audit Event
COMMIT
```

Jika operasi kritis gagal:

```text
ROLLBACK
```

API transaksi harus mendukung idempotency.

---

## 36. Multi-Tenancy

Model:

```text
Platform
   ↓
Business
   ↓
Outlet
   ↓
Membership
   ↓
Permission
```

Business A tidak boleh mengakses data Business B.

Authorization harus dilakukan di backend.

---

## 37. Outlet Context

Data operasional harus memiliki outlet context jika relevan:

- order
- transaction
- payment
- cash session
- inventory
- stock movement
- table
- QR
- kitchen
- reporting

Untuk merchant satu outlet:

```text
Business
└── Outlet A
```

Untuk merchant berkembang:

```text
Business
├── Outlet A
├── Outlet B
└── Outlet C
```

Domain tetap sama.

---

## 38. Realtime

WebSocket dapat digunakan untuk:

- QR order notification
- kitchen updates
- order status
- payment status
- stock updates

WebSocket hanya event delivery layer.

Database tetap menjadi source of truth.

---

## 39. Offline POS

Offline tetap menjadi kemampuan arsitektur, tetapi tidak harus menjadi fitur kompleks pada tahap awal development.

Baseline:

- cached catalog
- local cart
- local transaction
- sync queue
- idempotency

Fitur seperti:

- QR Ordering
- centralized reporting
- billing
- external payment gateway

membutuhkan koneksi.

---

## 40. Audit Log

Aktivitas kritis harus dapat dilacak.

Minimal:

- product changes
- price changes
- inventory adjustment
- transaction cancellation
- refund
- cash adjustment
- employee changes
- permission changes
- billing changes
- settings changes

Contoh:

```text
User: Budi
Action: CASH_SESSION_CLOSED
Expected: Rp2.550.000
Actual:   Rp2.500.000
Difference: -Rp50.000
Timestamp: ...
```

---

## 41. Billing

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

## 42. Security

Minimal:

- HTTPS
- secure authentication
- authorization
- tenant isolation
- outlet authorization
- input validation
- rate limiting
- secure password storage
- token/session security
- idempotency
- audit logging

Frontend hanya membantu UX.

Security tetap berada di backend.

---

## 43. API Architecture

Backend:

```text
Laravel
PHP
REST API
```

Version:

```text
/api/v1
```

Baseline:

```text
/api/v1/auth
/api/v1/me
/api/v1/businesses
/api/v1/outlets
/api/v1/memberships
/api/v1/employees
/api/v1/roles
/api/v1/permissions
/api/v1/categories
/api/v1/menus
/api/v1/inventory
/api/v1/stock-movements
/api/v1/orders
/api/v1/payments
/api/v1/cash-sessions
/api/v1/tables
/api/v1/qr
/api/v1/reports
/api/v1/billing
/api/v1/audit-logs
```

---

## 44. Data Architecture

Primary database:

> **PostgreSQL**

Redis:

- cache
- queue
- rate limiting
- realtime infrastructure
- temporary state
- distributed locks jika diperlukan

Object Storage:

- business logo
- menu images
- receipt assets

Database adalah operational source of truth.

---

## 45. Architecture

Dagana menggunakan:

> **Modular Monolith**

Client:

```text
Flutter POS
React Admin/Owner
React Customer Web
```

Backend:

```text
Laravel
     ↓
Modular Monolith
     ↓
PostgreSQL
Redis
```

Architecture harus memungkinkan perkembangan tanpa langsung menggunakan microservices.

---

## 46. Core Domain Relationship

Konsep utama:

```text
USER
  │
  ▼
MEMBERSHIP
  │
  ▼
BUSINESS
  │
  ├───────────────┐
  ▼               ▼
OUTLET          BILLING
  │
  ├───────────────┐
  ▼               ▼
ACCESS         CASH SESSION
  │               │
  ▼               ▼
PERMISSION      OPERATOR
                  │
                  ▼
                ORDER
                  │
             ┌────┴────┐
             ▼         ▼
          PAYMENT   INVENTORY
             │         │
             └────┬────┘
                  ▼
               REPORT
```

---

## 47. MVP Scope

MVP harus fokus pada:

> **Merchant dapat daftar → setup bisnis → tambah menu → buka kas → jual → bayar → tutup kas → melihat hasil penjualan.**

### 47.1 Authentication

Included:

- registration
- login
- logout
- user profile

### 47.2 Business & Outlet

Included:

- create business
- create first outlet
- business settings dasar
- outlet settings dasar

### 47.3 Owner-as-Operator

Included:

- Owner default POS access
- Owner dapat membuat transaksi
- Owner dapat menerima payment
- Owner dapat membuka Cash Session
- Owner dapat menutup Cash Session

### 47.4 Employee

Included:

- employee invitation
- membership
- role preset
- permission
- outlet access

Employee setup bersifat optional.

### 47.5 Catalog

Included:

- category
- menu
- price
- active/inactive
- basic availability

### 47.6 POS

Included:

- menu search
- cart
- quantity
- checkout
- payment
- transaction complete
- transaction history
- receipt dasar

### 47.7 Cash

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

### 47.8 Basic Inventory

Included:

- ingredient/item
- stock
- stock adjustment
- stock movement
- low stock

Inventory tidak wajib diaktifkan untuk mulai berjualan.

### 47.9 Reporting

Included:

- daily sales
- transaction count
- payment report
- operator report
- cash reconciliation
- basic inventory report

### 47.10 QR Ordering

Optional MVP module:

- table
- QR
- customer menu
- guest cart
- order creation
- order status

POS tetap berfungsi jika QR disabled.

### 47.11 Billing

Infrastructure:

- billing configuration
- billing period
- billable sales
- platform fee
- billing statement
- billing view

---

## 48. MVP Explicitly Excludes

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

## 49. Primary MVP Workflow

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

## 50. Solo Merchant Workflow

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

## 51. Merchant with Employee Workflow

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

## 52. Multi-Outlet Workflow

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

## 53. Product Principles

### Principle 1 — F&B First

Fokus awal hanya F&B.

### Principle 2 — Owner Can Operate

Owner bukan hanya administrator.

> **Owner dapat menjadi operator.**

### Principle 3 — Sell First

Merchant harus dapat mencapai transaksi pertama secepat mungkin.

### Principle 4 — Permission Over Role

Role adalah preset.

Permission adalah authorization capability.

### Principle 5 — Single Operator Is First-Class

Merchant yang menjalankan bisnis sendiri bukan edge case.

### Principle 6 — Cash Session Over Complex Shift

MVP fokus pada accountability terhadap kas, bukan HR/shift management.

### Principle 7 — Don't Force Setup

Merchant tidak wajib:

- membuat employee
- mengaktifkan inventory
- mengaktifkan QR
- membuat table
- membuat recipe

untuk mulai menjual.

### Principle 8 — One Source of Truth

POS, QR, Payment, Inventory, Cash dan Reporting menggunakan backend/domain yang sama.

### Principle 9 — Fast Operational Workflow

Setiap fitur harus dievaluasi berdasarkan dampaknya terhadap workflow.

### Principle 10 — Build for Growth, Not Complexity

Backend boleh kompleks.

UX harus tetap sederhana.

---

## 54. Product UX Philosophy

Dagana harus terasa seperti:

> **alat kerja**, bukan sistem administrasi enterprise.

Merchant membuka aplikasi karena:

> "Ada customer."

Bukan karena:

> "Saya ingin mengelola sistem."

Karena itu primary UX harus mendukung:

```text
Open
 ↓
Sell
 ↓
Done
```

dan bukan:

```text
Open
 ↓
Dashboard
 ↓
Business
 ↓
Outlet
 ↓
Employee
 ↓
Configuration
 ↓
POS
```

---

## 55. Success Metrics

### Product

- time to first transaction
- activation rate
- active businesses
- active outlets
- transaction completion rate

### Operational

- average checkout time
- failed transaction rate
- transaction capture rate
- cash variance
- number of reconciliation events

### Adoption

- percentage of owners using POS directly
- employee activation rate
- repeat selling sessions
- daily active merchants

### Business

- monthly active businesses
- transactions per business
- processed sales
- billable sales
- platform fee
- merchant retention

---

## 56. Validation Metrics

Karena problem utama masih perlu divalidasi melalui customer interview nyata, Dagana perlu mengukur:

### Transaction Capture

Berapa banyak transaksi yang benar-benar dicatat saat transaksi terjadi?

### Cash Variance

Seberapa sering terjadi:

```text
Actual Cash ≠ Expected Cash
```

### Checkout Speed

Berapa lama merchant menyelesaikan transaksi?

### Setup Friction

Berapa lama dari:

```text
Register
```

hingga:

```text
First Transaction
```

### Owner-as-Operator Adoption

Berapa banyak merchant yang:

```text
Owner → POS → Sell
```

tanpa employee?

---

## 57. Post-MVP Roadmap

### Phase A — Operational Improvement

- Quick Sale berdasarkan hasil validasi
- advanced cash management
- improved reports
- transaction search
- receipt customization

### Phase B — F&B Operations

- recipe/BOM
- advanced inventory
- COGS
- waste
- stock opname
- modifier
- variant

### Phase C — Ordering & Kitchen

- QR Ordering enhancement
- table management
- kitchen display
- realtime kitchen
- split bill
- multiple payment

### Phase D — Multi-Outlet

- stock transfer
- centralized catalog
- outlet-specific pricing
- centralized reporting
- central kitchen

### Phase E — Growth

- loyalty
- promotion
- customer segmentation
- advanced CRM
- accounting integration

### Phase F — Platform

- advanced billing
- automated billing payment
- owner mobile application
- advanced analytics
- integrations

---

## 58. Development Phases

| Phase    | Focus                        |
| -------- | ---------------------------- |
| Phase 0  | Foundation                   |
| Phase 1  | Identity, Business, Outlet   |
| Phase 2  | Membership, Role, Permission |
| Phase 3  | Catalog                      |
| Phase 4  | POS + Payment                |
| Phase 5  | Cash Session                 |
| Phase 6  | Basic Inventory              |
| Phase 7  | Reporting                    |
| Phase 8  | QR Ordering                  |
| Phase 9  | Realtime                     |
| Phase 10 | Billing                      |
| Phase 11 | Stabilization                |
| Phase 12 | Advanced F&B Operations      |

Urutan dapat berubah berdasarkan hasil validasi dan implementation dependency.

---

## 59. Initial Technical Stack

### POS

```text
Flutter
Dart
Local Database
Offline-capable architecture
```

### Owner/Admin

```text
React
TypeScript
Vite
Tailwind CSS
shadcn/ui
TanStack Query
```

### Customer Web

```text
React
TypeScript
Vite
Tailwind CSS
shadcn/ui
TanStack Query
```

### Backend

```text
Laravel
PHP
REST API
WebSocket
Queue
```

### Database

```text
PostgreSQL
```

### Infrastructure

```text
Redis
Object Storage
```

---

## 60. Key Architectural Decisions

| Area            | Decision                              |
| --------------- | ------------------------------------- |
| Product         | F&B Business Operating Platform       |
| Primary ICP     | Micro / Small F&B                     |
| Product Core    | POS + Transaction + Cash              |
| Owner           | Owner can operate POS                 |
| Operator        | User with relevant permission         |
| Organization    | User → Membership → Business → Outlet |
| Authorization   | Permission-based                      |
| Role            | Permission preset                     |
| Outlet Access   | Explicit scope                        |
| Cash            | Cash Session                          |
| Shift           | Not complex in MVP                    |
| Inventory       | Basic MVP                             |
| Recipe          | Later / optional based on scope       |
| QR              | Optional channel                      |
| Backend         | Laravel                               |
| Architecture    | Modular Monolith                      |
| API             | REST                                  |
| Database        | PostgreSQL                            |
| Cache/Queue     | Redis                                 |
| POS             | Flutter                               |
| Admin           | React                                 |
| Customer Web    | React                                 |
| Billing         | Usage-based                           |
| Source of Truth | PostgreSQL/backend                    |

---

## 61. Open Decisions

Masih perlu diputuskan:

- [ ] Apakah satu user dapat memiliki beberapa Business
- [ ] Apakah Owner dapat memiliki beberapa Business
- [ ] Final permission catalog
- [ ] Apakah custom role masuk MVP
- [ ] Apakah role dapat memiliki outlet-specific permissions
- [ ] Apakah satu Cash Session hanya boleh memiliki satu operator
- [ ] Apakah satu outlet dapat memiliki beberapa Cash Session aktif
- [ ] Aturan Cash Session ketika operator berganti
- [ ] Unit conversion inventory
- [ ] Inventory costing method
- [ ] Final COGS formula
- [ ] Final billing formula
- [ ] Platform fee rate
- [ ] Billing due date
- [ ] Payment gateway
- [ ] QR payment gateway
- [ ] WebSocket provider
- [ ] Object storage
- [ ] Thermal printer
- [ ] Barcode hardware
- [ ] Local database Flutter
- [ ] Offline conflict strategy
- [ ] Split payment
- [ ] Modifier inventory impact
- [ ] Outlet-specific pricing
- [ ] Customer login
- [ ] KDS target phase
- [ ] Audit retention
- [ ] Backup/disaster recovery

---

## 62. Documentation Milestones

PRD ini menjadi baseline untuk:

1. Domain Modeling
2. Business/Membership Model
3. Outlet Access Model
4. Role & Permission Model
5. Cash Session Model
6. Entity Definition
7. ERD
8. Database Design
9. POS Transaction Design
10. Payment Design
11. Inventory Design
12. Recipe Design
13. QR Ordering Design
14. Billing Design
15. API Specification
16. Authentication Design
17. Authorization Design
18. Offline Synchronization
19. Realtime Architecture
20. Testing Strategy
21. Implementation Planning

---

## 63. Revised Product Definition

> **Dagana adalah platform operasional bisnis F&B yang membantu merchant mencatat transaksi dengan cepat, mengelola pembayaran dan kas, serta memahami kondisi bisnis dari satu sistem. Dagana dirancang untuk owner yang dapat berjualan sendiri maupun bisnis yang memiliki banyak employee dan outlet.**

Core workflow:

```text
                 DAGANA
                    │
                  USER
                    │
              MEMBERSHIP
                    │
                 BUSINESS
                    │
          ┌─────────┴─────────┐
          │                   │
       OUTLET             BUSINESS DATA
          │
    ┌─────┴─────┐
    │           │
 OWNER       EMPLOYEE
    │           │
    └─────┬─────┘
          │
     PERMISSION
          │
     ┌────┴────┐
     │         │
    POS      OTHER
     │
     ▼
   ORDER
     │
 ┌───┼────┐
 ▼   ▼    ▼
PAY CASH INVENTORY
 │    │      │
 └────┼──────┘
      ▼
   REPORTING
```

### Final Product Principle

> **Dagana harus dapat digunakan oleh satu orang yang memiliki usaha dan langsung berjualan, tetapi memiliki fondasi yang cukup kuat untuk berkembang menjadi sistem operasional bisnis F&B multi-outlet.**

Atau secara sederhana:

> **Mulai sendiri. Jualan langsung. Berkembang tanpa pindah sistem.**

---

### Document Status

| Property         | Value                        |
| ---------------- | ---------------------------- |
| Product          | Dagana                       |
| Version | Draft v1.1 — Engineering Baseline |
| Product Focus    | F&B                          |
| Primary ICP      | Micro / Small F&B            |
| Core User Model  | Owner-as-Operator            |
| Core Product     | POS + Payment + Cash Session |
| Supporting Core  | Basic Inventory + Reporting  |
| Optional Channel | QR Ordering                  |
| Authorization    | Permission-based             |
| Cash Model       | Cash Session                 |
| Architecture     | Modular Monolith             |
| Database         | PostgreSQL                   |
| Business Model   | Usage-based Platform Fee     |
| Next Step        | Domain Modeling & UX Flow    |

---

## 64. Engineering Standards & Agent Rules

Engineering implementation must follow the detailed repository-level instructions in `AGENTS.md` and `docs/engineering-standards.md`. These documents complement this PRD and do not change the product scope or domain decisions above.

Baseline rules:

- Keep Dagana as a **modular monolith**. Organize code by business domain; do not introduce microservices without an explicit architecture decision.
- Keep Laravel controllers thin. Put use-case orchestration and business rules in domain services/actions; use Form Requests, Policies, API Resources, and Events/Jobs where appropriate.
- Enforce business and outlet authorization on the backend for every protected operation. Never trust tenant or outlet identifiers supplied by a client without validating the active membership and access scope.
- Wrap critical workflows such as checkout, payment recording, inventory movement, and cash updates in database transactions when they must succeed or fail together. Design retryable endpoints for idempotency.
- Add automated tests for changed business rules, authorization, tenant isolation, and failure paths. Do not mark a task complete only because the happy path works manually.
- Use Git branches and Conventional Commits; never run destructive Git commands or commit/push without explicit authorization. Preserve unrelated work in the working tree.
- Never commit credentials, `.env` files, tokens, customer data, or production database dumps.
- Update API contracts and relevant documentation whenever externally observable behavior changes.

The root `AGENTS.md` is the operational instruction set for coding agents. `docs/engineering-standards.md` contains the fuller implementation and review checklist.

## 65. Docker & Local Development

Local development uses Docker Compose to standardize the Laravel API runtime, PostgreSQL, and Redis. The initial Compose setup is **development-only**, not a production deployment configuration.

The starter files and setup instructions are maintained in:

- `compose.yaml`
- `docker/php/Dockerfile.dev`
- `.env.docker.example`
- `docs/development-environment.md`

The initial repository layout assumes a monorepo with `apps/api` for Laravel, `apps/admin-web` for the React admin application, `apps/customer-web` for the React customer application, and `apps/pos` for Flutter. React/Flutter toolchains can be added to Compose when their application workspaces are initialized; Flutter device/emulator tooling is expected to run on the host unless a specific container workflow is later adopted.

Use service names such as `postgres` and `redis` for connections from containers; `localhost` is only for connections from the host. Keep local credentials disposable and never reuse development settings for production. Persistent database data is stored in a named Docker volume; deleting volumes is destructive and must be an explicit, deliberate action.

The API, POS, admin web, and customer web remain clients of the same Laravel modular-monolith backend and source of truth. Docker is a development convenience, not a reason to split the product into microservices.

## Closing

**Dagana bukan sistem yang mengharuskan owner menjadi administrator terlebih dahulu sebelum bisa berjualan.**

Dagana dimulai dari kebutuhan paling sederhana:

```text
Ada customer
    ↓
Catat pesanan
    ↓
Terima pembayaran
    ↓
Transaksi selesai
```

Kemudian sistem berkembang bersama bisnis:

```text
Owner
  ↓
Owner + POS
  ↓
Employee
  ↓
Permission
  ↓
Inventory
  ↓
QR Ordering
  ↓
Kitchen
  ↓
Multiple Outlet
  ↓
Centralized Business
```

Dengan prinsip:

> **Simple for the first sale. Structured for the next stage.**
