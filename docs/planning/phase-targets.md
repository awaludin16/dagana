# Dagana — Target Pekerjaan dan Acceptance Criteria per Fase

Dokumen ini menerjemahkan urutan fase pada `docs/planning/development-phases.md` menjadi target implementasi dan acceptance criteria yang dapat diperiksa serta diuji.

## Cara membaca dokumen

- **Target pekerjaan** menjelaskan hasil yang harus dibangun pada fase tersebut.
- **Acceptance criteria** merupakan kondisi yang harus dapat dibuktikan sebelum fase dinyatakan selesai. Gunakan test otomatis jika memungkinkan; untuk setup/infrastruktur, gunakan perintah yang dijalankan dan bukti hasilnya.
- **Berdasarkan requirement** berarti ruang lingkup berasal dari PRD dan dokumen spesifik di `docs/requirements/`.
- **Gate engineering yang direkomendasikan** berarti kriteria teknis tambahan untuk memastikan hasilnya aman dan dapat dipelihara. Kriteria ini tidak mengubah requirement bisnis.
- Gunakan `docs/planning/decision-log.md` sebagai daftar keputusan, rekomendasi baseline, dan production gate. Karena keputusan dalam decision log masih berstatus usulan sampai disetujui Product Owner, agent tidak boleh menganggapnya telah disetujui secara resmi. Gate komersial, kebijakan, hardware, dan produksi harus ditutup sebelum fitur terkait diaktifkan secara live. Jangan mengarang formula atau kebijakan.

Satu fase boleh dipecah menjadi beberapa task/pull request. Jangan meminta agent mengerjakan seluruh fase besar dalam satu perubahan jika membuat review dan pengujian sulit dilakukan.

## Aturan lintas fase

Kriteria berikut berlaku untuk semua fase yang menyentuh kode atau konfigurasi:

1. Requirement dan scope ditelusuri ke PRD serta dokumen spesifik di `docs/requirements/`; jika ada konflik, tampilkan konflik dan jangan memilih sendiri secara diam-diam.
2. Ikuti `AGENTS.md` dan `docs/engineering/engineering-standards.md`, termasuk respons dalam Bahasa Indonesia, aturan Git, modular monolith, dan pemisahan business logic.
3. Untuk project baru, bangun fondasi dari repository/workspace kosong sesuai Phase 0. Jika repository ternyata berisi file atau perubahan pengguna, jangan hapus/overwrite; periksa dan minta persetujuan sebelum tindakan destruktif.
4. Data business/outlet harus selalu diperiksa melalui authorization backend pada endpoint, query, export, job, dan event yang relevan.
5. Setiap perubahan skema memakai migration; perubahan kontrak API dan keputusan arsitektur didokumentasikan jika relevan.
6. Test yang relevan harus benar-benar dijalankan. Hasil yang belum diuji atau terhalang environment dilaporkan sebagai belum terverifikasi.
7. Jangan memasukkan secret, `.env`, kredensial nyata, atau data pelanggan nyata ke Git maupun log.
8. Status fase adalah **Selesai**, **Selesai dengan pengecualian yang disetujui**, atau **Belum selesai**. Jangan menyatakan selesai jika acceptance criteria penting belum terpenuhi.

---

# Phase 0 — Foundation

## Target pekerjaan

Membangun fondasi repository Dagana dari nol agar development dapat dijalankan ulang secara konsisten. Ini mencakup inisialisasi struktur monorepo, Docker development, scaffold Laravel/React/Flutter sesuai stack, environment configuration, standar agent, serta pemeriksaan otomatis awal. Pada baseline saat ini, Docker dipusatkan pada Laravel API, PostgreSQL, dan Redis; React/Vite dan Flutter/Dart toolchain diinisialisasi pada workspace masing-masing.

## Acceptance criteria

