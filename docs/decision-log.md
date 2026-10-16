# Dagana Decision Log — Rekomendasi v1

> **Status dokumen:** usulan baseline untuk ditinjau Product Owner. Keputusan teknis dapat dijadikan default implementasi setelah disetujui. Keputusan komersial, kontraktual, kebijakan, dan perangkat nyata tetap memiliki gate yang dijelaskan di bawah.
>
> **Prinsip:** pilih opsi sederhana untuk MVP, hindari mengunci vendor di domain bisnis, dan jangan mengubah aturan produk secara diam-diam.

## 1. Identity, Business, Membership, dan Authorization

### D-01 — Satu User dapat terhubung ke banyak Business

**Keputusan:** Ya. Gunakan `users` sebagai identitas global dan `business_memberships` sebagai hubungan user–business. Jangan menyimpan satu `business_id` tetap di tabel user sebagai satu-satunya konteks bisnis.

**Alasan:** pengguna bisa memiliki bisnis sendiri sekaligus menjadi pegawai/manager di bisnis lain. Ini menjaga model `User → Membership → Business` di PRD.

**Verifikasi:** satu user bisa menjadi anggota dua business; saat berpindah konteks, API hanya mengembalikan data business yang dipilih dan diotorisasi. Test akses lintas-tenant harus gagal.

### D-02 — Owner dapat memiliki banyak Business

**Keputusan:** Ya. `OWNER` adalah role/preset pada membership suatu Business, bukan atribut global user. Owner dapat mempunyai satu atau lebih membership berperan Owner.

**Verifikasi:** user yang menjadi Owner Business A tidak otomatis berhak membaca Business B tanpa membership dan permission yang sesuai; satu user dapat mengelola dua business miliknya melalui konteks aktif yang eksplisit.

### D-03 — Permission catalog MVP

**Keputusan:** gunakan permission eksplisit berbentuk `resource.action`. Katalog awal:

- `business.read`, `business.update`
- `outlets.read`, `outlets.create`, `outlets.update`, `outlets.disable`
- `members.read`, `members.invite`, `members.update`, `members.disable`
- `roles.read`, `permissions.read`, `permissions.manage_membership`
- `categories.read`, `categories.create`, `categories.update`, `categories.archive`
- `products.read`, `products.create`, `products.update`, `products.archive`
- `orders.read`, `orders.create`, `orders.update`, `orders.cancel`
- `payments.read`, `payments.create`, `payments.refund`
- `cash.read`, `cash.open`, `cash.cash_in`, `cash.cash_out`, `cash.close`, `cash.reconcile`
- `inventory.read`, `inventory.adjust`, `inventory.stock_opname`
- `reports.read`, `reports.export`
- `qr.read`, `qr.manage`
- `kitchen.read`, `kitchen.update_status`
- `billing.read`, `billing.manage_settings`
- `audit.read`
- `settings.read`, `settings.update`

Permission dapat ditambah ketika requirement yang sah muncul. Jangan menggunakan `*` sebagai grant untuk melewati authorization. Endpoint sensitif tetap memeriksa permission backend dan business/outlet scope.

**Catatan:** tindakan platform-level seperti mengubah rate billing semua merchant harus dipisahkan dari `billing.manage_settings` milik merchant. Jangan memberi merchant akses untuk mengubah tarif platform global.

**Verifikasi:** test positif dan negatif untuk setiap kelompok endpoint; user tanpa permission ditolak; owner dapat mengoperasikan POS sesuai default access.

### D-04 — Custom role tidak masuk MVP

**Keputusan:** tidak menyediakan pembuatan role baru pada MVP. Sediakan preset bawaan `OWNER`, `MANAGER`, `CASHIER`, `INVENTORY`, `KITCHEN`, dan `STAFF`. Permission preset disimpan/di-resolve secara terkontrol dan tetap menjadi sumber authorization.

Untuk fleksibilitas yang sudah disebut dalam PRD, membership dapat memiliki override permission eksplisit. Hasil efektif ditentukan dengan aturan yang konsisten: permission yang secara eksplisit ditolak pada membership tidak dapat diperoleh dari preset; permission yang secara eksplisit diberikan dapat menambah kemampuan di luar preset, selama tidak melanggar larangan sistem. UI override dibuat terbatas dan hanya dapat dikelola oleh aktor yang berwenang.

