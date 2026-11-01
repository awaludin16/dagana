# Dagana — Product Requirements Document

> **Versi:** Draft v1.4 — Documentation Split
> **Status:** Draft
> **Fungsi:** Menjelaskan produk, pengguna sasaran, tujuan, dan batas MVP. Detail requirement dan desain teknis dipisahkan ke dokumen masing-masing.

## 1. Product Overview

**Dagana** adalah *F&B Business Operating Platform* untuk membantu usaha Food & Beverage menjalankan penjualan dan operasional dari satu platform. Produk menggabungkan POS, order, payment, cash management, catalog, basic inventory, employee/permission management, reporting, QR Ordering, kitchen operations, multi-outlet management, dan usage-based billing.

**Visi:** membantu bisnis F&B mencatat transaksi dengan cepat, mengelola operasional dengan sederhana, dan memahami kondisi bisnis dari satu platform yang dapat berkembang bersama usahanya.

**Positioning:** F&B Operations Platform dengan POS sebagai alur operasional utama.

## 2. Problem yang diselesaikan

Merchant kecil sering menggunakan catatan manual, spreadsheet, kalkulator, QRIS, atau aplikasi pembayaran yang terpisah. Saat outlet ramai, transaksi dapat terlambat dicatat atau terlupa sehingga catatan penjualan tidak selalu sesuai dengan uang kas aktual.

Dagana berfokus membantu merchant mencatat transaksi saat transaksi terjadi, menghubungkan penjualan dengan pembayaran dan kas, lalu menyediakan laporan yang mudah dipahami. Inventory menjadi dukungan operasional tambahan. Dagana bukan sekadar pengganti spreadsheet.

## 3. Target pengguna

| Segmen | Karakteristik | Kebutuhan utama |
|---|---|---|
| **Primary — Solo/Micro F&B** | Owner menjalankan 1 outlet sendiri atau dengan sedikit employee. | POS sederhana, payment, Cash Session, catalog, dan laporan dasar. |
| **Secondary — Small F&B** | Usaha memiliki beberapa employee dan dapat memiliki 1–3 outlet. | Employee, permission, outlet access, inventory, dan QR Ordering. |
| **Growing / Multi-Outlet** | Bisnis berkembang menjadi beberapa outlet atau grup F&B. | Multi-outlet, centralized reporting, pengelolaan outlet, dan operasional yang dapat berkembang. |

Fokus awal adalah warung, kedai, food stall, booth, coffee stall, usaha kuliner rumahan, bakery kecil, cafe, coffee shop, dan restoran kecil. Retail non-F&B bukan target awal.

## 4. Product goals

1. Menyediakan POS F&B yang cepat dan mudah digunakan.
2. Memungkinkan Owner langsung berjualan tanpa harus membuat akun Cashier.
3. Meminimalkan setup wajib sebelum transaksi pertama.
4. Mencatat transaksi, pembayaran, dan kondisi kas secara akurat.
5. Menyediakan Cash Session dan laporan penjualan dasar.
6. Menyediakan basic inventory tanpa menjadikannya prasyarat untuk mulai berjualan.
7. Mendukung employee dan permission ketika bisnis membutuhkannya.
8. Mendukung satu maupun banyak Outlet dalam satu Business.
9. Menyediakan QR Ordering sebagai channel opsional.
10. Mengembangkan model SaaS F&B dengan usage-based billing secara bertahap.

## 5. Batas produk

**Tidak termasuk fokus MVP:** full accounting, payroll, HR/attendance, employee scheduling, marketplace, delivery fleet, full ERP, advanced CRM, enterprise procurement, retail non-F&B, AI analytics, loyalty/promotion kompleks, advanced KDS, dan central kitchen kompleks. Fitur lanjutan dipertimbangkan setelah core workflow stabil.

## 6. MVP at a glance

Alur utama MVP:

> **Register → Create Business & Outlet → Add Menu → Open Cash Session → Sell → Payment → Close Cash Session → View Sales Report.**

Rangkuman kemampuan: authentication; satu User untuk satu Business; satu Business dengan satu atau banyak Outlet; Owner-as-Operator; employee opsional; role preset dan permission; catalog; POS dan order; payment; Cash Session dan rekonsiliasi; basic inventory; laporan dasar; QR Ordering opsional; serta billing platform yang tetap menunggu persetujuan komersial sebelum diaktifkan.

