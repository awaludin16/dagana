# Requirement — Identity & Access

> **Jenis dokumen:** Functional / non-functional requirements
> **Status:** Draft
> **Tujuan:** Mengatur identitas, onboarding, Business/Outlet, membership, role, permission, dan employee.

Dokumen ini adalah sumber requirement untuk cakupan yang disebutkan. Interpretasi teknis berada di `docs/architecture/`; acceptance criteria implementasi berada di `docs/planning/phase-targets.md`. Jika behavior diubah, perbarui dokumen ini dan catat keputusan yang relevan.

---

## Organization & Multi-Tenancy

### 1 Core Organization Model

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

---

## Owner-as-Operator Model

Ini merupakan **keputusan product utama Dagana**.

### 1 Owner Dapat Berjualan

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

---

## Single Operator Mode

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

---

## Onboarding

Onboarding harus mengikuti kebutuhan merchant, bukan struktur enterprise.

### 1 Target Flow

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

### 2 First-Time Merchant

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

### 3 Primary CTA

Aplikasi harus memiliki entry point yang jelas:

> **Mulai Jualan**

bukan:

> Kelola Organisasi

atau:

> Setup Business

Dashboard tetap tersedia, tetapi aktivitas menjual harus menjadi workflow utama.

---

---

## User, Membership, Role & Permission

### 1 User dan Business

Satu User hanya terhubung dengan **satu Business**. Satu Business dimiliki oleh satu Owner dan dapat mempunyai banyak Outlet serta banyak akun employee. User tidak dapat bergabung ke Business lain menggunakan akun yang sama.

Model:

```text
Business
  ├── Owner User (tepat satu)
  ├── Employee Users
  └── Many Outlets
```

Business Membership tetap digunakan untuk menyimpan hubungan User dengan Business, role, status, dan outlet access, tetapi setiap User hanya boleh memiliki satu membership aktif dan satu Business sepanjang model MVP. Tegakkan aturan ini dengan unique constraint, validasi backend, dan test.

### 2 Outlet Access

User dapat diberi akses ke satu atau beberapa Outlet dalam Business-nya. Owner memiliki akses ke seluruh Outlet secara default. Semua permintaan tetap harus memvalidasi `business_id`, membership, dan `outlet_id` di backend.

---

## Role sebagai Permission Preset

MVP hanya memiliki tiga role preset:

- `OWNER`: kontrol penuh terhadap Business dan operasional.
- `MANAGER`: mengelola operasional dan employee sesuai permission yang diberikan; tidak dapat menghapus atau mengambil alih Owner.
- `CASHIER`: menjalankan penjualan, pembayaran, dan Cash Session sesuai permission.

Baseline akses role:

| Kapabilitas | Owner | Manager | Cashier |
|---|---:|---:|---:|
| POS, order, pembayaran, Cash Session | Ya | Ya | Ya |
| Kelola catalog/menu | Ya | Ya | Tidak |
| Lihat laporan | Ya | Ya | Tidak |
| Kelola inventory dasar | Ya | Ya | Tidak |
| Kelola employee dan outlet access | Ya | Ya, kecuali Owner/permission | Tidak |
| Ubah pengaturan bisnis/billing | Ya | Terbatas | Tidak |
| Hapus/nonaktifkan Business | Ya, guarded | Tidak | Tidak |

Akses aktual tetap ditentukan oleh permission preset dan outlet scope yang diperiksa backend. Manager tidak dapat mengubah Owner atau memberikan hak yang lebih tinggi daripada hak yang dimilikinya.

Tidak ada role `INVENTORY`, `KITCHEN`, `STAFF`, atau custom role pada MVP. Kebutuhan akses khusus ditangani melalui permission yang tersedia dan outlet access, bukan dengan menambah role baru.

Role adalah preset awal; authorization tetap berdasarkan permission preset dan scope Business/Outlet. Owner dapat langsung berjualan tanpa membuat akun Cashier.

---

## Permission Model

Permission memakai pola `resource.action`. Katalog awal:

```text
business.read
business.update
business.delete

outlets.read
outlets.create
outlets.update
outlets.delete

members.read
members.invite
members.update
members.remove

categories.read
categories.create
categories.update
categories.delete

products.read
products.create
products.update
products.delete

orders.read
orders.create
orders.update
orders.cancel

payments.read
payments.create
payments.refund

cash.read
cash.open
cash.cash_in
cash.cash_out
cash.close
cash.reconcile

inventory.read
inventory.adjust
inventory.stock_opname

reports.read
reports.export

qr.read
qr.manage

kitchen.read
kitchen.update_status

billing.read
billing.manage_settings

audit.read
settings.read
settings.update
```

### 1 Authorization Rules

- Backend memeriksa permission dan Business/Outlet scope pada setiap operasi; menyembunyikan tombol di frontend bukan pengamanan.
- `delete` hanya tersedia untuk resource yang aman dihapus secara logis. Untuk Business, Outlet, kategori, dan produk, gunakan soft delete/archive atau status nonaktif bila data historis masih direferensikan.
- User/member yang tidak lagi boleh mengakses Business harus dinonaktifkan atau dikeluarkan (`members.remove`), bukan menghapus riwayat audit.
- Order selesai, payment, cash movement, stock movement, dan audit log **tidak boleh dihapus permanen**. Koreksi dilakukan melalui cancel, refund, reversal, atau adjustment yang tercatat.
- `business.delete` hanya untuk Owner dan harus berupa proses soft-delete/deactivation dengan pemeriksaan dependensi serta audit trail; bukan penghapusan langsung dari database.
- Perubahan role hanya dapat dilakukan Owner; Manager tidak dapat mengubah role Owner atau menaikkan hak aksesnya sendiri.
- Permission efektif dan outlet access harus dites di backend; role name saja tidak cukup untuk memberi akses.

### 2 Pengelolaan Role

MVP tidak menyediakan custom role atau arbitrary per-user permission overrides. Role preset dikelola terpusat dan tidak dapat diedit oleh merchant. Perubahan role atau permission memerlukan revisi PRD/ADR.

---

## Owner Default Permissions

Owner memperoleh seluruh permission yang relevan untuk Business dan seluruh Outlet miliknya. Owner dapat langsung membuka Cash Session, mengakses POS, membuat order, mencatat pembayaran, mengelola menu, melihat laporan, dan mengelola employee tanpa konfigurasi tambahan.

---

---

## Employee Management

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