**Verifikasi:** role preset tidak dapat dibuat bebas oleh merchant; override efektif sesuai aturan; pengguna tidak dapat memberikan dirinya sendiri permission yang tidak dimilikinya untuk dikelola.

### D-05 — Permission per Outlet

**Keputusan:** tidak membuat permission matrix yang berbeda untuk setiap outlet pada MVP. Membership menyimpan set outlet yang boleh diakses; permission efektif membership berlaku pada outlet-outlet tersebut. Otorisasi untuk resource outlet harus memvalidasi kedua hal: permission tindakan dan akses ke outlet terkait.

**Alasan:** ini memenuhi outlet scoping tanpa membangun kombinasi role-permission-outlet yang kompleks. Per-outlet permission matrix dapat ditambahkan setelah kebutuhan nyata terbukti.

**Verifikasi:** cashier yang hanya diberi Outlet A tidak dapat membaca atau mengubah order, cash session, inventory, table, maupun report Outlet B meskipun ia mempunyai permission resource yang sesuai.

## 2. Cash Session

### D-06 — Satu operator bertanggung jawab untuk satu Cash Session

**Keputusan:** satu session mempunyai tepat satu operator penanggung jawab. Owner boleh menjadi operator. User pencatat/penutup lain dapat dicatat sebagai actor audit, tetapi tidak menggantikan operator penanggung jawab.

**Verifikasi:** session memiliki `operator_membership_id` (atau relasi setara); setiap open/close mencatat actor dan timestamp; session tidak memiliki dua operator utama aktif.

### D-07 — Banyak Cash Session aktif pada Outlet

**Keputusan:** boleh ada beberapa session aktif dalam satu outlet untuk operator atau cash drawer yang berbeda. MVP membatasi satu session aktif per operator per outlet. Penguncian harus dilakukan di backend/database agar dua request bersamaan tidak membuka dua session bagi operator yang sama.

**Verifikasi:** dua operator berbeda bisa membuka session masing-masing; operator yang sama tidak bisa membuka session kedua pada outlet sama; request bersamaan tidak melanggar batas.

### D-08 — Pergantian operator

**Keputusan:** jangan mengalihkan session terbuka ke operator lain. Operator lama menutup session, menginput actual cash dan catatan handover bila ada, lalu operator baru membuka session baru dengan opening cash sesuai uang yang benar-benar diterima. Penggantian paksa hanya lewat alur supervisor/admin yang diaudit bila nanti diperlukan.

**Verifikasi:** operator kedua tidak dapat melanjutkan session operator pertama dengan sekadar mengubah ID; closing/hand-over tersimpan dalam audit; formula expected cash konsisten.

## 3. Inventory dan COGS

### D-09 — Unit conversion

**Keputusan:** setiap inventory item mempunyai base unit tetap. Dukungan awal: massa `g`/`kg`, volume `ml`/`l`, dan hitungan `pcs`. Konversi otomatis hanya di dalam dimensi yang sama; jangan mengonversi massa ke volume tanpa data densitas khusus. Pack/box conversion yang item-specific dibuat sebagai aturan eksplisit, bukan asumsi global.

**Verifikasi:** `1 kg = 1000 g`, `1 l = 1000 ml`; konversi lintas dimensi ditolak; quantity mendukung pecahan untuk massa/volume; presisi dan rounding didokumentasikan.

### D-10 — Inventory costing method

**Keputusan:** gunakan **Moving Weighted Average Cost** untuk valuasi stok dan COGS ketika costing diimplementasikan. Basic inventory MVP tetap dapat berfokus pada kuantitas/movement; jangan mengklaim laporan COGS lengkap sebelum cost data tersedia.

Saat penerimaan stok berbiaya terjadi, biaya rata-rata baru dihitung dari `(qty_lama × avg_cost_lama + qty_masuk × unit_cost_masuk) / (qty_lama + qty_masuk)`. Penyesuaian stok perlu menyimpan alasan dan mengikuti aturan valuation yang terdokumentasi. Larang stok negatif dalam transaksi online yang tervalidasi kecuali aturan produk eksplisit kelak mengizinkan.

**Verifikasi:** test penerimaan stok dengan harga berbeda menghasilkan weighted average yang benar; histori transaksi lama tidak berubah ketika harga beli berikutnya berubah.

### D-11 — Formula COGS