Daftar MVP included/excluded yang normatif dan workflow per tipe merchant ada di [`docs/requirements/mvp-scope-and-workflows.md`](docs/requirements/mvp-scope-and-workflows.md). Detail behavior per modul ada di dokumen requirement domain.

## 7. Dokumen requirement

| Dokumen | Cakupan |
|---|---|
| [`identity-and-access.md`](docs/requirements/identity-and-access.md) | User, Business, Outlet, onboarding, membership, role, permission, employee. |
| [`catalog-and-pos.md`](docs/requirements/catalog-and-pos.md) | Catalog, POS, fast selling, quick sale, dan order dasar. |
| [`payments-and-cash.md`](docs/requirements/payments-and-cash.md) | Payment, Cash Session, cash in/out, close, reconciliation. |
| [`inventory-and-reporting.md`](docs/requirements/inventory-and-reporting.md) | Inventory, recipe/BOM, stock, reporting, dashboard. |
| [`qr-ordering-and-kitchen.md`](docs/requirements/qr-ordering-and-kitchen.md) | Table, QR Ordering, kitchen workflow. |
| [`billing.md`](docs/requirements/billing.md) | Usage-based platform fee dan billing statement. |
| [`platform-quality.md`](docs/requirements/platform-quality.md) | Transaction integrity, tenant isolation, outlet context, realtime, offline, audit, security. |

## 8. Prinsip produk dan UX

- **F&B first:** fokus pada kebutuhan operasional bisnis F&B.
- **Owner can operate:** Owner juga dapat menjadi operator POS.
- **Sell first:** merchant harus dapat mencapai transaksi pertama dengan setup minimal.
- **Permission over role:** role merupakan preset; permission menentukan akses efektif.
- **Single operator is first-class:** merchant yang menjalankan usaha sendiri bukan edge case.
- **Cash Session over complex shift:** MVP berfokus pada akuntabilitas kas, bukan HR/shift management.
- **Don't force setup:** employee, inventory, QR, table, dan recipe tidak wajib untuk mulai menjual.
- **One source of truth:** POS dan channel pemesanan memakai aturan bisnis serta data yang sama.
- **Fast operational workflow:** kurangi langkah yang tidak perlu dalam proses penjualan.
- **Build for growth, not complexity:** fondasi dapat berkembang tanpa membuat UX awal menjadi rumit.

Dagana harus terasa sebagai alat kerja. Pengalaman utama yang dituju adalah **Open → Sell → Done**, bukan rangkaian setup administrasi sebelum pengguna dapat melayani customer.

## 9. Metrik keberhasilan

Metrik utama mencakup time to first transaction, activation, transaction completion, checkout time, transaction capture, cash variance, owner POS usage, repeat selling sessions, active businesses/outlets, transactions per business, processed/billable sales, dan merchant retention. Definisi dan kategori lengkap ada di [`docs/planning/product-metrics.md`](docs/planning/product-metrics.md).

## 10. Roadmap produk

Arah pasca-MVP meliputi peningkatan operasional; F&B operations (recipe/BOM, COGS, waste, stock opname, modifier/variant); ordering dan kitchen; multi-outlet; growth; serta kemampuan platform. Rincian roadmap ada di [`docs/planning/post-mvp-roadmap.md`](docs/planning/post-mvp-roadmap.md). Roadmap bukan komitmen delivery otomatis.

## 11. Dokumentasi teknis dan delivery

- **Architecture dan technical stack:** [`docs/architecture/`](docs/architecture/).
- **Engineering standards dan aturan agent:** [`AGENTS.md`](AGENTS.md) dan [`docs/engineering/engineering-standards.md`](docs/engineering/engineering-standards.md).
- **Local development:** [`docs/operations/development-environment.md`](docs/operations/development-environment.md).
- **Fase dan acceptance criteria:** [`docs/planning/development-phases.md`](docs/planning/development-phases.md) dan [`docs/planning/phase-targets.md`](docs/planning/phase-targets.md).
- **Keputusan dan approval gate:** [`docs/planning/decision-log.md`](docs/planning/decision-log.md).

Dokumen index dan aturan pemeliharaan ada di [`docs/README.md`](docs/README.md). Prompt coding agent hanya alat pelaksanaan; prompt tidak boleh menciptakan requirement baru.

---

> **Mulai sendiri. Jualan langsung. Berkembang tanpa pindah sistem.**