- [ ] Struktur repository dan lokasi aplikasi terdokumentasi; asumsi awal monorepo (`apps/api`, `apps/admin-web`, `apps/customer-web`, `apps/pos-mobile` untuk Flutter) cocok dengan repository aktual atau telah dikoreksi dalam dokumentasi.
- [ ] Perintah Docker Compose untuk validasi konfigurasi berhasil dijalankan tanpa error.
- [ ] Pada repository baru/checkout bersih, langkah setup yang terdokumentasi dapat diikuti untuk membangun dan menjalankan layanan development yang didefinisikan.
- [ ] Workspace `apps/api`, `apps/admin-web`, `apps/customer-web`, dan `apps/pos-mobile` dibuat dari scaffold resmi Laravel, React/Vite, dan Flutter; versi SDK/toolchain dicatat.
- [ ] Aplikasi Flutter dapat menjalankan `flutter analyze` dan `flutter test`; aplikasi web dapat menjalankan lint/type-check/build/test yang disediakan; API dapat menjalankan test awal.
- [ ] `pubspec.lock` untuk aplikasi Flutter dicatat di version control; secret dan file `.env` tidak dicatat.
- [ ] Laravel API dapat melakukan koneksi ke PostgreSQL menggunakan service name jaringan Compose, bukan `localhost` dari dalam container.
- [ ] Laravel dapat berkomunikasi dengan Redis bila service tersebut diaktifkan dalam konfigurasi development.
- [ ] PostgreSQL menggunakan volume persisten; menghentikan lalu menyalakan ulang container tidak menghilangkan data uji.
- [ ] Health check atau pemeriksaan yang terdokumentasi dapat membedakan layanan siap digunakan dari layanan yang belum siap.
- [ ] `.env`, kredensial, dan file hasil build/cache tidak ikut ter-commit; contoh environment tidak memuat secret nyata.
- [ ] Ada perintah test/lint awal yang terdokumentasi dan dapat dijalankan pada komponen yang sudah ada. Komponen yang belum dibuat ditandai sebagai belum berlaku, bukan dilaporkan lulus.
- [ ] `AGENTS.md`, standar engineering, panduan development, dan aturan Bahasa Indonesia tersedia di repository.

## Cara verifikasi / bukti

- Catat perintah validasi Compose, build, start, health check, koneksi database, koneksi Redis, serta hasil test yang benar-benar dijalankan.
- Untuk persistensi, tulis data uji non-rahasia, restart layanan, kemudian verifikasi data masih tersedia.

## Bukan target fase ini

Belum membangun semua modul bisnis, belum men-deploy ke production, belum mengimpor kode/migration/database dump dari project lama secara otomatis, dan belum menambahkan infrastruktur kompleks yang tidak dibutuhkan MVP.

---

# Phase 1 — Identity, Business, Outlet

## Target pekerjaan

Menyediakan identitas pengguna dasar dan onboarding bisnis: registrasi, login, logout, profil pengguna, pembuatan Business, pembuatan Outlet pertama, serta pengaturan Business dan Outlet dasar. Fondasi hubungan User–Business–Outlet harus mendukung model Dagana tanpa menganggap user, business, dan outlet sebagai entitas yang sama.

## Acceptance criteria

- [ ] User dapat registrasi dengan input valid; input tidak valid menghasilkan respons validasi yang konsisten dan tidak membuat record parsial.
- [ ] User dapat login menggunakan mekanisme autentikasi yang dipilih dan logout sesuai mekanisme tersebut.
- [ ] Endpoint profil hanya mengembalikan informasi pengguna yang berhak dilihat dan tidak menampilkan hash password atau secret.
- [ ] User yang berhasil onboarding dapat membuat satu Business dan Outlet pertama.
- [ ] Pembuatan Business, Outlet, dan relasi awal yang perlu konsisten dilakukan secara atomik; kegagalan di tengah tidak meninggalkan onboarding dalam keadaan rusak.
- [ ] User yang belum memiliki akses tidak dapat membaca atau mengubah Business/Outlet pengguna lain dengan mengganti ID pada URL atau payload.
- [ ] Pengaturan dasar Business dan Outlet dapat dibuat/dibaca/diperbarui sesuai scope yang disetujui.
- [ ] Minimal satu feature test mencakup alur registrasi/login dan satu test mencakup pembuatan Business + Outlet.
- [ ] Test negatif membuktikan akses lintas-business ditolak.

## Cara verifikasi / bukti

Jalankan test API untuk validasi, autentikasi, onboarding berhasil, kegagalan onboarding, dan akses silang. Sertakan contoh respons sukses/gagal yang sudah disanitasi di dokumentasi API bila kontrak API telah tersedia.

## Keputusan yang harus ditandai

Keputusan MVP: satu User hanya dapat terhubung ke satu Business; satu Business dapat memiliki banyak Outlet. Enforce dengan unique constraint, validasi backend, dan test isolasi tenant.

---

# Phase 2 — Membership, Role, Permission

## Target pekerjaan

Membangun relasi membership antara user dan business, role sebagai permission preset, permission sebagai dasar authorization, serta outlet access. Mendukung owner-as-operator dan employee opsional; owner tetap dapat berjualan setelah employee ditambahkan.

## Acceptance criteria