**Keputusan:** pada saat penjualan diselesaikan, COGS item dihitung dari jumlah tiap bahan yang dikonsumsi menurut recipe/BOM dikalikan unit cost moving weighted average yang berlaku pada saat itu. Tambahkan bahan kemasan bila recipe memasukkannya. Dampak modifier hanya dihitung ketika modifier memiliki konsumsi bahan eksplisit. Simpan snapshot unit cost dan COGS pada record transaksi/stock consumption agar laporan historis tidak berubah.

Jika produk tidak mempunyai recipe atau cost data valid, COGS ditampilkan sebagai belum tersedia, bukan nol palsu. Waste dicatat sebagai biaya/stock movement terpisah dan tidak diam-diam ditambahkan ke COGS penjualan.

**Verifikasi:** hasil COGS dapat dihitung ulang dari recipe dan cost snapshot; perubahan biaya sekarang tidak mengubah order lama; recipe yang belum lengkap tidak menghasilkan COGS yang menyesatkan.

## 4. Billing

### D-12 — Formula billing

**Keputusan baseline:** `platform_fee = configured_rate × eligible_net_sales`. Billing period menggunakan bulan kalender. `eligible_net_sales` adalah nilai penjualan item yang selesai dan pembayarannya berhasil, sesudah diskon pada item/transaksi dan dikurangi refund yang tercatat; transaksi cancel/void, payment pending/failed, dan nilai pajak/uang titipan pihak ketiga (jika kelak ada) tidak dihitung sebagai penjualan bersih.

Refund yang terjadi sesudah statement lama diterbitkan dicatat sebagai adjustment pada periode refund dan ditautkan ke transaksi asal. Statement yang sudah diterbitkan bersifat immutable; koreksi dilakukan dengan adjustment, bukan menulis ulang riwayat secara diam-diam. Simpan line item sumber dan versi aturan/tarif yang dipakai.

**Verifikasi:** contoh order paid, cancel, discount, partial refund, full refund, dan refund setelah periode ditutup menghasilkan angka sesuai definisi; pemrosesan ulang billing tidak menggandakan charge.

### D-13 — Platform fee rate

**Keputusan teknis:** rate harus berupa konfigurasi versioned pada plan/business dan tidak di-hardcode dalam service. Lingkungan dev/test menggunakan rate dummy; pilot tertutup menggunakan 0% sampai model komersial disetujui. Billing berbayar dinonaktifkan jika tidak ada rate aktif yang telah disetujui.

**Gate Product Owner:** tentukan rate/tier, perlakuan pajak, disclosure ke merchant, dan tanggal efektif sebelum billing komersial dirilis. Informasi PRD saat ini belum cukup untuk menetapkan angka rate yang bertanggung jawab.

**Verifikasi:** perubahan tarif tidak memengaruhi statement lama; billing berbayar tidak dapat diaktifkan tanpa konfigurasi; perubahan tarif tercatat di audit.

### D-14 — Billing due date

**Keputusan baseline:** periode billing adalah bulan kalender; statement dibuat pada tanggal 1 bulan berikutnya; jatuh tempo 7 hari kalender setelah tanggal terbit. Notifikasi pengingat dapat dikirim sebelum/saat jatuh tempo. Tidak ada pemblokiran POS otomatis karena telat bayar pada MVP; kebijakan penangguhan akun merupakan keputusan terpisah setelah validasi komersial dan pemberitahuan yang layak.

**Verifikasi:** batas periode menggunakan timezone bisnis yang terdokumentasi; due date konsisten; test pada pergantian bulan/tahun benar.

## 5. Payment, QR, dan Realtime

### D-15 — Payment gateway

**Keputusan baseline:** implementasikan adapter provider agar domain Payment tidak bergantung pada SDK/vendor tunggal. Xendit menjadi kandidat integrasi pertama untuk sandbox/pilot, tetapi aktivasi live mensyaratkan verifikasi dukungan produk, biaya, settlement flow, onboarding merchant, refund, webhook, serta kontrak/eligibility akun Dagana dan merchant.

Jangan menyimpan status PAID hanya berdasarkan redirect frontend atau screenshot. Verifikasi callback/webhook di backend dan gunakan rekonsiliasi status provider jika diperlukan. Simpan provider reference, event ID/idempotency metadata, amount, currency, dan timestamps yang relevan.

