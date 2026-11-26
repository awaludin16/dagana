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

- modifier kompleks

Contoh:

```text
Es Kopi Susu
Rp15.000
```

sudah cukup untuk mulai menjual.

### Gambar menu

Merchant dapat menambahkan satu gambar per menu (JPEG/PNG/WebP, maks. 5 MB, 4096×4096; SVG ditolak) saat membuat menu atau lewat detail menu. Gambar disimpan di bucket khusus `dagana-product-images` dengan path `businesses/{business_id}/products/{product_id}/{uuid}.{ext}`; URL publik hanya dibangun dari konfigurasi khusus, bukan endpoint S3/MinIO internal. Tanpa gambar atau tanpa konfigurasi public URL, `image_url` bernilai `null`. Mengganti atau menghapus gambar memerlukan `products.update`; pengguna dengan `products.read` melihat detail secara read-only. Hapus permanen tidak tersedia di detail menu—hanya nonaktifkan/aktifkan kembali. Bila unggah gambar gagal saat membuat menu, menu tetap tersimpan, dialog ditutup, dan notifikasi memberitahu pengguna untuk mengulang lewat detail menu.

### Ketersediaan menu

Menu dapat dinonaktifkan secara global (`is_active = false`), ditandai habis untuk seluruh Business (`is_available = false`), atau ditandai habis hanya pada outlet tertentu dengan menetapkan stok 0 (mis. bahan habis di satu cabang). Penandaan habis per outlet tidak mengubah harga dan tidak memengaruhi outlet lain (D-39). Operator dengan akses outlet, termasuk kasier, dapat mengubah stok saat berjualan.

### Stok menu opsional

Merchant dapat, tetapi tidak wajib, memantau jumlah menu yang dapat dijual di tiap outlet (D-37). Menu tanpa stok yang dipantau tetap dapat dijual tanpa batas. Jika stok dipantau, angka habis di outlet itu menolak penjualan dan menu tidak tampil sebagai tersedia di POS. Stok berkurang otomatis saat checkout dan dapat dikoreksi manual oleh OWNER/MANAGER/CASHIER yang memiliki akses outlet, dengan alasan opsional; setiap perubahan tercatat dalam ledger. Stok bukan prasyarat onboarding dan tidak terkait dengan resep atau bahan baku.

Saat membuat menu, merchant dengan satu outlet dapat mengisi stok awal secara opsional; untuk multi-outlet, stok diatur per outlet setelah menu dibuat (D-38). Tabel katalog menampilkan kolom `Stok` terpisah bila ada menu yang stoknya dipantau: `—` berarti tanpa batas, angka berarti tersedia, dan `Habis` berarti stok 0. Kolom status menunjukkan aktif/nonaktif plus `Habis di semua outlet` bila master switch mati, `Habis di outlet ini` bila stok 0, atau `Tersedia di outlet ini` selainnya (D-39).

Merchant dapat menentukan batas stok menipis per menu dan outlet. Batas hanya dapat diatur ketika stok sedang dipantau; sistem menolak batas jika stok tidak diset. Jika tidak diisi, sistem memakai default **10 porsi** dan baris lama otomatis mendapat nilai tersebut. Peringatan ditampilkan sebagai badge `Menipis` di katalog dan POS; nilai `0` menonaktifkan peringatan. Notifikasi aktif dan ringkasan dashboard belum menjadi bagian MVP.

D-39 menghapus ketersediaan per outlet dan aksi cepat `Tandai habis` / `Jeda penjualan`. Satu-satunya cara menandai menu habis di satu outlet adalah menetapkan stok 0 lewat dialog ubah stok; kasier memiliki permission `products.update_stock` untuk melakukan ini pada outlet yang diaksesnya. Tidak ada lagi status `Dijeda di outlet ini`, sehingga stok yang masih tersisa selalu dilaporkan tersedia kecuali master switch global mati.

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
Reporting
```

Order source:

```text
POS
QR
ADMIN
```

---