- [ ] Membership memiliki Business dan status yang dapat diverifikasi; user tanpa membership aktif tidak dapat mengakses konteks business tersebut.
- [ ] Role preset awal yang dibutuhkan tersedia sesuai scope yang disetujui, hanya Owner, Manager, dan Cashier. Tidak ada custom role atau permission override pada MVP.
- [ ] Permission dicek pada backend untuk endpoint/aksi terlindungi; menyembunyikan tombol di frontend saja tidak dianggap authorization.
- [ ] User dengan permission yang sesuai dapat melakukan aksi; user tanpa permission menerima penolakan yang sesuai.
- [ ] Akses outlet yang diizinkan berfungsi; akses ke outlet di luar cakupan ditolak walaupun user terdaftar di Business yang sama.
- [ ] Owner mendapatkan permission default yang cukup untuk onboarding, POS, payment, cash, products, reports, inventory, settings dan billing sesuai hak akses dan scope fitur yang sudah tersedia.
- [ ] Pembuatan employee/invitation dan assignment membership, role/permission, serta outlet access dapat divalidasi sesuai alur yang diimplementasikan.
- [ ] Owner dapat tetap menggunakan POS setelah employee dibuat; employee setup bukan prasyarat untuk memulai penjualan.
- [ ] Test otomatis mencakup izin diberikan, izin ditolak, membership nonaktif, dan akses outlet yang tidak diizinkan.
- [ ] Perubahan permission penting tercatat dalam audit log ketika fitur audit yang relevan tersedia; bila audit belum dibangun, kebutuhan tersebut dicatat sebagai dependency.

## Cara verifikasi / bukti

Gunakan feature test dengan beberapa user, business, membership, permission, serta outlet yang berbeda. Verifikasi respons API dan tidak adanya mutasi data saat request ditolak.

## Keputusan yang harus ditandai

Gunakan keputusan D-03 sampai D-05 pada `docs/planning/decision-log.md` sebagai rekomendasi baseline untuk permission catalog, custom role, dan outlet access. Jika Product Owner belum menyetujuinya atau repository menunjukkan konflik, laporkan konflik sebelum mengunci implementasi.

---

# Phase 3 — Catalog

## Target pekerjaan

Memungkinkan merchant mengelola kategori, menu/produk, harga, status aktif/nonaktif, dan ketersediaan dasar. Catalog harus tetap sederhana; setup bahan, recipe, supplier, SKU kompleks, atau modifier kompleks tidak boleh menjadi syarat awal untuk menjual menu biasa.

## Acceptance criteria

- [ ] User dengan permission yang sesuai dapat membuat, membaca, memperbarui, dan menonaktifkan kategori/menu sesuai operasi yang disetujui.
- [ ] Harga dan field wajib divalidasi di backend; input tidak valid tidak mengubah data.
- [ ] Menu aktif dan tersedia dapat ditemukan oleh proses POS sesuai Business/Outlet context yang berlaku.
- [ ] Menu nonaktif atau tidak tersedia tidak dapat ditambahkan ke transaksi baru melalui API hanya dengan memanipulasi request.
- [ ] Data catalog milik satu Business tidak dapat dilihat/diubah oleh Business lain.
- [ ] Perubahan nama/harga menu tidak mengubah snapshot transaksi historis yang sudah tersimpan (uji penuh dilakukan setelah Phase 4 tersedia; pada Phase 3, kontrak snapshot didokumentasikan).
- [ ] List endpoint memakai pagination atau batas hasil yang terdokumentasi saat jumlah data dapat bertambah.
- [ ] Feature test mencakup CRUD dasar, validasi, status aktif/nonaktif, availability, dan cross-tenant access.

## Cara verifikasi / bukti

Jalankan test API catalog dan verifikasi menu yang nonaktif/tidak tersedia ditolak oleh jalur use case penjualan ketika jalur itu sudah tersedia.

---

# Phase 4 — POS + Payment

## Target pekerjaan

Menyelesaikan alur penjualan inti: pencarian/pemilihan menu, cart, kuantitas, checkout, order, order items, pencatatan payment, status transaksi, histori order, dan receipt dasar. Semua channel nantinya menggunakan Order Engine yang sama. Metode payment mengikuti requirement `docs/requirements/payments-and-cash.md`; integrasi gateway spesifik tetap mengikuti keputusan di decision log.

## Acceptance criteria

- [ ] Operator yang memiliki permission dan konteks outlet yang benar dapat membuat order dengan menu yang aktif/tersedia.
- [ ] Backend memvalidasi ulang keberadaan menu, harga yang berlaku, kuantitas, dan total; total dari frontend tidak dipercaya sebagai nilai final.
- [ ] Order menyimpan item, jumlah, harga dan informasi snapshot yang diperlukan sehingga perubahan catalog berikutnya tidak mengubah receipt/histori lama.
- [ ] Status order dan payment mengikuti transisi yang didefinisikan; request arbitrer tidak bisa langsung mengubah payment menjadi `PAID` tanpa jalur konfirmasi yang sah.
- [ ] Data kritis yang harus konsisten disimpan secara atomik; jika salah satu penulisan kritis gagal, tidak ada order/payment parsial yang dianggap sukses.
- [ ] Request checkout berulang dengan idempotency key yang sama tidak membuat transaksi ganda; perilaku idempotency didokumentasikan dan diuji.
- [ ] Dua request bersamaan tidak menghasilkan duplikasi akibat race condition pada invariant yang dilindungi.
- [ ] Payment mencatat relasi order, metode, jumlah, status, reference, waktu, dan actor sesuai model pada requirement payment dan data model.
- [ ] Test mencakup checkout sukses, validasi gagal, rollback, duplicate retry, permission ditolak, dan akses silang business/outlet.
- [ ] Riwayat transaksi dan receipt menampilkan nilai snapshot transaksi, bukan harga catalog terkini.

