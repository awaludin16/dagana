# Contoh Respons Coding Agent Dagana

Dokumen ini menjadi contoh gaya komunikasi yang diharapkan dari coding agent. **Respons kepada pengguna menggunakan Bahasa Indonesia secara default**, sedangkan identifier dan kode tetap mengikuti konvensi repository. Sesuaikan isi contoh dengan pekerjaan yang benar-benar dilakukan; jangan mengklaim tindakan atau pengujian yang belum dilakukan.

## 1. Sebelum perubahan yang cukup besar

**Contoh respons:**

> Saya akan menelusuri alur checkout yang sudah ada, memeriksa aturan bisnis di PRD, lalu memisahkan orkestrasi transaksi ke `CheckoutService` jika sesuai dengan struktur proyek. Setelah perubahan, saya akan menambahkan atau memperbarui feature test untuk skenario berhasil, kegagalan transaksi, dan isolasi business. Saya tidak akan mengubah kontrak API yang sudah ada tanpa alasan dan pengujian yang sesuai.

Gunakan rencana singkat hanya jika tugas memang melibatkan beberapa langkah, risiko, atau beberapa domain. Untuk perubahan kecil, langsung kerjakan tanpa pembukaan panjang.

## 2. Laporan setelah tugas selesai

**Contoh format:**

> **Selesai**
> 
> **Perubahan:**
> - Memindahkan orkestrasi checkout dari `OrderController` ke `CheckoutService`.
> - Membungkus pembuatan order, item, dan payment dalam `DB::transaction()`.
> - Menambahkan feature test untuk checkout berhasil dan rollback saat penyimpanan payment gagal.
> 
> **Verifikasi:**
> - `php artisan test --filter=CheckoutTest` — lulus.
> - `vendor/bin/pint --test` — lulus.
> 
> **Catatan:** Pengujian ini hanya mencakup skenario yang disebutkan; belum membuktikan seluruh alur payment gateway di lingkungan nyata.

Perbarui daftar perubahan dan hasil verifikasi sesuai fakta. Jika command belum dijalankan, jangan tulis status “lulus”.

## 3. Jika pengujian tidak dapat dijalankan

**Contoh respons:**

> Perubahan sudah dibuat, tetapi pengujian belum dapat dijalankan karena dependency Composer belum terpasang di container. Saya belum dapat memastikan hasil runtime. Setelah dependency tersedia, jalankan `docker compose exec api php artisan test --filter=CheckoutTest`.

Sebutkan kendala dan langkah berikutnya secara spesifik, bukan sekadar mengatakan “sudah aman”.

## 4. Jika menemukan risiko atau keputusan yang belum jelas

**Contoh respons:**

> Saya menemukan bahwa endpoint ini menerima `outlet_id` dari request, tetapi belum terlihat pemeriksaan apakah pengguna memiliki akses ke outlet tersebut. Saya tidak akan menganggap nilai dari frontend tepercaya. Saya akan mengikuti mekanisme active outlet/membership yang sudah ada; jika mekanisme itu belum tersedia, saya akan menandai bagian tersebut sebagai keputusan yang perlu ditetapkan sebelum membuka akses endpoint.

Jangan diam-diam memilih aturan bisnis yang berdampak pada transaksi, authorization, data, atau billing.

## 5. Contoh bahasa saat menjelaskan struktur Laravel

**Kurang baik:**

> Done. Refactored logic. Tests pass.

**Lebih baik:**

> Logika checkout sekarang berada di `CheckoutService`, sedangkan `OrderController` hanya menangani request dan response. Saya juga menambahkan pengujian untuk memastikan kegagalan saat membuat payment membatalkan perubahan database yang terkait. Feature test yang relevan sudah dijalankan dan lulus.

## 6. Aturan bahasa untuk kode dan dokumentasi

- Respons percakapan, rencana, penjelasan error, dan laporan kerja: Bahasa Indonesia.
- Nama class, method, variable, route, database identifier, command, dan error asli: pertahankan sebagaimana adanya.
- Komentar kode: tulis hanya ketika membantu menjelaskan alasan atau aturan yang tidak jelas dari kode; gunakan Bahasa Indonesia secara default, dengan identifier tetap mengikuti konvensi kode.
- Dokumentasi internal Dagana: Bahasa Indonesia secara default, dengan istilah teknis berbahasa Inggris yang lazim jika lebih jelas.
- Jangan mengulang seluruh diff. Ringkas perubahan dan sebutkan file atau area penting yang disentuh.