**Verifikasi:** sandbox mencakup pending, paid, failed/expired, refund bila didukung; webhook invalid ditolak; webhook duplikat tidak menggandakan pembayaran; amount dan order reference dicocokkan.

### D-16 — QR payment gateway

**Keputusan baseline:** untuk pembayaran QRIS yang perlu dikonfirmasi otomatis, gunakan QRIS dinamis melalui provider yang sama dengan integrasi payment pertama. Pisahkan konsep `payment_method` dari `payment_provider`. Tunai, transfer manual, atau kartu yang dicatat kasir tidak boleh berpura-pura terverifikasi gateway jika tidak ada bukti server-side.

**Gate produksi:** model settlement dana ke merchant dan mekanisme onboarding merchant harus diverifikasi dengan provider sebelum transaksi uang nyata. Sampai itu selesai, integrasi hanya berjalan di sandbox/test.

**Verifikasi:** QR punya reference/expiry yang dapat dilacak; paid hanya setelah bukti server-side valid; QR expired tidak boleh menyelesaikan order; callback duplikat aman.

Dokumentasi referensi provider: [Xendit QRIS](https://docs.xendit.co/docs/qris) dan [Xendit webhook configuration](https://docs.xendit.co/apidocs/set-webhook-url). Ketersediaan fitur harus diverifikasi lagi saat mulai integrasi karena paket/API provider dapat berubah.

### D-17 — WebSocket provider

**Keputusan:** gunakan Laravel Reverb untuk baseline realtime self-hosted. Broadcast hanya mengirim event/notifikasi; database tetap source of truth, dan klien harus bisa mengambil ulang state terbaru melalui API. Gunakan queue/outbox sesuai kebutuhan agar kegagalan pengiriman event tidak membatalkan transaksi yang sudah commit.

**Verifikasi:** perubahan state tetap tersimpan walaupun WebSocket mati; reconnect memuat state terkini; channel private memeriksa membership/permission/business/outlet; event duplicate tidak merusak state.

Referensi: [Laravel Reverb documentation](https://laravel.com/docs/13.x/reverb).

## 6. Storage, Hardware, dan Flutter Offline

### D-18 — Object storage

**Keputusan:** gunakan abstraksi storage berbasis S3 API. MinIO digunakan untuk local development/integration test; object storage produksi dikonfigurasi lewat environment dan belum dikunci ke vendor tertentu. Simpan file privat secara default dan gunakan URL bertanda tangan atau kontrol akses backend untuk resource privat.

**Verifikasi:** upload, read, delete, batas ukuran/jenis file, unauthorized access, dan konfigurasi endpoint lokal diuji; file dan credential tidak dimasukkan ke Git.

### D-19 — Thermal printer

**Keputusan:** printing bukan syarat untuk menyelesaikan sebuah transaksi. Pisahkan melalui `PrinterService`/adapter agar business flow tidak tergantung pada model printer. Saat pilot, validasi minimal satu printer ESC/POS nyata pada perangkat Flutter/Android target; Bluetooth menjadi kandidat awal sesuai perangkat pilot. Jangan mengklaim semua printer didukung. LAN/USB ditambahkan setelah kebutuhan dan perangkat divalidasi.

**Verifikasi:** transaksi tetap tersimpan ketika printer offline; kegagalan print dapat dicoba ulang tanpa menciptakan order/payment baru; format receipt menampilkan nomor order, waktu, item, total, dan metode/status pembayaran yang benar.

### D-20 — Barcode hardware

**Keputusan:** hardware scanner tidak masuk MVP. Field SKU/barcode dapat disiapkan jika tidak menambah beban domain yang tidak perlu. Integrasi scanner baru dilakukan setelah validasi; opsi berbiaya rendah adalah scanner USB/Bluetooth HID yang berperilaku seperti input keyboard, tetapi perangkat harus diuji.

**Verifikasi:** tidak ada dependency scanner dalam workflow penjualan dasar; fitur pencarian/pilih menu manual tetap berfungsi.

### D-21 — Local database Flutter

**Keputusan:** gunakan SQLite melalui Drift untuk katalog cache, draft/cart bila diperlukan, antrean transaksi offline, status sinkronisasi, dan migrasi lokal. Gunakan secure storage/OS-protected storage untuk token/secret; jangan menyimpan token sensitif sebagai plain preference. Database lokal bukan source of truth cloud.

**Verifikasi:** migration diuji dari versi schema sebelumnya; force-close tidak menghapus antrean yang belum tersinkron; data sensitif tidak disimpan secara plaintext di preference umum.

Referensi: [Flutter database options](https://docs.flutter.dev/app-architecture/design-patterns/sql) dan [Flutter offline-first architecture](https://docs.flutter.dev/app-architecture/design-patterns/offline-first).

### D-22 — Offline conflict strategy

**Keputusan MVP:** dukung offline POS terbatas, bukan klaim seluruh platform berfungsi offline. Katalog di-cache setelah sinkronisasi online; transaksi offline hanya bisa dibuat dari katalog lokal yang tersedia dan menggunakan metode cash/manual yang tidak memerlukan provider eksternal. QR Ordering, verifikasi payment gateway, billing, laporan terpusat terbaru, dan perubahan konfigurasi memerlukan koneksi.

Setiap order lokal memiliki UUID/client-generated idempotency key yang unik, waktu perangkat, snapshot item/harga, operator, outlet, dan status `pending_sync`. Saat tersambung, server memvalidasi membership/outlet, menerima atau menandai konflik secara eksplisit, lalu menyimpan referensi idempotency. Jangan mengubah snapshot harga transaksi secara diam-diam. Jika stok server tidak mencukupi karena terjadi penjualan offline, sinkronisasi menandai selisih untuk review; kebijakan tidak boleh membuat order duplikat atau menghapus transaksi lokal. Data server yang sudah committed tetap source of truth untuk laporan cloud.

**Batasan penting:** sebelum mengaktifkan offline selling untuk merchant nyata, uji keamanan perangkat, masa berlaku akses offline, multi-device, duplikasi sync, perubahan/arsip produk ketika offline, dan pemulihan setelah aplikasi force-close. Konflik kompleks tetap di luar MVP.

**Verifikasi:** transaksi offline bertahan setelah app ditutup; sync ulang menghasilkan tepat satu order; kegagalan jaringan tidak menghapus outbox; harga snapshot tidak berubah diam-diam; mismatch stok muncul sebagai exception yang dapat ditelusuri.

## 7. Batas MVP dan Roadmap

### D-23 — Split payment

**Keputusan:** tidak masuk MVP. Satu order memakai satu metode pembayaran utama. Refund/partial refund adalah alur tersendiri dan bukan split tender. Simpan model yang tidak membuat pengembangan pembayaran berikutnya mustahil, tetapi jangan membangun UI atau rekonsiliasi split sekarang.

**Verifikasi:** checkout menolak kombinasi beberapa metode pembayaran dalam satu order pada MVP; order dapat dibayar dengan satu metode.

### D-24 — Dampak modifier pada inventory

**Keputusan:** implementasikan bersama Recipe/BOM, bukan sebelum basic inventory stabil. Modifier yang menambah/mengurangi bahan harus mempunyai aturan konsumsi eksplisit yang tervalidasi. Jika tidak ada recipe/mapping, modifier tidak mengubah stok secara implisit.

**Verifikasi:** modifier dengan mapping mengonsumsi bahan yang benar; modifier tanpa mapping tidak mengubah stok; setiap konsumsi tercatat sebagai stock movement dan tidak digandakan saat retry.

### D-25 — Harga per Outlet

**Keputusan:** tidak masuk MVP. Satu Business menggunakan harga catalog yang sama di semua outlet. Jangan menambahkan outlet-specific override sebelum requirement multi-outlet dan reporting-nya jelas. Jika diluncurkan kelak, desainnya harus menjelaskan fallback harga Business vs override Outlet dan snapshot harga di order.

**Verifikasi:** menu di outlet berbeda dalam Business yang sama menunjukkan harga yang konsisten pada MVP; snapshot order lama tidak berubah bila harga catalog diubah.

### D-26 — Customer login

**Keputusan:** guest-first. Pelanggan dapat membuka menu QR dan membuat order tanpa mendaftar akun. Identitas kontak hanya dikumpulkan jika ada kebutuhan operasional nyata, bersifat opsional kecuali diperlukan oleh alur yang disepakati, serta diberi penjelasan penggunaan. Riwayat transaksi merchant tidak bergantung pada akun pelanggan.

**Verifikasi:** guest dapat menyelesaikan QR flow yang disepakati; akses status order dibatasi dengan token/session order yang tidak mudah ditebak; pelanggan tidak dapat membaca order pelanggan lain.

### D-27 — Target KDS

**Keputusan:** status kitchen dasar (mis. `QUEUED`, `PREPARING`, `READY`, `COMPLETED`, serta pembatalan bila perlu) dan tampilan queue sederhana disiapkan untuk alur Order/QR dan realtime sesuai fase implementasi. Advanced KDS—routing beberapa station, bump bar kompleks, analytics dapur, central kitchen—ditunda ke roadmap pasca-MVP.

**Verifikasi:** transisi status dibatasi ke alur yang valid; hanya role/outlet yang berwenang dapat mengubah status; perubahan tersimpan di backend dan dapat dimuat ulang setelah reconnect.

## 8. Audit, Backup, dan Disaster Recovery

### D-28 — Audit retention

**Keputusan baseline:** log audit kritis searchable minimal 24 bulan, kemudian boleh diarsipkan agar tetap dapat dipulihkan sesuai kebutuhan. Record audit bersifat append-only bagi aplikasi operasional. Penghapusan final hanya berjalan berdasarkan kebijakan retensi yang telah ditinjau; masa 24 bulan ini adalah target produk awal, bukan klaim masa simpan minimum yang diwajibkan hukum.

**Verifikasi:** perubahan permission, refund, cancel order, adjustment inventory, cash close/adjustment, dan billing memiliki actor, waktu, entity reference, serta nilai relevan; user operasional tidak dapat menghapus audit log.

### D-29 — Backup/disaster recovery

**Keputusan baseline produksi:** target RPO ≤ 1 jam dan RTO ≤ 4 jam. Gunakan backup database terenkripsi dan disimpan terpisah dari lingkungan utama; gunakan point-in-time recovery/WAL bila didukung hosting. Target retensi backup awal 30 hari. Uji pemulihan minimal bulanan dan sebelum perubahan infrastruktur besar. Docker volume development bukan backup.

**Verifikasi:** tersedia prosedur restore; pengujian restore membuktikan aplikasi dapat terhubung ke data hasil pemulihan; akses backup dibatasi; secret backup tidak masuk Git; kegagalan job backup memunculkan alert.

**Gate produksi:** apabila provider/infrastruktur yang dipilih tidak dapat memenuhi target, Product Owner harus menerima RPO/RTO alternatif secara tertulis sebelum go-live—jangan diam-diam mengurangi target.

## 9. Daftar Gate yang Tetap Harus Ditutup Sebelum Produksi

Keputusan-keputusan di atas memberi arah yang cukup untuk desain dan pengembangan, tetapi item berikut membutuhkan bukti atau persetujuan khusus:

| Gate | Pemilik keputusan | Bukti sebelum ditutup |
|---|---|---|
| Tarif platform fee, pajak, dan ketentuan merchant | Product Owner/business | Pricing approval, contoh statement, syarat penggunaan dan perlakuan refund disetujui |
| Live payment dan settlement ke merchant | Product Owner + provider/payment integrator | Verifikasi kontrak/onboarding, alur settlement, refund, webhook, serta sandbox tests |
| Provider object storage dan infrastruktur backup | Technical owner | Environment produksi, access policy, backup/restore test |
| Printer yang didukung | Product/QA + pemilik perangkat pilot | Hasil pengujian model fisik pada perangkat target |
| Kebijakan audit/privacy retention | Product Owner + reviewer legal/security | Kebijakan tertulis sebelum auto-purge dan produksi |
| Target RPO/RTO jika infrastruktur tidak mendukung baseline | Technical owner + Product Owner | Persetujuan risiko tertulis |

## 10. Aturan Pemeliharaan Keputusan

Saat mengubah keputusan:

1. Perbarui nomor keputusan, status, alasan, dan dampaknya dalam dokumen ini.
2. Sinkronkan ringkasan pada `PRD-Dagana.md` bagian 61.
3. Tambahkan ADR untuk keputusan arsitektur yang sulit dibalik atau berdampak lintas-modul.
4. Perbarui acceptance criteria di `docs/phase-targets.md` bila scope fase berubah.
5. Tambahkan test yang membuktikan aturan baru dan jelaskan dampak migrasi/data lama.

Coding agent boleh mengusulkan alternatif yang didukung alasan teknis, namun tidak boleh mengubah baseline atau menganggap gate produksi telah lulus tanpa bukti.