## Cara verifikasi / bukti

Gunakan feature/integration test yang menjalankan transaksi database nyata pada environment test. Uji rollback dengan memaksa salah satu operasi kritis gagal, lalu pastikan semua perubahan terkait dibatalkan. Uji idempotency memakai key yang sama dan membandingkan jumlah order/payment.

## Keputusan yang harus ditandai

Payment gateway dan QR payment gateway belum final. Tanpa keputusan tersebut, agent boleh menyelesaikan payment model dan alur metode yang tidak membutuhkan provider, tetapi tidak boleh mengklaim integrasi gateway production telah selesai.

---

# Phase 5 — Cash Session

## Target pekerjaan

Mencatat tanggung jawab kas melalui Cash Session, bukan membangun shift/HR management kompleks. Mencakup open session, opening cash, cash sales, cash in/out, refund dan adjustment yang diizinkan, close session, expected cash, actual cash, variance, serta catatan penjelasan.

## Acceptance criteria

- [ ] Operator berizin dapat membuka Cash Session dengan opening cash yang valid untuk konteks outlet yang benar.
- [ ] Aturan satu/multi session aktif diterapkan konsisten setelah keputusan produk ditetapkan.
- [ ] Transaksi yang memenuhi syarat terhubung ke Cash Session/operator yang benar dan tidak dihitung dua kali.
- [ ] Cash in, cash out, refund, dan adjustment yang diizinkan dicatat sebagai aktivitas yang dapat ditelusuri, bukan perubahan angka tanpa riwayat.
- [ ] Expected cash dihitung dari opening cash dan aktivitas kas sesuai formula yang disetujui.
- [ ] Variance dihitung sebagai `actual_cash - expected_cash`; catatan selisih dapat disimpan tanpa sistem mengarang penyebabnya.
- [ ] Session yang sudah ditutup tidak dapat ditutup atau dimodifikasi ulang secara diam-diam; koreksi memerlukan alur eksplisit yang diizinkan.
- [ ] Pengguna tanpa permission/outlet access tidak dapat membuka, melihat, atau menutup session milik konteks yang tidak diizinkan.
- [ ] Test unit untuk formula expected cash/variance mencakup nilai nol, arus kas masuk/keluar, refund, dan selisih positif/negatif.
- [ ] Feature test mencakup open, close, kondisi status tidak valid, dan isolasi outlet.

## Cara verifikasi / bukti

Bandingkan hasil perhitungan sistem dengan contoh perhitungan manual yang mencakup opening cash, cash sales, cash in, cash out, refund, actual cash, dan variance.

## Keputusan yang harus ditandai

Decision log mencatat rekomendasi baseline tentang apakah satu Cash Session hanya untuk satu operator, apakah satu outlet dapat memiliki beberapa session aktif, dan apa yang terjadi saat operator berganti. Dokumentasikan keputusan tersebut sebelum mengunci constraint database dan flow pergantian operator.

---

# Phase 6 — Basic Inventory

## Target pekerjaan

Menyediakan inventory dasar yang opsional bagi merchant: item/bahan, stok, stock adjustment, stock movement, low-stock information, serta integrasi pengurangan stok dari penjualan ketika inventory diaktifkan dan perilakunya sudah didefinisikan. Penjualan sederhana harus tetap berjalan tanpa setup inventory.

## Acceptance criteria

- [ ] Item inventory dan saldo stok dapat dibuat/dibaca/dikelola oleh pengguna yang memiliki akses.
- [ ] Adjustment stok menghasilkan stock movement dengan jumlah, alasan/jenis yang sesuai, actor dan waktu yang dapat ditelusuri.
- [ ] Saldo stok dapat direkonsiliasi dengan movement ledger menurut aturan yang dipilih.
- [ ] Transaksi yang memang dikonfigurasi memengaruhi stok sesuai aturan; inventory yang tidak diaktifkan tidak menghalangi penjualan biasa.
- [ ] Retry atau pemrosesan ulang event penjualan tidak menggandakan pengurangan stok.
- [ ] Operasi stok serentak dilindungi agar saldo tidak rusak oleh race condition sesuai model stok.
- [ ] Item dan movement terisolasi sesuai Business/Outlet scope; akses lintas tenant ditolak.
- [ ] Low-stock dapat dipicu berdasarkan ambang yang telah disimpan pada konfigurasi item.
- [ ] Test mencakup adjustment, saldo/movement, low-stock, penjualan tanpa inventory, pengurangan stok yang relevan, retry, dan akses tidak sah.

