# Dagana --- Multi-Tenant POS & Ordering Platform

> **Product Requirements Document (PRD)**\
> **Status:** Draft v0.1\
> **Purpose:** Acuan awal untuk domain modeling, ERD, API specification,
> system architecture, dan implementation planning.

------------------------------------------------------------------------

## Table of Contents

1.  [Product Overview](#1-product-overview)
2.  [Goals](#2-goals)
3.  [Non-Goals](#3-non-goals)
4.  [Target Users](#4-target-users)
5.  [Business Types](#5-business-types)
6.  [Product Architecture](#6-product-architecture)
7.  [Multi-Tenancy](#7-multi-tenancy)
8.  [Core Modules](#8-core-modules)
9.  [POS Requirements](#9-pos-requirements)
10. [QR Ordering Requirements](#10-qr-ordering-requirements)
11. [Restaurant Order Flow](#11-restaurant-order-flow)
12. [Inventory Requirements](#12-inventory-requirements)
13. [Transaction Integrity](#13-transaction-integrity)
14. [Realtime Requirements](#14-realtime-requirements)
15. [Offline POS](#15-offline-pos)
16. [Admin Dashboard Requirements](#16-admin-dashboard-requirements)
17. [Roles & Permissions](#17-roles--permissions)
18. [Payment](#18-payment)
19. [Reporting](#19-reporting)
20. [Non-Functional Requirements](#20-non-functional-requirements)
21. [Audit Log](#21-audit-log)
22. [API Architecture](#22-api-architecture)
23. [Data Architecture](#23-data-architecture)
24. [Architecture Principles](#24-architecture-principles)
25. [MVP Scope](#25-mvp-scope)
26. [Post-MVP](#26-post-mvp)
27. [High-Level User Flow](#27-high-level-user-flow)
28. [Success Metrics](#28-success-metrics)
29. [Development Phases](#29-development-phases)
30. [Initial Technical Stack](#30-initial-technical-stack)
31. [Key Architectural Decisions](#31-key-architectural-decisions)
32. [Open Decisions](#32-open-decisions)
33. [Product Principle](#33-product-principle)

------------------------------------------------------------------------

# 1. Product Overview

## 1.1 Product Name

**Dagana --- Multi-Tenant POS & Ordering Platform**

## 1.2 Product Vision

Membangun platform **Point of Sale (POS)** dan **digital ordering** yang
dapat digunakan oleh berbagai jenis usaha, terutama retail, restoran,
dan cafe, dengan menggabungkan:

-   POS untuk kasir
-   QR Ordering untuk pelanggan
-   Dashboard untuk owner/admin
-   Inventory management
-   Order management
-   Payment management
-   Reporting
-   Multi-outlet management
-   Realtime communication

Seluruh channel terhubung melalui **satu backend** dan **satu sumber
data bisnis**.

## 1.3 Problem Statement

Pemilik usaha sering menggunakan beberapa sistem yang terpisah untuk:

-   transaksi kasir
-   pemesanan pelanggan
-   inventory
-   laporan penjualan
-   pengelolaan karyawan
-   pengelolaan outlet

Sistem yang terpisah menyebabkan:

-   data tidak tersinkronisasi
-   pekerjaan manual meningkat
-   laporan tidak real-time
-   kesalahan pencatatan
-   sulit melakukan monitoring bisnis secara terpusat

Platform ini bertujuan menyediakan **satu sistem terintegrasi** yang
menghubungkan seluruh proses tersebut.

------------------------------------------------------------------------

# 2. Goals

## 2.1 Primary Goals

-   Menyediakan POS yang cepat dan mudah digunakan oleh kasir.
-   Menyediakan QR Ordering yang terhubung langsung dengan sistem POS.
-   Menyediakan dashboard untuk owner/admin.
-   Menyediakan inventory management yang terintegrasi dengan transaksi.
-   Mendukung multi-tenant dan multi-outlet.
-   Mendukung realtime order updates.
-   Menyiapkan POS untuk kondisi offline.
-   Menyediakan API sebagai interface utama seluruh aplikasi.
-   Menyediakan architecture yang dapat berkembang tanpa harus langsung
    menggunakan microservices.

## 2.2 Business Goals

-   Mendukung berbagai merchant dalam satu platform.
-   Mendukung merchant dengan satu maupun banyak outlet.
-   Menjadi platform yang dapat dikembangkan menjadi SaaS.
-   Memungkinkan penambahan channel ordering di masa depan.
-   Memungkinkan integrasi dengan payment gateway dan layanan pihak
    ketiga.

------------------------------------------------------------------------

# 3. Non-Goals

Fitur berikut tidak menjadi prioritas MVP:

-   Accounting penuh
-   Payroll
-   HR management
-   Advanced CRM
-   Marketplace
-   Delivery fleet management
-   Full ERP
-   Advanced procurement
-   Microservices architecture
-   Mobile application khusus customer

> Fitur tersebut dapat dipertimbangkan pada fase berikutnya.

------------------------------------------------------------------------

# 4. Target Users

## 4.1 Business Owner

Pemilik usaha yang ingin:

-   memonitor penjualan
-   melihat laporan
-   mengelola produk
-   mengelola outlet
-   mengelola karyawan
-   memonitor inventory

## 4.2 Manager

Pengguna yang bertanggung jawab terhadap operasional outlet.

Contoh aktivitas:

-   monitoring transaksi
-   inventory
-   laporan outlet
-   pengelolaan kasir

## 4.3 Cashier

Pengguna POS yang melakukan:

-   transaksi
-   pembayaran
-   refund/cancel sesuai permission
-   melihat order
-   mengelola shift

## 4.4 Staff / Inventory User

Pengguna yang melakukan:

-   stock opname
-   stock adjustment
-   stock receiving
-   inventory management

## 4.5 Customer

Pelanggan yang menggunakan QR Ordering untuk:

-   melihat menu/product
-   memilih produk
-   membuat order
-   melihat status order
-   melakukan pembayaran jika tersedia

------------------------------------------------------------------------

# 5. Business Types

Platform harus mendukung minimal dua business type.

## 5.1 Retail

Contoh:

-   minimarket
-   toko kelontong
-   fashion store
-   toko elektronik
-   toko kebutuhan sehari-hari

### Fitur Utama

-   barcode
-   SKU
-   product
-   inventory
-   checkout
-   payment
-   stock movement

## 5.2 Restaurant / Cafe

Contoh:

-   restaurant
-   cafe
-   coffee shop
-   food court

### Fitur Tambahan

-   menu
-   table
-   QR ordering
-   modifier
-   kitchen order
-   order status
-   dine-in
-   takeaway

------------------------------------------------------------------------

# 6. Product Architecture

Platform terdiri dari beberapa client application yang menggunakan
**backend API yang sama**.

``` text
                    Backend API
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
       POS App      Customer Web    Admin Dashboard
       Flutter       React Web       React Web
          │              │              │
          └──────────────┼──────────────┘
                         │
                  PostgreSQL
                         │
                       Redis
```

## 6.1 POS Application

### Technology

-   Flutter
-   Dart
-   Local database
-   Offline-first architecture

### Target

-   Android phone
-   Android tablet
-   POS device

## 6.2 Customer Ordering Web

### Technology

-   React
-   TypeScript
-   Vite
-   Tailwind CSS
-   shadcn/ui
-   TanStack Query

### Target

-   Mobile browser

## 6.3 Admin Dashboard

### Technology

-   React
-   TypeScript
-   Vite
-   Tailwind CSS
-   shadcn/ui
-   TanStack Query

### Target

-   Desktop
-   Tablet

## 6.4 Backend

### Technology Baseline

-   Laravel
-   PHP
-   REST API
-   WebSocket
-   Queue
-   PostgreSQL
-   Redis

Backend menggunakan **Modular Monolith Architecture**.

------------------------------------------------------------------------

# 7. Multi-Tenancy

Platform harus mendukung banyak business/merchant dalam satu platform.

``` text
Platform
│
├── Tenant A
│   ├── Outlet A1
│   └── Outlet A2
│
├── Tenant B
│   └── Outlet B1
│
└── Tenant C
    ├── Outlet C1
    ├── Outlet C2
    └── Outlet C3
```

## 7.1 Tenant

Tenant merepresentasikan satu merchant/business.

Contoh:

> Cafe ABC

## 7.2 Outlet

Outlet merupakan lokasi operasional milik tenant.

Contoh:

``` text
Cafe ABC
├── Bekasi
├── Jakarta
└── Bandung
```

Data berikut harus memiliki konteks outlet:

-   transaksi
-   inventory
-   table
-   POS

------------------------------------------------------------------------

# 8. Core Modules

Backend minimal terdiri dari modul berikut:

  -----------------------------------------------------------------------
  Module                              Tanggung Jawab
  ----------------------------------- -----------------------------------
  Identity                            Authentication, authorization,
                                      user, role, permission,
                                      session/token

  Tenancy                             Tenant, outlet, membership,
                                      subscription, tenant isolation

  Catalog                             Product, category, SKU, barcode,
                                      price, variant, modifier, menu

  Inventory                           Stock, movement, adjustment,
                                      opname, receiving, low stock

  Sales                               Cart, order, transaction, items,
                                      discount, tax, refund, cancellation

  Payments                            Cash, transfer, QR, debit, credit,
                                      payment status/reference

  Customers                           Customer profile dan order history

  Tables                              Table, status, QR, table session

  Ordering                            POS order, QR order, order status,
                                      source, kitchen order

  Reporting                           Sales, product, inventory, payment,
                                      cashier, profit

  Notifications                       Realtime event, order notification,
                                      low-stock notification
  -----------------------------------------------------------------------

## 8.1 Identity

Menangani:

-   authentication
-   authorization
-   user
-   role
-   permission
-   session/token

## 8.2 Tenancy

Menangani:

-   tenant
-   outlet
-   membership
-   subscription
-   tenant isolation

## 8.3 Catalog

Menangani:

-   product
-   category
-   SKU
-   barcode
-   price
-   variant
-   modifier
-   menu

## 8.4 Inventory

Menangani:

-   stock
-   stock movement
-   stock adjustment
-   stock opname
-   stock receiving
-   low stock

## 8.5 Sales

Menangani:

-   cart
-   order
-   transaction
-   transaction items
-   discount
-   tax
-   refund
-   cancellation

## 8.6 Payments

Menangani:

-   cash
-   bank transfer
-   QR payment
-   debit
-   credit
-   payment status
-   payment reference

## 8.7 Customers

Menangani:

-   customer profile
-   customer history
-   customer order history

## 8.8 Tables

Khusus restaurant/cafe:

-   table
-   table status
-   table QR
-   table session

## 8.9 Ordering

Menangani:

-   POS order
-   QR order
-   order status
-   order source
-   kitchen order

## 8.10 Reporting

Menangani:

-   sales report
-   product report
-   inventory report
-   payment report
-   cashier report
-   profit report

## 8.11 Notifications

Menangani:

-   realtime events
-   order notification
-   low-stock notification
-   system notification

------------------------------------------------------------------------

# 9. POS Requirements

## 9.1 Product Search

Kasir dapat mencari produk berdasarkan:

-   nama
-   SKU
-   barcode

## 9.2 Barcode Scanner

POS harus mendukung barcode scanner melalui device/hardware yang
tersedia.

## 9.3 Cart

Kasir dapat:

-   menambahkan produk
-   mengubah quantity
-   menghapus produk
-   memberikan discount sesuai permission

## 9.4 Checkout

Checkout harus menghitung:

``` text
Subtotal
- Discount
+ Tax
= Grand Total
```

## 9.5 Payment

Kasir memilih metode pembayaran.

Contoh:

-   Cash
-   QR
-   Transfer
-   Debit
-   Credit

## 9.6 Receipt

Setelah transaksi berhasil, sistem menyediakan receipt.

Output dapat berupa:

-   digital receipt
-   thermal printer receipt

------------------------------------------------------------------------

# 10. QR Ordering Requirements

## 10.1 QR Code

Setiap table dapat memiliki QR Code unik.

Contoh:

``` text
Outlet
└── Table 12
    └── QR Token
```

> QR tidak boleh hanya menggunakan ID table yang mudah ditebak.

## 10.2 Customer Flow

``` text
Scan QR
   ↓
Validate QR
   ↓
Load outlet/table
   ↓
Display menu
   ↓
Select product
   ↓
Cart
   ↓
Create order
   ↓
Payment / Submit
   ↓
Order confirmation
```

## 10.3 Order Source

Order harus menyimpan sumber order.

Contoh:

-   `POS`
-   `QR`
-   `ADMIN`
-   `ONLINE`

Dengan demikian semua order dapat menggunakan **order domain yang
sama**.

------------------------------------------------------------------------

# 11. Restaurant Order Flow

``` text
Customer
   │
   ▼
QR Ordering
   │
   ▼
Backend
   │
   ├──────► POS
   │
   └──────► Kitchen
             │
             ▼
          Preparing
             │
             ▼
           Ready
             │
             ▼
         Completed
```

## Order Status

Status minimal:

``` text
PENDING
CONFIRMED
PREPARING
READY
COMPLETED
CANCELLED
```

------------------------------------------------------------------------

# 12. Inventory Requirements

Inventory harus menggunakan konsep **stock movement**, bukan hanya
menyimpan nilai stock akhir.

Contoh:

``` text
+100  Stock In
-2    Sale
-1    Damaged
+20   Adjustment
```

Setiap perubahan stock harus memiliki:

-   product
-   outlet
-   quantity
-   movement type
-   reference
-   actor
-   timestamp

------------------------------------------------------------------------

# 13. Transaction Integrity

Checkout harus dilakukan secara **atomic**.

Secara konseptual:

``` text
BEGIN

Create Order
Create Order Items
Create Payment
Update Inventory
Create Stock Movement

COMMIT
```

Jika salah satu proses kritis gagal, transaksi harus dapat di-rollback.

Tujuannya mencegah kondisi seperti:

``` text
Payment berhasil
tetapi stock tidak berkurang
```

atau:

``` text
Order berhasil
tetapi transaction item tidak tersimpan
```

------------------------------------------------------------------------

# 14. Realtime Requirements

Sistem harus mendukung realtime communication menggunakan **WebSocket**.

## Event

Contoh event:

-   `OrderCreated`
-   `OrderConfirmed`
-   `OrderCancelled`
-   `OrderPreparing`
-   `OrderReady`
-   `PaymentCompleted`
-   `StockUpdated`

## Realtime Flow

``` text
Customer
   ↓
Create QR Order
   ↓
Backend
   ↓
OrderCreated
   ↓
WebSocket
   ├── POS
   └── Kitchen Display
```

POS tidak perlu melakukan polling terus-menerus untuk mendapatkan order
baru.

------------------------------------------------------------------------

# 15. Offline POS

POS harus dirancang agar dapat beroperasi ketika koneksi internet
terputus untuk operasi tertentu.

## Saat Offline

-   product catalog yang sudah tersimpan tetap tersedia
-   cart tetap dapat digunakan
-   transaksi dapat disimpan secara lokal
-   receipt dapat dicetak jika hardware tersedia

## Synchronization

``` text
Local Transaction
       ↓
Sync Queue
       ↓
Backend
       ↓
Server Confirmation
       ↓
Mark Synced
```

> Offline synchronization dan conflict resolution harus menjadi bagian
> dari desain teknis sebelum implementasi final.

------------------------------------------------------------------------

# 16. Admin Dashboard Requirements

## Dashboard

-   sales today
-   transaction count
-   average order value
-   low stock
-   recent transactions

## Product Management

-   product CRUD
-   category
-   price
-   SKU
-   barcode
-   variant
-   modifier

## Inventory

-   current stock
-   stock movement
-   stock adjustment
-   stock opname
-   low-stock monitoring

## Order Management

-   order list
-   order detail
-   order status
-   order source

## Customer Management

-   customer list
-   customer detail
-   transaction history

## Employee Management

-   user
-   role
-   permission
-   outlet assignment

## Outlet Management

-   outlet CRUD
-   table management
-   QR management

## Reports

-   sales
-   product
-   payment
-   cashier
-   inventory
-   profit

------------------------------------------------------------------------

# 17. Roles & Permissions

## Minimal Roles

-   `OWNER`
-   `MANAGER`
-   `CASHIER`
-   `INVENTORY`

Permission harus bersifat granular.

## Contoh Permission

``` text
products.read
products.create
products.update
products.delete

orders.read
orders.create
orders.cancel
orders.refund

inventory.read
inventory.adjust
inventory.stock_opname

reports.read

users.read
users.create
users.update
```

> Authorization harus dilakukan di backend. Frontend hanya digunakan
> untuk mengontrol visibility dan UX.

------------------------------------------------------------------------

# 18. Payment

## MVP Payment Methods

-   Cash
-   QR payment
-   Bank transfer
-   Debit
-   Credit

Payment gateway integration dapat ditambahkan pada fase berikutnya.

## Payment Data

Payment harus memiliki:

-   payment method
-   amount
-   status
-   reference
-   timestamp

## Payment Status

``` text
PENDING
PAID
FAILED
REFUNDED
```

------------------------------------------------------------------------

# 19. Reporting

## MVP Reports

### Sales

-   sales by day
-   sales by outlet
-   sales by cashier
-   sales by payment method

### Product

-   best-selling products
-   product sales quantity

### Inventory

-   current stock
-   stock movement
-   low stock

### Profit

Perhitungan awal:

``` text
Gross Profit =
Sales Revenue - Cost of Goods Sold
```

> Accounting profit tidak termasuk dalam MVP.

------------------------------------------------------------------------

# 20. Non-Functional Requirements

## Performance

-   API harus memiliki response time yang wajar untuk operasi normal
    POS.
-   Operasi POS yang umum harus dioptimalkan agar tidak terasa lambat
    bagi kasir.

## Availability

POS harus tetap dapat melakukan operasi tertentu saat backend tidak
tersedia melalui offline mode.

## Security

Minimal:

-   HTTPS
-   secure authentication
-   authorization
-   tenant isolation
-   input validation
-   rate limiting
-   audit logging
-   secure password storage
-   token/session security

## Data Isolation

Tenant A tidak boleh dapat membaca atau memodifikasi data Tenant B.

> Tenant isolation harus diterapkan pada backend, bukan hanya frontend.

------------------------------------------------------------------------

# 21. Audit Log

Aktivitas penting harus dapat dilacak.

Contoh:

``` text
User: Ahmad
Action: UPDATE_PRODUCT
Product: Kopi Susu
Old Price: 18000
New Price: 20000
Timestamp: ...
```

Audit log minimal untuk:

-   product changes
-   price changes
-   inventory adjustment
-   transaction cancellation
-   refund
-   user/permission changes

------------------------------------------------------------------------

# 22. API Architecture

Backend menggunakan **REST API** sebagai interface utama.

## Endpoint Baseline

``` text
/api/v1/auth
/api/v1/tenants
/api/v1/outlets

/api/v1/products
/api/v1/categories
/api/v1/inventory

/api/v1/orders
/api/v1/payments

/api/v1/customers

/api/v1/tables
/api/v1/qr

/api/v1/reports
```

API harus versioned:

``` text
/api/v1/...
```

Tujuannya agar perubahan API di masa depan tidak langsung merusak client
lama.

------------------------------------------------------------------------

# 23. Data Architecture

## Primary Database

**PostgreSQL**

## Supporting Infrastructure

**Redis**

### Use Case Redis

-   cache
-   queue
-   rate limiting
-   temporary state
-   realtime infrastructure
-   distributed locks jika diperlukan

## Object Storage

Object storage digunakan untuk:

-   product images
-   business logo
-   receipt assets
-   dokumen lain yang membutuhkan storage

------------------------------------------------------------------------

# 24. Architecture Principles

Project mengikuti prinsip:

### Modular Monolith

Satu backend deployment dengan module/domain boundary yang jelas.

### API First

Frontend tidak boleh mengakses database secara langsung.

### Multi Tenant

Semua data bisnis harus memiliki tenant context.

### Event Driven Internally

Business events digunakan untuk menghubungkan proses antar-module.

### Realtime Ready

Architecture harus mendukung WebSocket dan realtime events.

### Offline Ready

POS dirancang dengan kemampuan offline dan synchronization.

### Domain Oriented

Business logic dikelompokkan berdasarkan domain, bukan hanya berdasarkan
jenis file.

------------------------------------------------------------------------

# 25. MVP Scope

MVP pertama harus fokus pada **core operational flow**.

## Included

### Authentication

-   Login
-   Logout
-   Role
-   Permission

### Tenant

-   Tenant
-   Outlet
-   User assignment

### Catalog

-   Category
-   Product
-   SKU
-   Barcode
-   Price

### POS

-   Product search
-   Cart
-   Checkout
-   Payment
-   Receipt

### Inventory

-   Stock
-   Stock movement
-   Stock adjustment
-   Low stock

### QR Ordering

-   Table
-   QR code
-   Menu
-   Cart
-   Create order
-   Order status

### Admin

-   Dashboard
-   Product management
-   Inventory
-   Orders
-   Users
-   Basic reports

### Realtime

-   New order notification
-   Order status update

------------------------------------------------------------------------

# 26. Post-MVP

Fitur berikut masuk roadmap setelah MVP:

-   Payment gateway integration
-   Advanced reporting
-   Customer loyalty
-   Promotion engine
-   Discount campaigns
-   Supplier management
-   Purchase order
-   Advanced inventory
-   Kitchen Display System
-   Multiple payment
-   Split bill
-   Advanced table management
-   Customer display
-   Accounting integration
-   E-commerce integration
-   Delivery integration
-   Subscription & billing
-   Mobile owner app

------------------------------------------------------------------------

# 27. High-Level User Flow

## Retail

``` text
Login
  ↓
POS
  ↓
Scan/Search Product
  ↓
Cart
  ↓
Checkout
  ↓
Payment
  ↓
Receipt
  ↓
Inventory Updated
```

## Restaurant --- POS

``` text
Login
  ↓
POS
  ↓
Select Table / Takeaway
  ↓
Select Menu
  ↓
Create Order
  ↓
Kitchen
  ↓
Payment
  ↓
Completed
```

## Restaurant --- QR Ordering

``` text
Customer Scan QR
       ↓
Validate Table
       ↓
View Menu
       ↓
Add Items
       ↓
Create Order
       ↓
POS / Kitchen receives realtime event
       ↓
Order Preparing
       ↓
Order Ready
       ↓
Completed
```

------------------------------------------------------------------------

# 28. Success Metrics

MVP success dapat diukur menggunakan:

## Operational

-   waktu checkout
-   jumlah transaksi berhasil
-   failed transaction rate
-   stock discrepancy

## QR Ordering

-   jumlah QR orders
-   order completion rate
-   average order value
-   waktu dari order hingga confirmation

## System

-   API error rate
-   realtime event delivery success
-   sync success rate
-   offline transaction sync success

## Business

-   jumlah merchant aktif
-   jumlah outlet aktif
-   jumlah transaksi
-   monthly active merchants

------------------------------------------------------------------------

# 29. Development Phases

  -----------------------------------------------------------------------
  Phase                   Fokus                   Scope Utama
  ----------------------- ----------------------- -----------------------
  **Phase 0 ---           Fondasi sistem          Repository setup,
  Foundation**                                    backend, frontend,
                                                  PostgreSQL, Redis,
                                                  authentication, tenant
                                                  architecture, CI/CD
                                                  baseline

  **Phase 1 --- Catalog** Produk                  Product, category, SKU,
                                                  barcode, pricing

  **Phase 2 ---           Persediaan              Stock, stock movement,
  Inventory**                                     stock adjustment, low
                                                  stock

  **Phase 3 --- POS**     Transaksi               Cart, checkout,
                                                  payment, receipt, basic
                                                  offline support

  **Phase 4 --- QR        Ordering                Table, QR, menu,
  Ordering**                                      customer cart, order
                                                  creation, realtime
                                                  notification

  **Phase 5 --- Admin     Management              Dashboard, product
  Dashboard**                                     management, order
                                                  management, inventory,
                                                  users, reports

  **Phase 6 ---           Production readiness    Security, testing,
  Stabilization**                                 performance, offline
                                                  sync, monitoring, audit
                                                  log, deployment
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 30. Initial Technical Stack

## Frontend

### POS

``` text
Flutter
Dart
Local Database
Offline-first
```

### Customer Ordering

``` text
React
TypeScript
Vite
Tailwind CSS
shadcn/ui
TanStack Query
```

### Admin Dashboard

``` text
React
TypeScript
Vite
Tailwind CSS
shadcn/ui
TanStack Query
```

## Backend

``` text
Laravel
PHP
REST API
WebSocket
Queue
```

## Database

``` text
PostgreSQL
```

## Infrastructure

``` text
Redis
Object Storage
```

## Architecture

``` text
Modular Monolith
Multi Tenant
API First
Event Driven Internally
Realtime Ready
Offline Ready
```

------------------------------------------------------------------------

# 31. Key Architectural Decisions

  Area                   Decision
  ---------------------- -----------------------------
  Backend                Laravel
  Backend architecture   Modular Monolith
  API                    REST API
  Realtime               WebSocket
  Database               PostgreSQL
  Cache/Queue            Redis
  POS                    Flutter
  Customer Web           React + TypeScript + Vite
  Admin Web              React + TypeScript + Vite
  Web UI                 Tailwind + shadcn/ui
  Server State           TanStack Query
  Multi-tenancy          Tenant + Outlet
  POS availability       Offline-first
  API versioning         `/api/v1`
  Architecture style     API First + Domain Oriented

------------------------------------------------------------------------

# 32. Open Decisions

Keputusan berikut perlu ditentukan sebelum technical design final:

-   [ ] Nama produk
-   [ ] Model subscription SaaS
-   [ ] Apakah satu user dapat memiliki akses ke beberapa tenant
-   [ ] Apakah satu user dapat bekerja di beberapa outlet
-   [ ] Strategi tenant isolation PostgreSQL
-   [ ] Payment gateway yang akan digunakan
-   [ ] Provider WebSocket
-   [ ] Object storage provider
-   [ ] Thermal printer support
-   [ ] Barcode hardware yang ditargetkan
-   [ ] Offline synchronization strategy
-   [ ] Apakah restoran membutuhkan Kitchen Display System pada MVP
-   [ ] Apakah customer dapat melakukan pembayaran langsung melalui QR
    Ordering
-   [ ] Apakah retail juga menggunakan QR Ordering atau hanya
    restaurant/cafe
-   [ ] Apakah inventory retail dan restaurant menggunakan model yang
    sama
-   [ ] Apakah product/menu memiliki variant dan modifier pada MVP

------------------------------------------------------------------------

# 33. Product Principle

Produk harus mengikuti prinsip:

> **One platform, multiple channels, one source of truth.**

POS, QR Ordering, dan Admin Dashboard tidak boleh menjadi sistem yang
berdiri sendiri.

Semua channel harus menggunakan backend dan business rules yang sama.

``` text
                  ONE PLATFORM
                       │
        ┌──────────────┼──────────────┐
        │              │              │
       POS          QR ORDER        ADMIN
        │              │              │
        └──────────────┼──────────────┘
                       │
                 CORE BACKEND
                       │
              ┌────────┼────────┐
              │        │        │
           Catalog    Sales   Inventory
              │        │        │
              └────────┼────────┘
                       │
                   PostgreSQL
```

------------------------------------------------------------------------

## Document Status

  -----------------------------------------------------------------------
  Property                            Value
  ----------------------------------- -----------------------------------
  Product                             Dagana

  Document                            Product Requirements Document

  Version                             Draft v0.1

  Status                              Draft

  Next Step                           Domain Modeling

  Following Steps                     ERD → API Specification → System
                                      Architecture → Implementation
                                      Planning
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## Next Documentation Milestones

Dokumen PRD ini menjadi acuan awal untuk tahap berikutnya:

1.  **Domain Modeling**
2.  **Bounded Context / Module Definition**
3.  **ERD & Database Design**
4.  **API Specification**
5.  **Authentication & Authorization Design**
6.  **Multi-Tenancy Strategy**
7.  **Offline Synchronization Design**
8.  **Realtime Event Architecture**
9.  **System Architecture**
10. **Implementation Planning**
