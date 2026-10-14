# Dagana — UI/UX Design System

> **UI/UX Design System & Product Design Guidelines**

| Field        | Value                           |
| ------------ | ------------------------------- |
| Product      | Dagana                          |
| Product Type | F&B Business Operating Platform |
| Version      | Draft v1.0                      |
| Status       | Revised Design Baseline         |

---

## Daftar Isi

- [1. Purpose](#1-purpose)
- [2. Core Design Principle](#2-core-design-principle)
- [3. Design Philosophy](#3-design-philosophy)
- [4. Primary UX Goal](#4-primary-ux-goal)
- [5. Target User](#5-target-user)
- [6. Owner-as-Operator UX](#6-owner-as-operator-ux)
- [7. UX Priority by User State](#7-ux-priority-by-user-state)
- [8. Navigation Philosophy](#8-navigation-philosophy)
- [9. POS Is a First-Class Screen](#9-pos-is-a-first-class-screen)
- [10. POS Design Principle](#10-pos-design-principle)
- [11. Product Selection](#11-product-selection)
- [12. Product Card](#12-product-card)
- [13. Cart](#13-cart)
- [14. Checkout](#14-checkout)
- [15. Payment UX](#15-payment-ux)
- [16. Payment Feedback](#16-payment-feedback)
- [17. Transaction Completion](#17-transaction-completion)
- [18. Cash Session UX](#18-cash-session-ux)
- [19. Closing Cash](#19-closing-cash)
- [20. Inventory UX](#20-inventory-ux)
- [21. Stock Adjustment UX](#21-stock-adjustment-ux)
- [22. Stock Opname UX](#22-stock-opname-ux)
- [23. Refund UX](#23-refund-ux)
- [24. Dashboard Philosophy](#24-dashboard-philosophy)
- [25. Dashboard Hierarchy](#25-dashboard-hierarchy)
- [26. Dashboard for Small Merchant](#26-dashboard-for-small-merchant)
- [27. Empty State](#27-empty-state)
- [28. Loading State](#28-loading-state)
- [29. Error State](#29-error-state)
- [30. Error Message Principle](#30-error-message-principle)
- [31. Destructive Action](#31-destructive-action)
- [32. Confirmation Principle](#32-confirmation-principle)
- [33. Form Design](#33-form-design)
- [34. Form Complexity](#34-form-complexity)
- [35. Navigation Depth](#35-navigation-depth)
- [36. Mobile UX](#36-mobile-ux)
- [37. Desktop UX](#37-desktop-ux)
- [38. Responsive Principle](#38-responsive-principle)
- [39. Typography](#39-typography)
- [40. Color System](#40-color-system)
- [41. Primary Action](#41-primary-action)
- [42. Button Hierarchy](#42-button-hierarchy)
- [43. Tables](#43-tables)
- [44. List vs Card](#44-list-vs-card)
- [45. Modal](#45-modal)
- [46. Toast](#46-toast)
- [47. Notification](#47-notification)
- [48. Search](#48-search)
- [49. Product Management](#49-product-management)
- [50. Orders](#50-orders)
- [51. Status Design](#51-status-design)
- [52. Accessibility](#52-accessibility)
- [53. Animation](#53-animation)
- [54. Design Consistency](#54-design-consistency)
- [55. Component Philosophy](#55-component-philosophy)
- [56. Design Tokens](#56-design-tokens)
- [57. Empty Dashboard Rule](#57-empty-dashboard-rule)
- [58. First Sale UX](#58-first-sale-ux)
- [59. Busy Mode Principle](#59-busy-mode-principle)
- [60. UX Does Not Override Business Rules](#60-ux-does-not-override-business-rules)
- [61. AI UI Rules](#61-ai-ui-rules)
- [62. Anti AI-Slop Rules](#62-anti-ai-slop-rules)
- [63. Design Decision Rule](#63-design-decision-rule)
- [64. UI Definition of Done](#64-ui-definition-of-done)
- [65. Final Design Principle](#65-final-design-principle)
- [66. Design Mantra](#66-design-mantra)
- [67. Mobile-First Standard](#67-mobile-first-standard)
- [68. Screen Orientation Policy](#68-screen-orientation-policy)
- [69. UI Preview — POS Responsive Layout](#69-ui-preview--pos-responsive-layout)
- [70. Responsive Testing & Definition of Done](#70-responsive-testing--definition-of-done)

---

## 1. Purpose

Dokumen ini menjadi pedoman desain UI/UX Dagana.

Tujuannya adalah memastikan seluruh interface Dagana:

- mudah dipahami merchant kecil
- cepat digunakan saat operasional ramai
- konsisten antar halaman
- tidak terasa seperti software enterprise yang kompleks
- mengutamakan workflow dibanding dekorasi
- meminimalkan cognitive load
- tetap scalable ketika merchant berkembang

Dokumen ini menjadi acuan untuk:

```text
UX Flow
UI Design
Component Design
Layout
Navigation
Forms
POS
Dashboard
Mobile
Desktop
Responsive Design
Empty State
Loading State
Error State
AI-generated UI
```

---

## 2. Core Design Principle

Prinsip utama Dagana:

> **Simple for the first sale. Structured for the next stage.**

UI Dagana harus membantu merchant menyelesaikan pekerjaan, bukan membuat
merchant mempelajari software.

Prioritas:

```text
Task Completion
>
Clarity
>
Speed
>
Consistency
>
Information Density
>
Decoration
```

Jangan membalik prioritas menjadi:

```text
Decoration
>
Animation
>
Cards
>
Gradients
>
Task
```

---

## 3. Design Philosophy

Dagana bukan dashboard yang kebetulan mempunyai POS.

Dagana adalah:

> **operational tool untuk menjalankan bisnis F&B.**

Karena itu UI harus mengikuti workflow.

Contoh:

```text
Merchant ingin menjual
        ↓
Buka POS
        ↓
Pilih produk
        ↓
Checkout
        ↓
Bayar
        ↓
Selesai
```

Bukan:

```text
Dashboard
 ↓
Scroll
 ↓
Cari menu
 ↓
Buka submenu
 ↓
Buka POS
```

---

## 4. Primary UX Goal

User harus dapat:

```text
Login
↓
Open POS
↓
Sell Product
↓
Receive Payment
↓
Finish Transaction
```

dengan friction seminimal mungkin.

Untuk merchant yang baru menggunakan Dagana:

```text
Create Business
↓
Create Outlet
↓
Add Product
↓
Start Selling
```

adalah jalur utama.

---

## 5. Target User

Primary user:

```text
Owner
```

yang dapat sekaligus menjadi:

```text
Operator
Cashier
Inventory Manager
Manager
```

Secondary users:

```text
Cashier
Manager
Inventory
Kitchen
```

UX tidak boleh mengasumsikan bahwa setiap bisnis memiliki struktur
organisasi kompleks.

---

## 6. Owner-as-Operator UX

Dagana harus nyaman digunakan oleh:

```text
Owner
+
0 Employee
```

Owner tidak boleh dipaksa melewati:

```text
Employee Setup
Shift Setup
Staff Assignment
Permission Configuration
```

sebelum dapat menjual.

---

## 7. UX Priority by User State

### First-time User

Prioritas:

```text
Start Selling
```

Bukan:

```text
Analytics
Reports
Settings
Billing
```

---

### Returning Merchant

Prioritas:

```text
Open POS
Today's Sales
Active Cash Session
Pending Tasks
```

---

### Merchant During Busy Hours

Prioritas:

```text
Speed
Large Touch Targets
Clear Product Selection
Fast Checkout
Minimal Confirmation
```

---

## 8. Navigation Philosophy

Navigation harus mengikuti pekerjaan merchant.

Primary navigation MVP:

```text
POS
Orders
Products
Cash
Inventory
Reports
More
```

Tidak semua fitur harus tampil sebagai primary navigation.

Contoh:

```text
Employees
Settings
Billing
Audit
```

dapat berada di:

```text
More / Settings
```

---

## 9. POS Is a First-Class Screen

POS bukan sekadar halaman biasa.

POS harus menjadi operational workspace.

Desktop concept:

```text
┌─────────────────────────────────────────────────────────┐
│ Outlet              Cash Session             User       │
├───────────────────────────────┬─────────────────────────┤
│                               │                         │
│ Categories                    │       Cart              │
│                               │                         │
│ [Food] [Drink] [Snack]        │ Product x2       20K   │
│                               │ Product x1       15K   │
│ [ Product ] [ Product ]       │                         │
│ [ Product ] [ Product ]       │ Subtotal         35K   │
│ [ Product ] [ Product ]       │                         │
│                               │ [ CHECKOUT ]            │
└───────────────────────────────┴─────────────────────────┘
```

POS harus meminimalkan perpindahan halaman.

---

## 10. POS Design Principle

Saat berada di POS:

```text
Product Selection
+
Cart
+
Checkout
```

harus terasa sebagai satu workflow.

Hindari:

```text
Product Page
↓
Add
↓
Cart Page
↓
Checkout Page
↓
Payment Page
```

jika perpindahan tersebut tidak diperlukan.

---

## 11. Product Selection

Product dapat ditemukan melalui:

```text
Category
Search
Barcode
Recent Product
Favorite Product
```

Namun MVP tidak harus memiliki seluruh metode tersebut.

Minimum:

```text
Category
+
Search
+
Product Grid
```

---

## 12. Product Card

Product card harus memberikan informasi yang relevan untuk menjual.

Minimum:

```text
Product Name
Price
Availability
```

Contoh:

```text
┌──────────────────┐
│                  │
│    Kopi Susu     │
│                  │
│    Rp 18.000     │
│                  │
└──────────────────┘
```

Jangan memenuhi card dengan:

```text
SKU
Created At
Updated At
Inventory ID
Product UUID
```

Informasi teknis tidak relevan untuk aktivitas jualan.

---

## 13. Cart

Cart harus selalu mudah ditemukan.

Informasi utama:

```text
Product
Quantity
Price
Subtotal
```

Contoh:

```text
Kopi Susu
[-] 2 [+]
Rp18.000
Rp36.000
```

Total harus terlihat jelas.

---

## 14. Checkout

Checkout harus memberikan ringkasan:

```text
Subtotal
Discount (jika tersedia)
Tax / Service (jika berlaku)
Total
```

Jangan menampilkan field yang belum digunakan oleh MVP.

---

## 15. Payment UX

Payment harus sederhana.

MVP utama:

```text
CASH
```

Contoh:

```text
Total

Rp 35.000

Amount Received

[ 50.000 ]

Change

Rp 15.000

[ BAYAR ]
```

Change harus dihitung sistem.

User tidak perlu menghitung manual.

---

## 16. Payment Feedback

Setelah payment:

```text
SUCCESS
```

harus sangat jelas.

Contoh:

```text
✓ Pembayaran Berhasil

Total
Rp 35.000

Kembalian
Rp 15.000

[ TRANSAKSI BARU ]
```

Jangan membuat success state yang ambigu.

---

## 17. Transaction Completion

User harus dapat memahami bahwa transaksi benar-benar selesai.

Contoh:

```text
Pembayaran Berhasil
↓
Transaksi Selesai
```

Jika receipt tersedia:

```text
[ CETAK STRUK ]
```

Jika printing gagal:

```text
Transaksi tetap berhasil.
```

Error printer tidak boleh membuat user mengira pembayaran gagal.

---

## 18. Cash Session UX

Cash Session harus sederhana.

Saat belum ada session:

```text
Kas Belum Dibuka

Saldo Awal
[ Rp 100.000 ]

[ BUKA KAS ]
```

Saat aktif:

```text
Kas Aktif

Saldo Awal       Rp100.000
Penjualan Tunai  Rp350.000
Pengeluaran      Rp 50.000

Expected Cash    Rp400.000

[ TUTUP KAS ]
```

---

## 19. Closing Cash

Closing harus menampilkan:

```text
Expected Cash
Actual Cash
Variance
```

Contoh:

```text
Expected Cash
Rp 400.000

Uang Fisik
[ Rp 390.000 ]

Selisih
- Rp 10.000
```

User harus memahami selisih tanpa membaca dokumentasi teknis.

---

## 20. Inventory UX

Inventory bukan harus terlihat kompleks.

Minimum:

```text
Stock
Low Stock
Stock Adjustment
Stock Opname
Movement History
```

Contoh:

```text
Kopi Susu

Stock
24

Status
Normal
```

Low stock:

```text
Kopi Susu

Stock
3

⚠ Stok Menipis
```

---

## 21. Stock Adjustment UX

Jangan membuat adjustment seperti form ERP.

Minimum:

```text
Product
Current Stock
Adjustment
Reason
```

Contoh:

```text
Kopi Susu

Stock Saat Ini
20

Jumlah Penyesuaian
[-3]

Alasan
[ Barang rusak ]

[ SIMPAN ]
```

---

## 22. Stock Opname UX

Flow:

```text
Select Product
↓
System Stock
↓
Count Physical Stock
↓
Input Actual Stock
↓
Show Difference
↓
Confirm
```

Contoh:

```text
System Stock
50

Stock Fisik
47

Selisih
-3

[ KONFIRMASI OPNAME ]
```

---

## 23. Refund UX

Refund harus membedakan:

```text
Refund Uang
```

dan:

```text
Barang Kembali ke Stok
```

Jangan menggunakan satu checkbox yang ambigu.

Contoh:

```text
Refund Transaksi

Total Refund
Rp 50.000

Barang dikembalikan?
( ) Tidak
( ) Ya

Jika Ya:
Barang layak dijual kembali?
( ) Ya
( ) Tidak

[ PROSES REFUND ]
```

Untuk produk makanan/minuman yang sudah dikonsumsi:

```text
Inventory Return
Tidak tersedia / tidak relevan
```

sesuai domain rule.

---

## 24. Dashboard Philosophy

Dashboard bukan tempat untuk menampilkan sebanyak mungkin informasi.

Dashboard harus menjawab:

```text
Bagaimana kondisi bisnis saya hari ini?
```

Minimum:

```text
Today's Sales
Transaction Count
Cash Status
Low Stock
Recent Transactions
```

---

## 25. Dashboard Hierarchy

Prioritas visual:

```text
1. Today's Sales
2. Transaction Count
3. Cash Status
4. Important Alerts
5. Recent Transactions
6. Secondary Analytics
```

Jangan membuat:

```text
20 KPI Cards
```

hanya karena dashboard terlihat lebih lengkap.

---

## 26. Dashboard for Small Merchant

Contoh:

```text
Selamat datang, Budi

Hari ini
Rp 1.250.000
42 transaksi

Kas
● Aktif

Stok Menipis
3 produk

Transaksi Terbaru
...
```

Primary CTA:

```text
[ MULAI JUALAN ]
```

jika POS belum digunakan.

---

## 27. Empty State

Empty state harus mengarahkan user ke tindakan.

Buruk:

```text
No Data
```

Lebih baik:

```text
Belum ada produk

Tambahkan menu pertama untuk mulai berjualan.

[ TAMBAH PRODUK ]
```

---

## 28. Loading State

Loading harus menunjukkan bahwa sistem sedang bekerja.

Gunakan:

```text
Skeleton
Spinner
Progress
```

sesuai konteks.

Jangan membuat user mengira aplikasi berhenti.

---

## 29. Error State

Error harus:

```text
Clear
Actionable
Short
```

Contoh:

Buruk:

```text
SQLSTATE[23505]
```

Lebih baik:

```text
Transaksi gagal diproses.

Silakan coba lagi.
```

Jika tindakan diperlukan:

```text
Stok Kopi Susu tidak cukup.

Stok tersedia: 2
Jumlah diminta: 3
```

---

## 30. Error Message Principle

Gunakan:

```text
What happened
+
What user can do
```

Contoh:

```text
Kas belum dibuka.

Buka kas terlebih dahulu untuk menerima pembayaran tunai.
```

---

## 31. Destructive Action

Action seperti:

```text
Delete
Void
Refund
Close Cash
Disable Product
```

harus memiliki confirmation yang proporsional.

Jangan meminta confirmation untuk setiap action kecil.

---

## 32. Confirmation Principle

Confirmation harus menjelaskan konsekuensi.

Buruk:

```text
Are you sure?
```

Lebih baik:

```text
Tutup kas sekarang?

Setelah ditutup, sesi kas ini tidak dapat dibuka kembali pada MVP.

Expected Cash
Rp 400.000
```

---

## 33. Form Design

Form harus menggunakan:

```text
Clear Label
Helpful Placeholder
Validation
Reasonable Defaults
```

Jangan menggunakan placeholder sebagai satu-satunya label.

---

## 34. Form Complexity

Form mengikuti prinsip:

> Ask only what is needed now.

Contoh Add Product MVP:

```text
Nama Produk
Harga Jual
Kategori (optional)
```

Jangan langsung:

```text
SKU
Barcode
Variant
Modifier
Recipe
Supplier
COGS
Tax
Printer
Warehouse
```

---

## 35. Navigation Depth

Hindari navigation yang terlalu dalam.

Target:

```text
Primary Task
≤ 3 levels
```

Contoh:

```text
Inventory
↓
Product
↓
Adjustment
```

bukan:

```text
Dashboard
↓
Management
↓
Operations
↓
Inventory
↓
Stock
↓
Product
↓
Action
```

---

## 36. Mobile UX

Dagana MUST menggunakan pendekatan **mobile-first** untuk seluruh web
UI. Mulai desain dari layar kecil, lalu tingkatkan layout untuk tablet
dan desktop.

Mobile interface harus mempertimbangkan:

- touch target yang nyaman
- thumb reach
- keyboard virtual dan ruang yang tersisa
- screen size dan safe area
- scrolling
- modal dan drawer size
- koneksi yang lambat serta feedback saat memuat data

Jangan menganggap mobile sebagai versi desktop yang diperkecil.
Prioritaskan tugas utama, sederhanakan navigasi, dan tampilkan informasi
tambahan secara bertahap.

Minimum interactive target harus nyaman disentuh. Hover tidak boleh
menjadi satu-satunya cara mengakses tindakan penting.

---

## 37. Desktop UX

Desktop dapat menggunakan:

```text
Sidebar
+
Content
+
Contextual Panel
```

Untuk POS:

```text
Product Area
+
Persistent Cart
```

Untuk admin:

```text
Navigation
+
Main Content
```

---

## 38. Responsive Principle

Responsive bukan sekadar mengecilkan desktop UI. Dagana MUST mendukung
layout yang layak pada mobile, tablet, dan desktop.

Setiap screen harus menentukan:

```text
Primary Action
Secondary Action
Optional Information
```

Pada mobile, primary action tetap mudah ditemukan tanpa menghilangkan
konteks penting.

Aturan implementasi:

- Gunakan pendekatan mobile-first dan breakpoint yang konsisten dari konfigurasi proyek.
- Gunakan grid, panel, dan navigasi yang menyesuaikan ruang tersedia.
- Cegah horizontal overflow yang tidak disengaja.
- Untuk tabel lebar, sediakan alternatif mobile yang tetap mempertahankan informasi penting.
- Form, modal, dropdown, dan dialog harus tetap dapat digunakan pada layar kecil.
- Jangan menyembunyikan tindakan penting hanya untuk menyesuaikan layout.
- Uji workflow utama pada mobile, tablet, dan desktop.

---

## 39. Typography

Typography harus:

```text
Readable
Clear
Consistent
```

Hierarchy minimal:

```text
Display
Heading
Subheading
Body
Caption
Label
```

Jangan menggunakan terlalu banyak ukuran font.

---

## 40. Color System

Warna digunakan untuk komunikasi, bukan dekorasi.

Semantic colors:

```text
Success
Warning
Danger
Info
Neutral
```

Contoh:

```text
Success
→ Payment berhasil

Warning
→ Low stock

Danger
→ Payment failed / destructive action
```

Jangan menggunakan warna hanya karena terlihat menarik.

---

## 41. Primary Action

Setiap screen harus memiliki primary action yang jelas.

Contoh:

```text
Products
→ Tambah Produk

POS
→ Checkout

Cash
→ Buka Kas / Tutup Kas

Inventory
→ Adjustment / Opname
```

Jangan membuat semua button terlihat sama penting.

---

## 42. Button Hierarchy

Gunakan:

```text
Primary
Secondary
Tertiary
Destructive
```

Contoh:

```text
[ SIMPAN ]       Primary
[ BATAL ]        Secondary
Lihat Detail     Tertiary
[ HAPUS ]        Destructive
```

---

## 43. Tables

Table digunakan ketika user perlu membandingkan banyak data.

Contoh:

```text
Orders
Products
Inventory Movements
Employees
```

Jangan menggunakan table untuk workflow sederhana yang hanya membutuhkan
beberapa item.

---

## 44. List vs Card

Gunakan:

```text
List
```

untuk:

- transaction history
- orders
- movements

Gunakan:

```text
Card
```

untuk:

- product selection
- summary
- dashboard highlights

Jangan menjadikan semua data sebagai card.

---

## 45. Modal

Modal digunakan untuk:

- confirmation
- small form
- quick action
- focused interaction

Jangan menggunakan modal untuk workflow panjang.

Jika workflow kompleks:

```text
Use Page
```

---

## 46. Toast

Toast digunakan untuk feedback singkat:

```text
Produk berhasil ditambahkan.
Pembayaran berhasil.
Perubahan disimpan.
```

Jangan menyimpan informasi penting hanya di toast.

---

## 47. Notification

Notification digunakan untuk sesuatu yang membutuhkan perhatian.

Contoh:

```text
Stok menipis
Cash variance
Payment issue
System issue
```

Tidak semua event harus menghasilkan notification.

---

## 48. Search

Search harus:

```text
Fast
Forgiving
Relevant
```

Untuk POS, search harus memprioritaskan:

```text
Product Name
```

dan field yang relevan untuk merchant.

Jangan memaksa merchant mengingat UUID atau SKU internal.

---

## 49. Product Management

Product page harus fokus pada:

```text
Product Name
Price
Category
Status
Inventory Tracking
```

Advanced configuration dapat ditempatkan pada bagian lanjutan.

---

## 50. Orders

Order list harus memprioritaskan:

```text
Order Number
Time
Total
Payment Status
Order Status
Source
```

Contoh:

```text
#ORD-001
10:32
Rp 45.000
PAID
COMPLETED
POS
```

---

## 51. Status Design

Status harus mudah dipahami.

Gunakan:

```text
Label
+
Semantic Color
```

Contoh:

```text
● Paid
● Pending
● Failed
● Completed
● Cancelled
```

Jangan mengandalkan warna saja.

---

## 52. Accessibility

UI harus mempertimbangkan:

- readable contrast
- keyboard navigation pada web
- focus state
- touch target
- text alternatives
- semantic labels

Informasi penting tidak boleh disampaikan hanya melalui warna.

Contoh:

Jangan:

```text
🟢
```

saja.

Gunakan:

```text
🟢 Pembayaran Berhasil
```

---

## 53. Animation

Animation digunakan jika membantu:

```text
Feedback
Transition
State Change
Orientation
```

Jangan menggunakan animation hanya untuk membuat UI terlihat modern.

POS terutama harus mengutamakan speed.

---

## 54. Design Consistency

Komponen yang memiliki fungsi sama harus memiliki behavior yang sama.

Contoh:

```text
Primary Button
```

tidak boleh mempunyai behavior berbeda di setiap halaman.

Design tokens harus digunakan untuk:

```text
Spacing
Typography
Radius
Shadow
Color
Button
Input
```

---

## 55. Component Philosophy

Component harus dibuat berdasarkan pola yang berulang.

Contoh:

```text
Button
Input
Select
Modal
Dialog
Toast
Badge
Card
Table
Tabs
Dropdown
```

Jangan membuat component abstraction terlalu dini.

Gunakan abstraction ketika pola memang sudah terbukti berulang.

---

## 56. Design Tokens

UI harus menggunakan centralized design tokens.

Konsep:

```text
colors
typography
spacing
radius
shadows
breakpoints
```

Jangan hardcode nilai visual yang sama berkali-kali.

---

## 57. Empty Dashboard Rule

Dashboard tidak boleh terasa rusak ketika belum ada data.

Contoh:

```text
Today's Sales
Rp 0

0 transaksi
```

bukan:

```text
No Data
No Data
No Data
No Data
```

Empty state harus tetap terasa sebagai produk yang siap digunakan.

---

## 58. First Sale UX

First sale adalah critical UX milestone.

Flow:

```text
Create Business
↓
Create Outlet
↓
Add Product
↓
Open POS
↓
Select Product
↓
Checkout
↓
Cash Payment
↓
Completed
```

Setiap step harus memiliki jalan keluar yang jelas.

---

## 59. Busy Mode Principle

Ketika merchant sedang ramai:

```text
Less Reading
Less Typing
Less Navigation
Less Confirmation
More Direct Action
```

Contoh POS:

```text
Tap Product
↓
Tap +
↓
Checkout
↓
Cash
↓
Done
```

---

## 60. UX Does Not Override Business Rules

UI tidak boleh menyembunyikan domain restriction hanya agar flow
terlihat lebih mudah.

Contoh:

Jika stock tidak cukup:

```text
UI → tampilkan error
```

bukan:

```text
UI → izinkan sale
Backend → nanti beres
```

Backend tetap menjadi authority.

---

## 61. AI UI Rules

AI coding/design agent wajib:

- mengikuti design.md
- menggunakan existing components
- mengikuti design tokens
- mengikuti UX flow
- tidak membuat layout baru tanpa alasan
- tidak membuat dashboard penuh card secara otomatis
- tidak menambahkan gradient hanya untuk dekorasi
- tidak menambahkan animation berlebihan
- tidak menambahkan feature UI yang belum ada di product scope
- tidak membuat form terlalu kompleks
- tidak membuat modal untuk semua interaction
- tidak mengubah workflow tanpa approval

---

## 62. Anti AI-Slop Rules

AI tidak boleh menghasilkan UI seperti:

```text
Gradient everywhere
+
Huge Hero Section
+
10 KPI Cards
+
Glassmorphism
+
Random Icons
+
Excessive Shadows
+
Unnecessary Animation
+
Generic SaaS Dashboard
```

hanya karena pola tersebut umum pada hasil AI-generated UI.

Dagana harus terasa seperti:

```text
Operational Software
```

bukan:

```text
AI-generated SaaS Landing Page
```

---

## 63. Design Decision Rule

Jika AI ingin membuat perubahan UI/UX yang memengaruhi workflow:

```text
STOP
↓
Identify affected flow
↓
Check product documentation
↓
Check business rules
↓
Explain proposed change
↓
Get approval
↓
Update documentation
↓
Implement
```

Perubahan visual kecil tidak perlu approval.

Perubahan workflow perlu.

---

## 64. UI Definition of Done

Sebuah UI feature dianggap selesai jika:

```text
✓ Follows user flow
✓ Follows business rules
✓ Uses correct permission state
✓ Handles loading
✓ Handles empty state
✓ Handles error state
✓ Handles success state
✓ Responsive where required
✓ Uses design tokens
✓ Uses reusable components where appropriate
✓ Does not introduce unnecessary complexity
✓ Tested against real workflow
```

---

## 65. Final Design Principle

Dagana harus selalu bertanya:

> **"Apa yang sedang ingin diselesaikan user sekarang?"**

Jika jawabannya:

```text
Jual produk
```

maka tampilkan:

```text
Product
Cart
Checkout
Payment
```

Jika:

```text
Tutup kas
```

maka tampilkan:

```text
Expected
Actual
Variance
Confirm
```

Jika:

```text
Cek stok
```

maka tampilkan:

```text
Current Stock
Low Stock
Movement
Adjustment
```

Bukan seluruh kompleksitas sistem.

---

## 66. Design Mantra

```text
Workflow over decoration.
Clarity over density.
Speed over animation.
Action over information.
Progressive disclosure over complexity.
Consistency over novelty.
Real operations over generic SaaS patterns.
```

> **Dagana UI harus membantu merchant bekerja lebih cepat, bukan membuat
> merchant kagum selama lima detik.**

---

## 67. Mobile-First Standard

Mobile-first adalah standar wajib, bukan preferensi visual.

Urutan desain dan implementasi:

```text
Mobile
  ↓
Tablet
  ↓
Desktop
```

Desain harus terlebih dahulu menjawab:

1. Apa tugas utama pengguna di layar ini?
2. Informasi minimum apa yang dibutuhkan untuk menyelesaikannya?
3. Tindakan utama ditempatkan di mana?
4. Informasi sekunder apa yang dapat disembunyikan atau ditampilkan bertahap?
5. Bagaimana layout berkembang saat ruang layar bertambah?

Gunakan centralized design tokens dan breakpoint proyek. Jangan
menetapkan breakpoint berbeda-beda tanpa alasan.

### 67.1 Responsive Acceptance Criteria

Sebuah layar dinyatakan responsive jika:

- Konten utama tidak terpotong.
- Tidak ada horizontal overflow yang tidak disengaja.
- Teks, angka, dan status tetap terbaca.
- Tombol utama dapat dijangkau dan digunakan.
- Form dan dialog tidak keluar dari viewport.
- Tabel memiliki alternatif yang layak pada layar sempit.
- Loading, empty, error, dan success state tetap dapat dipahami.
- Workflow inti tetap dapat diselesaikan pada mobile, tablet, dan desktop.

---

## 68. Screen Orientation Policy

Dagana MUST mendukung **portrait dan landscape** pada perangkat
mobile/tablet yang menjalankan web UI, sejauh kemampuan browser dan
perangkat memungkinkan.

Jangan memaksa seluruh aplikasi ke landscape. Orientasi harus mengikuti
konteks penggunaan.

### General pages

Halaman seperti onboarding, pengaturan, produk, laporan, dan
pembukaan/penutupan kas harus tetap usable dalam portrait. Dalam
landscape, layout boleh memanfaatkan ruang horizontal tambahan.

### POS / Kasir

POS harus dioptimalkan untuk kedua orientasi:

- **Portrait:** alur produk → keranjang → checkout ditata vertikal.
  Ringkasan keranjang dan tombol checkout harus mudah diakses.
- **Landscape:** jika lebar layar mencukupi, tampilkan katalog produk
  dan keranjang berdampingan agar kasir dapat bekerja lebih cepat.
- Jangan mengandalkan orientasi landscape sebagai syarat untuk
  menyelesaikan penjualan.
- Jangan meminta pengguna memutar perangkat berulang kali di tengah
  transaksi.
- Jangan mengubah orientasi secara paksa. Jika aplikasi native di masa
  depan memiliki kebijakan orientasi khusus, keputusan itu harus
  didokumentasikan dan diuji pada perangkat target.

### Cash Session / Buka Kas

Layar pembukaan kas harus sederhana dan berfungsi dalam portrait maupun landscape:

- Status sesi kas.
- Input saldo awal.
- Tombol utama "Buka Kas".
- Validasi dan pesan error yang jelas.

Landscape boleh menggunakan layout dua kolom jika bermanfaat, tetapi
tidak boleh menjadi persyaratan agar kasir dapat membuka sesi kas.

---

## 69. UI Preview — POS Responsive Layout

Preview berikut adalah wireframe konseptual, bukan desain visual final.
Detail komponen, warna, typography, dan spacing mengikuti design tokens
proyek.

### 69.1 Mobile — Portrait

```text
┌──────────────────────────┐
│ Dagana       Kas: Aktif  │
├──────────────────────────┤
│ Cari produk...           │
├──────────────────────────┤
│ [Semua] [Makanan] [Minum]│
├──────────────────────────┤
│ ┌──────────┐ ┌──────────┐│
│ │ Nasi     │ │ Kopi     ││
│ │ Rp18.000 │ │ Rp12.000 ││
│ └──────────┘ └──────────┘│
│ ┌──────────┐ ┌──────────┐│
│ │ Teh      │ │ Roti     ││
│ │ Rp5.000  │ │ Rp8.000  ││
│ └──────────┘ └──────────┘│
├──────────────────────────┤
│ Keranjang (2 item)        │
│ Total         Rp30.000    │
│ [ LIHAT KERANJANG ]       │
│ [ CHECKOUT ]              │
└──────────────────────────┘
```

Portrait mengutamakan pencarian produk dan akses cepat ke keranjang.
Keranjang dapat dibuka sebagai panel atau halaman ringkas tanpa
kehilangan pilihan produk yang sudah ditambahkan.

### 69.2 Mobile / Tablet — Landscape

```text
┌────────────────────────────────────────────────────┐
│ Dagana   Kas: Aktif          Cari produk...        │
├──────────────────────────────┬─────────────────────┤
│ [Semua] [Makanan] [Minuman]  │ KERANJANG           │
│                              │                     │
│ ┌──────────┐ ┌──────────┐    │ Nasi Goreng   18K   │
│ │ Nasi     │ │ Kopi     │    │ Kopi Susu     12K   │
│ │ Rp18.000 │ │ Rp12.000 │    │                     │
│ └──────────┘ └──────────┘    │ Total         30K   │
│ ┌──────────┐ ┌──────────┐    │                     │
│ │ Teh      │ │ Roti     │    │ [ CHECKOUT ]        │
│ │ Rp5.000  │ │ Rp8.000  │    │                     │
│ └──────────┘ └──────────┘    │                     │
└──────────────────────────────┴─────────────────────┘
```

Landscape memanfaatkan lebar layar untuk menampilkan katalog dan
keranjang secara berdampingan apabila viewport cukup lebar. Pada
perangkat yang terlalu sempit, layout boleh kembali menjadi satu kolom.

### 69.3 Cash Session — Portrait

```text
┌──────────────────────────┐
│ Buka Kas                 │
├──────────────────────────┤
│ Outlet: Outlet Utama     │
│                          │
│ Saldo awal               │
│ [ Rp 100.000          ]  │
│                          │
│ Pastikan uang awal sesuai│
│ dengan uang fisik.       │
│                          │
│ [ BUKA KAS ]             │
└──────────────────────────┘
```

### 69.4 Cash Session — Landscape

```text
┌────────────────────────────────────────────────┐
│ Buka Kas — Outlet Utama                        │
├──────────────────────────┬─────────────────────┤
│ Saldo awal               │ Sebelum membuka kas │
│ [ Rp 100.000          ]  │                     │
│                          │ Hitung uang fisik   │
│ [ BUKA KAS ]             │ dan masukkan saldo  │
└──────────────────────────┴─────────────────────┘
```

Kedua wireframe pembukaan kas merepresentasikan workflow yang sama.
Landscape hanya mengubah susunan layout, bukan aturan bisnis atau
langkah yang diwajibkan.

---

## 70. Responsive Testing & Definition of Done

Setiap workflow penting harus diuji minimal pada:

- Mobile portrait.
- Mobile landscape.
- Tablet portrait/landscape sesuai perangkat target.
- Desktop.

Prioritaskan pengujian untuk:

- Onboarding.
- Membuka POS.
- Memilih produk dan mengubah kuantitas.
- Melihat keranjang dan checkout.
- Pembayaran tunai.
- Membuka dan menutup cash session.
- Menangani error dan status transaksi.

Jangan hanya memeriksa screenshot. Pastikan pengguna benar-benar dapat
menyelesaikan workflow dengan sentuhan, keyboard, dan ukuran viewport
yang relevan.

AI coding agent MUST membaca dokumen ini sebelum mengubah UI. Jika
perubahan UI memengaruhi workflow atau business rules, ikuti aturan
approval dalam dokumentasi produk.