## Cara verifikasi / bukti

Jalankan skenario stok awal + movement masuk/keluar/adjustment dan bandingkan saldo akhir dengan penjumlahan ledger. Ulangi proses yang sama untuk memastikan event/retry tidak menggandakan movement.

## Keputusan yang harus ditandai

Unit conversion dan inventory costing method masih terbuka. Jangan menambahkan costing kompleks atau asumsi konversi satuan sendiri sebagai requirement final fase basic inventory.

---

# Phase 7 — Reporting

## Target pekerjaan

Menyediakan reporting MVP: daily sales, transaction count, payment report, operator report, cash reconciliation, dan basic inventory report. Dashboard owner memberi ringkasan yang mendukung tindakan operasional dan tombol utama tetap mendukung workflow mulai berjualan.

## Acceptance criteria

- [ ] Laporan penjualan dapat difilter berdasarkan rentang tanggal sesuai kontrak API/UI yang didokumentasikan.
- [ ] Total penjualan dan jumlah transaksi cocok dengan dataset uji yang telah ditentukan; definisi transaksi yang dihitung jelas.
- [ ] Laporan payment memisahkan metode/status sesuai definisi yang disetujui dan tidak menyamakan pending/failed dengan paid.
- [ ] Laporan operator mengagregasi transaksi dari operator dan cakupan yang benar.
- [ ] Cash reconciliation menampilkan opening cash, arus kas yang relevan, expected cash, actual cash, dan variance sesuai perhitungan Cash Session.
- [ ] Basic inventory report menampilkan saldo/movement yang konsisten dengan sumber inventory jika modul inventory aktif.
- [ ] Filter Business dan Outlet diotorisasi di backend; tidak ada agregat data tenant lain yang bocor ke laporan.
- [ ] Hasil tetap benar untuk periode tanpa transaksi, transaksi yang dibatalkan/refund, dan batas awal/akhir periode sesuai aturan waktu aplikasi.
- [ ] Endpoint list/detail laporan memiliki batas hasil atau pagination yang sesuai untuk mencegah response tidak terbatas.
- [ ] Test membandingkan hasil laporan dengan fixture transaksi yang diketahui dan menguji pembatasan tenant/outlet.

## Cara verifikasi / bukti

Siapkan dataset uji kecil dengan hasil agregat yang dihitung secara manual. Bandingkan setiap angka laporan dengan expected result, termasuk refund/status pembayaran bila relevan.

## Catatan scope

Pelaporan keuangan/accounting penuh dan AI analytics bukan target MVP.

---

# Phase 8 — QR Ordering

## Target pekerjaan

Menambahkan channel pemesanan pelanggan berbasis QR yang opsional, termasuk table, QR, customer menu, guest cart, order creation dan order status. QR harus menggunakan Order Engine yang sama dengan POS dan tidak boleh menjadi dependency untuk POS.

## Acceptance criteria

- [ ] Outlet dapat mengelola meja/identitas QR sesuai model yang disetujui dan kode QR memetakan ke konteks outlet yang benar.
- [ ] Pengunjung dapat membuka menu yang tersedia, menyusun cart, dan mengirim order tanpa harus login jika mode guest yang ditentukan pada `docs/requirements/qr-ordering-and-kitchen.md` dipakai.
- [ ] Backend memvalidasi ulang menu, harga, availability, table/QR, dan outlet context; payload pelanggan tidak dapat mengganti Business/Outlet secara arbitrer.
- [ ] Order QR tersimpan dengan source `QR` dan dapat dibedakan dari order `POS` atau `ADMIN`.
- [ ] Order QR menggunakan alur/domain Order Engine yang sama dan memenuhi invariant order yang sama dengan POS.
- [ ] Status order dapat dilihat sesuai aturan akses dan lifecycle yang ditetapkan.
- [ ] Menonaktifkan QR tidak merusak POS, checkout, payment, atau order history.
- [ ] Pengujian mencakup order QR berhasil, QR/table tidak valid, menu tidak tersedia, manipulasi outlet context, dan POS tetap berjalan saat QR nonaktif.

## Cara verifikasi / bukti

Buat satu order melalui POS dan satu melalui QR pada environment test; verifikasi keduanya tersimpan di model order yang sama dan source channel-nya benar.

## Catatan scope

QR Ordering adalah optional MVP module. Customer login, advanced table management, split bill, dan fitur lanjutan lain tidak otomatis masuk scope hanya karena QR Ordering dibuat.

---

# Phase 9 — Realtime

## Target pekerjaan

Menyampaikan event operasional seperti QR order notification, kitchen updates, order status, payment status, dan stock updates jika modul terkait tersedia. WebSocket/notification hanya lapisan penyampaian event; database tetap menjadi source of truth.

## Acceptance criteria

- [ ] Event yang dipilih memiliki nama, payload, pemicu, penerima, dan aturan akses yang terdokumentasi.
- [ ] Perubahan domain tersimpan secara persisten meskipun pengiriman event gagal.
- [ ] Event untuk perubahan setelah commit tidak diterbitkan sebagai keberhasilan sebelum perubahan database berhasil commit.
- [ ] Client yang berhak menerima event memperoleh update sesuai channel dan cakupan business/outlet yang tepat.
- [ ] Client yang tidak berhak tidak dapat subscribe/membaca event tenant atau outlet lain.
- [ ] Pengiriman ulang event tidak menyebabkan duplikasi side effect domain; handler yang mengubah state memiliki mekanisme deduplikasi atau idempotency yang sesuai.
- [ ] Client dapat menyelaraskan keadaan dengan membaca ulang state dari API/database bila event terlewat atau koneksi tersambung ulang.
- [ ] Pengujian mencakup event yang benar, isolasi channel, kejadian sebelum/sesudah commit, serta reconnect/resync yang didukung implementasi.
- [ ] Provider realtime dicatat dalam dokumentasi/ADR setelah diputuskan; implementasi development tidak diklaim sebagai production-ready tanpa pengujian operasional.

## Cara verifikasi / bukti

Uji event di environment development/test dengan dua Business dan dua outlet. Simulasikan kegagalan delivery dan pastikan data utama tetap konsisten serta client dapat mengambil state terbaru melalui API.

## Keputusan yang harus ditandai

Gunakan Laravel Reverb sebagai rekomendasi baseline pada keputusan D-17 di `docs/planning/decision-log.md`. Validasi kebutuhan skalabilitas dan operasional sebelum menetapkan konfigurasi produksi.

---

# Phase 10 — Billing

## Target pekerjaan

Membangun dasar domain billing platform yang terpisah dari payment pelanggan: konfigurasi billing, periode billing, eligible/billable sales, platform fee, billing statement, dan tampilan billing. Formula akhir, tarif, dan aturan periode harus mengikuti keputusan produk, bukan asumsi coding agent.

## Acceptance criteria

- [ ] Billing disimpan sebagai domain terpisah dari payment order pelanggan; perubahan billing tidak mengubah transaksi operasional.
- [ ] Periode billing dan status statement dapat ditentukan dan dibaca sesuai kontrak yang terdokumentasi.
- [ ] Kriteria transaksi yang eligible dapat ditelusuri ke transaksi sumber dan didokumentasikan.
- [ ] Perhitungan bisa diuji terhadap contoh data dan aturan yang sudah disetujui; sebelum formula/rate final, fitur diberi status belum final dan tidak mengarang nilai biaya.
- [ ] Menjalankan proses perhitungan ulang dengan input/periode yang sama tidak menghasilkan item tagihan ganda tanpa mekanisme revisi yang eksplisit.
- [ ] Statement menunjukkan periode, dasar perhitungan, nilai fee, dan status sesuai model yang telah disepakati.
- [ ] Akses billing dibatasi ke pihak/business yang berhak; satu tenant tidak dapat melihat statement tenant lain.
- [ ] Perubahan konfigurasi dan statement penting dapat diaudit sesuai mekanisme audit yang tersedia.
- [ ] Test mencakup eligible dan non-eligible sales, periode kosong, proses ulang, pembatasan tenant, serta formula yang telah disetujui.

## Cara verifikasi / bukti

Gunakan fixture transaksi dengan hasil billing yang diharapkan dihitung manual berdasarkan aturan yang disetujui. Jika aturan final belum disetujui, verifikasi hanya struktur, traceability, dan mekanisme konfigurasi; jangan menyatakan nominal billing final telah tervalidasi.

## Keputusan yang harus ditandai

Gunakan D-12 sampai D-14 pada `docs/planning/decision-log.md` sebagai baseline perhitungan dan periode billing. Tarif komersial tetap merupakan gate Product Owner: jangan aktifkan billing berbayar atau mengarang rate sebelum persetujuan tertulis.

---

# Phase 11 — Stabilization

## Target pekerjaan

Menstabilkan alur yang sudah dibangun sebelum rilis atau membuka fase lanjutan. Stabilization bukan fase untuk menambah fitur besar secara otomatis; fokusnya pada bug, regresi, keamanan, konsistensi data, performa, observability, backup/recovery, dan kesiapan deployment sesuai scope rilis yang disepakati.

## Acceptance criteria

- [ ] Alur MVP utama lulus pengujian: register → business → outlet → add menu → open cash → sell → payment → transaction complete → reporting → close cash → reconciliation.
- [ ] QR Ordering, inventory, employee, atau billing hanya masuk release gate jika diaktifkan dalam target rilis; fitur opsional yang belum aktif tidak dianggap syarat universal MVP.
- [ ] Test regresi penting mencakup tenant/outlet isolation, permission, invalid transition, checkout rollback, duplicate idempotency key, dan duplicate payment callback bila callback sudah diimplementasikan.
- [ ] Bug severity tinggi/kritis pada alur rilis sudah diperbaiki atau secara eksplisit diterima dengan mitigasi dan persetujuan yang tercatat.
- [ ] Pemeriksaan formatter/linter/type-check/static analysis/test/build yang telah ditetapkan untuk komponen rilis dapat dijalankan dan hasilnya dicatat.
- [ ] Endpoint/query kritis yang diketahui memiliki masalah performa ditinjau; klaim performa hanya dibuat jika ada hasil ukur dan kondisi uji tercatat.
- [ ] Logging tidak membocorkan password, secret, token, atau data sensitif yang tidak perlu.
- [ ] Backup dan pemulihan diuji mengikuti prosedur yang disepakati; dokumentasi saja tanpa restore verification tidak dianggap bukti pemulihan berjalan.
- [ ] Environment dan langkah deployment terdokumentasi; secret production tidak masuk repository.
- [ ] Terdapat ringkasan release readiness berisi test, risiko terbuka, keputusan yang belum final, dan rollback/recovery plan yang sesuai.

## Cara verifikasi / bukti

Lampirkan hasil test/build aktual, daftar bug yang tersisa, laporan scan/check yang telah dikonfigurasi, serta bukti uji restore bila masuk scope rilis.

## Catatan scope

Tidak ada target untuk menambahkan full accounting, payroll, HR, AI analytics, advanced CRM, loyalty, advanced KDS, atau fitur non-MVP lain sebagai syarat Phase 11.

---

# Phase 12 — Advanced F&B Operations

## Target pekerjaan

Mengembangkan kemampuan operasional F&B lanjutan secara bertahap berdasarkan roadmap post-MVP: recipe/BOM, advanced inventory, COGS, waste, stock opname, modifier, dan variant. Phase ini harus dipecah menjadi subfase/PR kecil karena setiap fitur memiliki keputusan domain yang belum seluruhnya final.

## Acceptance criteria umum

- [ ] Setiap fitur lanjutan memiliki requirement dan acceptance criteria tersendiri sebelum implementasi dimulai.
- [ ] Perubahan tetap menggunakan domain inventory/sales/catalog yang sudah ada; tidak membuat second source of truth untuk order atau stok.
- [ ] Data historis dan movement ledger tetap dapat ditelusuri; koreksi dilakukan melalui operasi yang eksplisit, bukan overwrite tanpa jejak.
- [ ] Test mencakup kasus normal, nilai batas, pembatalan/reversal jika relevan, concurrency, dan authorization business/outlet.
- [ ] Fitur tidak menghambat penjualan sederhana ketika merchant tidak mengaktifkan recipe/inventory lanjutan.

## 12A. Recipe & BOM

- [ ] Menu dapat dihubungkan ke bahan, kuantitas, satuan, dan versi/berlaku-resep sesuai model yang disetujui.
- [ ] Simulasi penjualan dengan recipe yang aktif menghitung kebutuhan bahan sesuai recipe yang berlaku.
- [ ] Bahan yang tidak cukup mengikuti kebijakan stok yang telah disetujui; agent tidak menentukan sendiri apakah transaksi harus ditolak atau boleh menghasilkan stok negatif.
- [ ] Perubahan recipe tidak mengubah histori transaksi/pemakaian bahan yang sudah tercatat.
- [ ] Test menghitung kebutuhan bahan untuk satu dan beberapa porsi serta satuan yang didukung.

## 12B. Advanced Inventory, Stock Opname, dan Waste

- [ ] Stock opname mencatat stok sistem, jumlah fisik, selisih, actor, waktu, serta alasan sesuai desain yang disetujui.
- [ ] Konfirmasi opname menghasilkan adjustment/movement yang dapat diaudit; histori lama tidak dihapus.
- [ ] Waste dicatat sebagai movement bertipe khusus dan dapat dibedakan dari penjualan atau adjustment lain.
- [ ] Saldo akhir dapat direkonsiliasi dari ledger dengan hasil opname dan waste.
- [ ] Test mencakup stok lebih/kurang, konfirmasi, penolakan/tidak jadi, serta pembatasan permission.

## 12C. COGS dan Inventory Costing

- [ ] Inventory costing method diputuskan dan dicatat sebelum nilai COGS dianggap final.
- [ ] Rumus COGS diuji dengan fixture biaya bahan dan kuantitas yang telah dihitung secara independen.
- [ ] Laporan menunjukkan dasar dan periode perhitungan yang jelas; perubahan biaya tidak mengubah laporan historis tanpa mekanisme recalculation yang disengaja dan diaudit.
- [ ] Jika costing method atau COGS formula belum diputuskan, agent tidak membuat klaim bahwa nilai COGS sudah final.

## 12D. Modifier dan Variant

- [ ] Pilihan modifier/variant yang tersedia dapat dipilih dan divalidasi server-side.
- [ ] Harga akhir order dihitung di backend dengan aturan harga yang telah disepakati.
- [ ] Order item menyimpan snapshot pilihan, nama/harga, dan informasi yang diperlukan untuk mempertahankan histori transaksi.
- [ ] Jika modifier memengaruhi inventory, aturan dampaknya harus diputuskan dan diuji; jika belum diputuskan, modifier hanya boleh dirilis dalam scope yang tidak mengklaim pengaruh stok.
- [ ] Test mencakup pilihan valid/tidak valid, perubahan harga, serta snapshot transaksi historis.

## Cara verifikasi / bukti

Setiap subfitur punya fixture/test khusus dan reconciliation check dengan perhitungan manual. Jangan menandai seluruh Phase 12 selesai hanya karena salah satu subfitur telah dirilis.

## Batas scope

Fitur seperti supplier management, purchase order, central kitchen kompleks, advanced KDS, dan fitur enterprise lain tidak otomatis termasuk Phase 12; PRD menetapkannya sebagai non-goals atau roadmap lanjutan yang memerlukan perencanaan terpisah.

---

# Template target untuk diberikan ke coding agent

Salin bagian ini, lalu isi fase dan target yang akan dikerjakan dari dokumen ini.

```text
Kita akan mengerjakan [PHASE + NAMA FASE] Dagana.

Acuan wajib:
- PRD-Dagana.md
- dokumen terkait di docs/requirements/
- dokumen architecture terkait di docs/architecture/
- AGENTS.md
- docs/engineering/engineering-standards.md
- docs/planning/phase-targets.md

Target pekerjaan:
[Salin target pekerjaan dari fase terkait.]

Acceptance criteria:
[Salin hanya acceptance criteria yang relevan dari fase terkait.]

Instruksi:
1. Analisis repository dan implementasi yang sudah ada sebelum mengubah kode.
2. Cocokkan scope terhadap dokumen requirement terkait, `docs/planning/phase-targets.md`, dan `docs/planning/decision-log.md`; bedakan baseline yang sudah disetujui dari rekomendasi yang masih perlu persetujuan serta gate yang wajib ditutup.
3. Buat rencana implementasi kecil dan urutkan berdasarkan dependency.
4. Implementasikan hanya scope fase ini; jangan membangun fitur fase berikutnya tanpa alasan dependency yang jelas.
5. Tambahkan/perbarui automated test untuk membuktikan acceptance criteria.
6. Jalankan test/check yang relevan dan laporkan hasil aktual. Jangan menyatakan lulus jika belum dijalankan.
7. Perbarui dokumentasi/ADR jika keputusan atau kontrak berubah.
8. Laporkan: perubahan, file penting, hasil test, acceptance criteria (lulus/gagal/belum diuji), risiko, keputusan/gate yang masih perlu persetujuan, dan pekerjaan tertunda.

Gunakan Bahasa Indonesia untuk komunikasi. Patuhi AGENTS.md dan jangan melakukan operasi Git yang destruktif atau commit/push tanpa instruksi.
```

## Definisi status acceptance criteria

- **Lulus**: ada hasil test atau bukti verifikasi yang dapat diperiksa.
- **Gagal**: sudah diuji dan hasil tidak memenuhi kriteria.
- **Belum diuji**: belum ada bukti yang cukup; tidak boleh diperlakukan sebagai lulus.
- **Terhalang**: tidak dapat diuji karena dependency/environment/keputusan belum tersedia; sebutkan blocker yang spesifik.

Sebuah fase dinyatakan selesai jika kriteria wajibnya lulus dan tidak ada blocker/keputusan terbuka yang membuat perilaku bisnis penting menjadi ambigu. Pengecualian harus tercatat dan disetujui.


## Perubahan baseline produk (2026-10-29)

- Mobile POS menggunakan Flutter + Dart. Gunakan `docs/architecture/technical-stack.md` dan aturan `AGENTS.md`.
- Satu User hanya boleh terhubung ke satu Business; satu Business dapat memiliki banyak Outlet.
- Role MVP hanya `OWNER`, `MANAGER`, `CASHIER`.
- Delete permission hanya ditambahkan untuk resource master yang sesuai. Data transaksi, pembayaran, pergerakan kas/stok, dan audit tidak boleh dihapus permanen.
