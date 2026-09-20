# Dagana — UI/UX Design System

> **Design System & UI/UX Guidelines**\
> **Status:** v1.0 — Foundation\
> **Audience:** seluruh pengembang frontend (admin-web, customer-web, nanti POS/Flutter)\
> **Prinsip acuan (PRD):** *One platform, multiple channels, one source of truth.*\
> **Dokumen terkait:** [PRD](Dagana_PRD_v0.1.md) · [System Architecture](System-Architecture.md) · [API Spec](API-Specification.md) · [Auth & RBAC](Authentication-RBAC.md)

---

## Table of Contents

1. [Tujuan & Ruang Lingkup](#1-tujuan--ruang-lingkup)
2. [Prinsip Desain](#2-prinsip-desain)
3. [Audience, Surface & Konteks](#3-audience-surface--konteks)
4. [Design Tokens](#4-design-tokens)
5. [Tipografi](#5-tipografi)
6. [Spacing, Radius, Border & Shadow](#6-spacing-radius-border--shadow)
7. [Layout](#7-layout)
8. [Ikon](#8-ikon)
9. [Katalog Komponen](#9-katalog-komponen)
10. [Status & Feedback](#10-status--feedback)
11. [Form & Validasi](#11-form--validasi)
12. [Format Data](#12-format-data)
13. [Permission-aware UI](#13-permission-aware-ui)
14. [Tenant & Outlet Context](#14-tenant--outlet-context)
15. [Realtime UX](#15-realtime-ux)
16. [Copy & Tone](#16-copy--tone)
17. [Aksesibilitas](#17-aksesibilitas)
18. [Responsive & Device](#18-responsive--device)
19. [Dark Mode](#19-dark-mode)
20. [Implementasi di Kode](#20-implementasi-di-kode)
21. [Aplikasi per Phase](#21-aplikasi-per-phase)
22. [Definition of Done](#22-definition-of-done)
23. [Proses Perubahan](#23-proses-perubahan)

---

## 1. Tujuan & Ruang Lingkup

Dokumen ini adalah **sumber kebenaran tunggal** untuk keputusan visual dan interaksi
seluruh aplikasi Dagana. Tujuannya:

1. Menjaga **konsistensi visual** antar-channel (Admin Web, POS, QR Ordering).
2. Mempercepat implementasi dengan komponen & token yang sudah terstandar.
3. Menghindari keputusan desain *ad hoc* per halaman/fase.
4. Menyediakan acuan jelas bagi engineer dan (nanti) designer.

Ruang lingkup v1.0:

- Design tokens (warna, tipografi, spacing, radius, motion).
- Layout pattern per surface (admin desktop, customer mobile).
- Katalog komponen inti + status komponen.
- Konvensi format data, copy, dan aksesibilitas.
- Pemetaan ke implementasi (Tailwind CSS v4 `@theme` + komponen UI lokal).

Di luar ruang lingkup v1.0 (akan menyusul): dark mode penuh (Phase 6), branding/logo
resmi, ilustrasi custom, DS Tokens untuk Flutter POS (dipetakan belakangan).

> **Keputusan (D1):** Palet netral **slate** sebagai base, **emerald** sebagai brand
> accent (cocok dengan domain F&B/retail), **rose** khusus destructive/error.
> Keputusan ini sudah diterapkan di `admin-web` & `customer-web`.

---

## 2. Prinsip Desain

| # | Prinsip | Artinya di produk |
|---|---------|-------------------|
| 1 | **Kecepatan operasi** | Kasir & staf harus menyelesaikan tugas dengan sedikit klik dan tanpa hambatan kognitif. Label eksplisit, aksi primer menonjol, total operasi cepat. |
| 2 | **Satu bahasa antar-channel** | Order dari POS juga muncul di dashboard dengan status yang sama. Komponen, badge status, dan format data harus identik di semua surface. |
| 3 | **Status selalu terlihat** | Sistem multi-status menghasilkan data (order, stock, payment). Setiap entitas menampilkan statusnya secara eksplisit dengan badge & warna konsisten (lihat [Status & Feedback](#10-status--feedback)). |
| 4 | **Konfirmasi sebelum destruktif** | Hapus, cancel, refund selalu melewati dialog konfirmasi — tanpa pengecualian. |
| 5 | **Load, empty, error selalu ditangani** | Tidak ada halaman yang hanya menampilkan layar putih saat loading atau kosong. Setiap state punya representasi visual. |
| 6 | **Aksesibel sejak awal** | Kontras AA, *focus visible*, target sentuh ≥ 44px, dan dukungan keyboard bukan opsional. |
| 7 | **Real-time awareness** | Perubahan yang datang dari proses lain (order baru, status berubah) diberi umpan balik realtime (toast/badge/audio opsional) tanpa refresh. |
| 8 | **Konsisten, bukan monoton** | Gunakan komponen yang sama untuk masalah yang sama. Custom pattern hanya jika ada alasan produk yang jelas. |

---

## 3. Audience, Surface & Konteks

### 3.1 Permukaan & target device (dari PRD §6)

| Surface | Teknologi | Target | Sifat utama |
|---|---|---|---|
| **Admin Dashboard** (`admin-web`) | React + Tailwind + shadcn/ui | Desktop & tablet (landscape) | Banyak data, multi-tab, pengelolaan CRUD, mouse-driven |
| **QR Ordering** (`customer-web`) | React + Tailwind + shadcn/ui | Mobile browser | Satu alur fokus: menu → keranjang → order → status |
| **POS** (nanti, Flutter) | Flutter | Android phone/tablet/POS device | Kecepatan tinggi, barcode, kartu produk rapat, tombol besar |

### 3.2 Konteks penggunaan

- **Kasir POS:** berdiri, sering pakai satu tangan, butuh tombol besar, feedback
  taktil/audio, minim teks.
- **Owner/Manager (dashboard):** duduk, analisis, butuh data padat + ringkasan/aksi.
- **Pelanggan (QR):** santai di meja, satu tangan memegang HP, alur linear, konten
  besar, bahasa indonesia yang ramah.

Prinsip turunan: **data density tinggi di admin, density rendah di customer.**

---

## 4. Design Tokens

Sumber kebenaran implementasi: blok `@theme` di `src/index.css`
**identik di admin-web dan customer-web**. Seluruh warna komponen harus berasal dari
token ini, bukan hardcode hex.

### 4.1 Warna

#### Netral & kanvas (selalu sama di kedua app)

| Token (Tailwind) | Nilai | Penggunaan |
|---|---|---|
| `background` | `#f8fafc` (slate-50) | Kanvas halaman admin & halaman terang customer |
| `foreground` | `#0f172a` (slate-900) | Teks primer |
| `card` | `#ffffff` | Latar kartu/tabel/form |
| `card-foreground` | `#0f172a` | Teks di dalam kartu |
| `muted` | `#f1f5f9` (slate-100) | Latar sekunder: header tabel, hover, input group |
| `muted-foreground` | `#64748b` (slate-500) | Teks sekunder, placeholder, label meta |
| `border` | `#e2e8f0` (slate-200) | Border komponen default |
| `input` | `#cbd5e1` (slate-300) | Border input/select (lebih tegas dari `border`) |

#### Brand

| Token (Tailwind) | Nilai | Penggunaan |
|---|---|---|
| `primary` | `#059669` (emerald-600) | Tombol primer, aksi utama, nav aktif, link |
| `primary-foreground` | `#ffffff` | Teks di atas `primary` |
| `primary-soft` | `#ecfdf5` (emerald-50) | Latar aksen lembut, banner, highlight |
| `ring` | `#10b981` (emerald-500) | *Focus ring* semua elemen interaktif |

#### Semantik (status, error, dsb.)

| Token (Tailwind) | Nilai | Penggunaan |
|---|---|---|
| `success` | `#059669` (emerald-600) | Sukses, stok aman, LUNAS |
| `warning` | `#d97706` (amber-600) | Peringatan, stok menipis, PENDING |
| `info` | `#0284c7` (sky-600) | Informasi, proses berjalan, status menengah |
| `destructive` | `#e11d48` (rose-600) | Gagal, hapus, cancel, refund, error |
| `destructive-foreground` | `#ffffff` | Teks di atas `destructive` |

> **Aturan:** `destructive`/rose hanya untuk error & aksi destruktif — bukan untuk
> "peringatan" dan bukan warna brand.

#### Sidebar (khusus admin)

| Token (Tailwind) | Nilai | Penggunaan |
|---|---|---|
| `sidebar` | `#0f172a` (slate-900) | Latar sidebar |
| `sidebar-foreground` | `#e2e8f0` (slate-200) | Teks nav default |
| `sidebar-muted` | `#94a3b8` (slate-400) | Teks sekunder di sidebar |
| `sidebar-border` | `#1e293b` (slate-800) | Border internal sidebar |
| `sidebar-accent` | `#059669` (primary) | Item nav & menu aktif |
| `sidebar-accent-foreground` | `#ffffff` | Teks item aktif |

### 4.2 Warna di fitur khusus

| Makna | Token | Contoh penggunaan |
|---|---|---|
| QR / scan | `primary` (emerald) | Frame QR, tombol "Scan", ilustrasi menu QR |
| Hero gelap | `#020617` (slate-950) atau `sidebar` | Landing customer-web (tetap gelap sebagai identitas pembuka) |

### 4.3 Relasi antar-warna (jangan dilanggar)

```text
teks primer     = foreground            tombol primer   = primary + primary-foreground
teks sekunder   = muted-foreground      tombol destruktif= destructive + destructive-foreground
kanvas          = background            focus ring      = ring (2px + offset 2px)
kartu           = card + border         input border    = input
```

---

## 5. Tipografi

Font system (tanpa font eksternal di fase ini): `ui-sans-serif, system-ui, ...`
(lihat token `--font-sans`). SKU/barcode/ID memakai `font-mono`.

### 5.1 Type scale & penggunaan

| Nama | Kelas Tailwind | Penggunaan |
|---|---|---|
| `display` | `text-4xl sm:text-5xl font-bold tracking-tight` | Hero landing customer, 404 |
| `page-title` | `text-2xl font-semibold tracking-tight` | Judul halaman admin (`h1`) |
| `section-title` | `text-lg font-semibold` | Judul seksi/dialogue |
| `card-title` | `text-base font-semibold` | Judul kartu |
| `body` | `text-sm` | Ukuran teks standar **admin** (density tinggi) |
| `body-lg` | `text-base` | Teks standar **customer** (mobile) |
| `meta` | `text-xs text-muted-foreground` | Caption, label meta, timestamp |
| `label` | `text-xs font-medium uppercase tracking-wide text-muted-foreground` | Label grup datar, header kolom tabel (non-interaktif) |
| `numeric` | `text-sm tabular-nums` | Angka, harga, stok di tabel |
| `value-stat` | `text-2xl font-semibold tabular-nums` | Angka besar di kartu statistik |
| `code` | `font-mono text-xs` | SKU, barcode, UUID, token |

### 5.2 Aturan

- Maksimal 2 `font-weight` per halaman (regular + semibold/bold); hindari font medium
  yang berlebihan.
- Judul halaman admin: `h1` → `page-title`. Satu halaman = satu `h1`.
- Seluruh teks rata kiri; angka tabel & total dipakai rata kanan.
- Panjang baris baca customer: ≤ 65 karakter (`max-w-xl`).

---

## 6. Spacing, Radius, Border & Shadow

### 6.1 Spacing — grid 4px

| Konteks | Nilai |
|---|---|
| Jarak antar-sibling halaman | `space-y-6` (24px) / `gap-6` |
| Jarak antar-kontrol form | `space-y-4` (16px) → dengan label `space-y-1.5` |
| Padding halaman admin | `p-8` (desktop), `p-4 sm:p-6` (mobile/customer) |
| Padding kartu standar | `p-5` (kartu statistik) / `p-6` (kartu konten) |
| Height kontrol standar | `h-10` (40px); tombol kecil `h-8` |
| Grid kartu statistik | `grid-cols-1 sm:grid-cols-3 gap-4` |

### 6.2 Radius

| Konteks | Nilai (Tailwind) |
|---|---|
| Kontrol interaktif (button, input, select) | `rounded-lg` (0.5rem) |
| Tombol kecil | `rounded-md` |
| Kartu, tabel, dialog, dropdown | `rounded-xl` (0.75rem); dropdown `rounded-lg` |
| Badge / status pill | `rounded-full` |
| Sheet/drawer customer | `rounded-t-2xl` / `rounded-l-2xl` |

### 6.3 Border & shadow

| Konteks | Nilai |
|---|---|
| Border kartu/tabel | `border border-border` |
| `divide` antar-baris tabel | `divide-y` atau `border-b` pada `tr` |
| Shadow kartu/popover | `shadow-sm` (sedang); dropdown/dialog `shadow-md`/`shadow-lg` |
| Tanpa shadow pada elemen dalam kartu | (shadow hanya untuk "permukaan mengambang") |

---

## 7. Layout

### 7.1 Admin Dashboard

```text
┌──────────────┬──────────────────────────────────────────────┐
│  Sidebar 240px│  Content (max-w-7xl, px-8)                    │
│  (fixed)      │  [tenant banner / page header]                │
│              │  ┌────────────────────────────────────────┐   │
│  ▪ Dashboard  │  │ Halaman (Card, Table, Form, dsb)     │   │
│  ▪ Produk     │  │                                      │   │
│  ▪ ...        │  └────────────────────────────────────────┘   │
│              │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

- **App Shell:** sidebar kiri 240px (`w-60`) di admin-web, konten `ml-60`.
- Item nav aktif: `bg-sidebar-accent` (emerald). Badge notifikasi realtime boleh di
  item nav (contoh: "Order 3").
- **Page header pattern (semua halaman admin):**

```jsx
<header className="space-y-1">
  <h1 className="text-2xl font-semibold tracking-tight">Judul Halaman</h1>
  <p className="text-sm text-muted-foreground">Deskripsi satu baris / konteks.</p>
</header>
```

- **Toolbar sekunder** (di bawah header): `flex flex-wrap items-center justify-between gap-3` —
  kiri: filter/search; kanan: aksi primer (`Button variant="default"`).
- **Jenis halaman admin:**
  1. *Index/List* (tabel + toolbar + pagination).
  2. *Create/Edit* (form satu kolom `max-w-2xl`, atau grid dua kolom untuk form besar).
  3. *Detail* (summary cards + seeded tabs).
  4. *Dashboard* (stat cards + panel konten + recent list).

### 7.2 Customer Web (mobile-first)

```text
┌──────────────────────────────┐
│ Sticky header (brand + nama  │  height 56px
│ outlet)                      │
├──────────────────────────────┤
│                              │
│  Konten — max-w-md mx-auto   │
│  (menu list, cart, status)   │
│                              │
├──────────────────────────────┤
│ Sticky bottom bar / CTA      │  height ~64px (safe-area)
└──────────────────────────────┘
```

- Satu kolom, `max-w-md` centered, padding `px-4`.
- **Bottom CTA** untuk aksi utama (lihat keranjang, checkout) — selalu terlihat,
  `pb-[env(safe-area-inset-bottom)]`.
- Menu kategori: horizontal scroll pills (`whitespace-nowrap`) — konten besar,
  tombol ≥ 44px.
- Kartu menu: image placeholder persegi, nama, deskripsi singkat, harga jelas,
  tombol tambah "＋".

### 7.3 Grid

- Statistik: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`.
- Content admin dibatasi `max-w-7xl`; form `max-w-2xl`.
- Pada tablet admin (1024–1279px): sidebar tetap, padding `p-6`.

---

## 8. Ikon

- Library: **`lucide-react`** (stroke-based, konsisten dengan shadcn/ui).
- Ukuran default di dalam komponen: `size-4` (16px); di tombol, ikon ikut `[&_svg]:size-4`.
- Ikon navigasi sidebar: `size-4`/`size-5`, stroke-width default.
- Aturan: ikon bersifat **dekoratif + dukungan, tidak menggantikan label teks penuh**
  pada halaman admin (kecuali tombol ikon dengan `aria-label`).
- Status ikon lawan dari bentuk: kondisi bergerak pakai `Loader2` + `animate-spin`.

---

## 9. Katalog Komponen

Implementasi: file di `src/components/ui/*` (gaya shadcn/ui) berbasis token.
Halaman memakai komponen ini; **tidak boleh** menulis ulang styling tombol/input
per-halaman.

### 9.1 Button

| Properti | Nilai |
|---|---|
| Variants | `default`, `secondary`, `outline`, `ghost`, `destructive`, `link` |
| Sizes | `default` (h-10), `sm`, `lg`, `icon` |
| State | loading → `disabled` + spinner `Loader2 animate-spin`; disabled `opacity-50` |

Penggunaan:
- Satu aksi primer per area pandang → `variant="default"`.
- Aksi sekunder bersebelahan → `variant="outline"` atau `secondary`.
- Aksi destruktif → `variant="destructive"` **dan selalu** dibungkus konfirmasi.
- Tombol ikon wajib `aria-label`.

### 9.2 Input / Select / Textarea

| Atribut | Nilai |
|---|---|
| Height | `h-10`, `rounded-lg`, `border-input`, `bg-card` |
| Focus | `ring-2 ring-ring/40` + `border-ring`, `outline-none` |
| Placeholder | `text-muted-foreground` |
| Error | `aria-invalid` → border & ring `destructive` |
| Select | native `select` dengan styling yang sama (fase awal), upgrade ke Radix bila butuh pencarian |

### 9.3 Label

- `Label` di atas kontrol, `space-y-1.5` antara label/kontrol.
- Label wajib + placeholder eksemplar (contoh) → tidak diulang di dalam label.

### 9.4 Card

| Bagian | Keterangan |
|---|---|
| `Card` | `rounded-xl border bg-card shadow-sm` |
| `CardHeader` / `CardTitle` / `CardDescription` | Judul + deskripsi opsional |
| `CardContent` / `CardFooter` | Isi & baris aksi |

- Kartu dengan angka besar (statistik): tidak perlu `CardHeader`; nilai + label saja.

### 9.5 Badge (status pill)

| Variant | Makna |
|---|---|
| `success` | Selesai, LUNAS, Aktif, Stok aman |
| `warning` | Menunggu, Stok menipis, Perlu perhatian |
| `info` | Diproses, Dikonfirmasi, Disiapkan, Menengah |
| `destructive` | Dibatalkan, Gagal, Refund, Nonaktif |
| `secondary` / `outline` | Netral / meta |
| `default` | Brand accent (jarang untuk status) |

### 9.6 Table

| Bagian | Keterangan |
|---|---|
| Wrapper | `rounded-xl border bg-card shadow-sm`, `overflow-x-auto` |
| `TableHead` | `bg-muted/50 uppercase text-xs text-muted-foreground` |
| `TableRow` | `border-b`, hover `bg-muted/50` |
| `TableCell` | `px-4 py-3`; angka rata kanan |
| Aksi per baris | `DropdownMenu` di kolom paling kanan (⋮) |

### 9.7 Skeleton (loading)

- Ganti konten selama `isLoading`; `animate-pulse bg-muted rounded-lg`.
- Jangan tampilkan spinner di seluruh halaman — gunakan skeleton per blok.

### 9.8 DropdownMenu (admin)

- Trigger: tombol ghost ikon `⋮` (`aria-label="Aksi"`).
- Item destructive: `text-destructive`, `focus:bg-destructive/10`.
- Dipisah oleh `separator` antar-grup aksi.

### 9.9 Empty state

```jsx
<div className="rounded-xl border border-dashed bg-card p-10 text-center">
  <p className="text-sm text-muted-foreground">Belum ada data.</p>
  <Button className="mt-4" variant="outline">Buat data pertama</Button>
</div>
```

### 9.10 Dialog & Sheet

- `Dialog` untuk konfirmasi (ala shadcn `AlertDialog`) & form modal.
- `Sheet` untuk navigation/drawer **mobile customer** dan panel detail admin di layar kecil.
- Konfirmasi destruktif: judul jelas + tombol `destructive` + item terdampak.

### 9.11 Toast / Notifikasi

- Library: `sonner` (standar shadcn) — dipasang saat Phase 1.
- Tone: `success` (emerald), `error` (rose), `info` (slate), `warning` (amber).
- Pesan singkat 1 kalimat, present tense, bahasa Indonesia.
- Realtime event (order baru, status berubah) → toast + update query.

### 9.12 Pagination & Tabs

- Pagination: prev/next + nomor; total item di atas kanan tabel.
- Tabs: uppercase? tidak — `text-sm ffont-medium`; aktif `text-foreground border-b-2 border-primary`.

---

## 10. Status & Feedback

### 10.1 Pemetaan status (sumber: PRD §11, §18, §12)

**Order (`order_status`)**

| API | Label UI | Badge |
|---|---|---|
| `PENDING` | Menunggu | `warning` |
| `CONFIRMED` | Dikonfirmasi | `info` |
| `PREPARING` | Disiapkan | `info` (boleh dengan ikon oven) |
| `READY` | Siap | `success` |
| `COMPLETED` | Selesai | `success` |
| `CANCELLED` | Dibatalkan | `destructive` |

**Payment (`payment_status`)**

| API | Label UI | Badge |
|---|---|---|
| `PENDING` | Menunggu bayar | `warning` |
| `PAID` | Lunas | `success` |
| `FAILED` | Gagal | `destructive` |
| `REFUNDED` | Dikembalikan | `destructive` |

**Stock**

| Kondisi | Label UI | Badge |
|---|---|---|
| `low_stock` | Stok menipis | `warning` |
| `out_of_stock` | Stok habis | `destructive` |
| aman | — | `success` (opsional, hanya saat difilter) |

**Product / User / Table**

| API | Label UI | Badge |
|---|---|---|
| `ACTIVE` | Aktif | `success` |
| `INACTIVE` / `DISABLED` | Nonaktif | `secondary` |
| `DRAFT` | Draf | `secondary`/`outline` |
| Table `OCCUPIED` | Dipakai | `info` |

### 10.2 Tiga state wajib per data-async

```text
isLoading → Skeleton (per blok data, bukan spinner penuh)
isEmpty   → Empty state (+ aksi membuat data bila permission mengizinkan)
isError   → pesan singkat + tombol "Coba lagi" (retry)
```

### 10.3 Optimistic & offline (POS / Phase 3)

- Aksi cepat (tambah item keranjang, ubah qty) diperbarui **optimistically**, query
  di-invalidate di belakang.
- Saat offline: indikator kecil `Menampilkan data tersimpan` + banner `Luring` saat
  komunikasi gagal; jangan sembunyikan data.

---

## 11. Form & Validasi

- Layout: judul/label di atas (bukan di samping); `space-y-4` antar-field.
- Pesan error inline di bawah kontrol: `text-sm text-destructive` + `role="alert"`.
- Field fatal (email, SKU) diuji pada `onBlur` atau submit; server error (422)
  di-map dari struktur `{ field: [message] }` API ke baris terkait.
- Tombol submit: `disabled` + spinner saat kirim; label tidak berubah-ubah
  ("Simpan" tetap "Simpan").
- Format angka/rupiah di input: boleh bebas format saat mengetik, di-*normalisasi*
  saat `onBlur`/submit (parse angka, format ulang).
- **SKU/barcode unik per tenant** — error unik dari API ditampilkan inline di field.

---

## 12. Format Data

| Jenis | Format | Contoh |
|---|---|---|
| Mata uang | `Rp` + space + ribuan, default tanpa desimal; desimal hanya untuk unit terkecil | `Rp 1.250.000`, `Rp 4.500`, `Rp 1.259,50` (jika ada) |
| Format angka | `toLocaleString('id-ID')` | `1.250.000` |
| Tanggal | `d MMM yyyy` | `18 Sep 2026` |
| Jam | `HH:mm` (24 jam) | `14:30` |
| DateTime | `d MMM yyyy · HH:mm` | `18 Sep 2026 · 14:30` |
| Relative time | `5 menit lalu`, `baru saja` (utk feed realtime) | — |
| SKU / Barcode / UUID | `font-mono text-xs`, tampil penuh; UUID dipotong `xxxx…xxxx` bila konteks longgar | — |
| Persen & qty | 0–2 desimal mengikuti satuan | `12.5%`, `2 porsi` |

> Utility frontend (satu sumber): `src/lib/format.ts` → `formatRupiah()`,
> `formatNumber()`, `formatDate()`, `formatTime()`. Dibuat pada Phase 1.

---

## 13. Permission-aware UI

Prinsip (PRD §17): **autoritasi hanya di backend; frontend hanya mengontrol visibility/UX.**

| Kondisi | Perilaku |
|---|---|
| User punya permission | Elemen tampil **normal** |
| User admin/owner | Tampilkan semua (fallback saat daftar permission kosong = sembunyikan) |
| User tidak punya permission | Sembunyikan tombol/aksi; **jangan** tampilkan lalu gagal |
| API tolak (403) | Toast error; jangan arahkan ke halaman lain |

Implementasi administrasi: dari `/auth/me` → `permissions: string[]`; helper
`can('products.create')`. Shortcut hilangkan dengan pemetaan di komponen
`<Can permission="...">` pada Phase 1.

---

## 14. Tenant & Outlet Context

- **Tenant banner** di atas konten admin: `Tenant aktif: <Badge outline font-mono>uuid</Badge>`.
- **Tenant switcher** (Phase 5): dropdown di header, item menampilkan nama tenant +
  peran (OWNER/MANAGER), memicu `/auth/switch-tenant` → refresh query.
- **Outlet switcher**: hanya relevan bila user ter-assign > 1 outlet; dropdown di
  header/pos. Header **POS/order** wajib menampilkan outlet aktif.
- Context yang aktif dikirim via header API (`X-Tenant-Context`, `X-Outlet-Context`)
  — lihat `Authentication-RBAC.md`.

---

## 15. Realtime UX

(Phase 4/3; fondasi Reverb sudah tersedia.)

- Event masuk → **update cache TanStack Query** (invalidate/upsert) bukan reload halaman.
- Order baru di POS/kasir: toast sukses singkat + counter di nav.
- Status order di customer: progress stepper lucu (Menunggu → Disiapkan → Siap).
- Vendor library: `laravel-echo` + `pusher-js` (Reverb). Koneksi state ditampilkan
  sebagai dot kecil `terhubung`/`menghubungkan…`/`terputus` (hijau/ambar/rose).

---

## 16. Copy & Tone

- Bahasa: **Indonesia**, pasaran; hindari jargon teknis di UI pelanggan.
- **Kasir POS:** imperatif pendek ("Bayar", "Tambah", "Cari…").
- **Owner/manager:** kalimat ringkas namun informatif.
- **Pelanggan:** ramah, subjek "Anda".
- Label tombol: verba (Simpan, Batal, Hapus, Keluar, Tambah Produk, Cetak).
- Umumkan hasil sebelum instruksi: "Produk disimpan." → bukan "Berhasil?".
- **Status** memakai tabel 10.1 — jangan diterjemahkan berbeda di tempat beda.
- Error: sebutkan apa yang salah + apa yang bisa dilakukan:
  "Email atau password salah." / "SKU sudah dipakai di tenant ini."

---

## 17. Aksesibilitas

| Area | Standar |
|---|---|
| Kontras | Teks normal ≥ 4.5:1; teks besar ≥ 3:1 (contoh: `muted-foreground` di atas `card` = 4.5:1 aman) |
| Focus | Semua kontrol: `ring-2 ring-ring/40` + `ring-offset-2`; JANGAN `outline-none` tanpa ring |
| Target sentuh | ≥ 44×44px (mobile customer) |
| Keyboard | Seluruh alur bisa diselesaikan tanpa mouse; `Dialog` tutup Esc |
| Form | Label terkait kontrol (`htmlFor`/`id`); error `role="alert"` |
| Ikon dekoratif | `aria-hidden`; tombol ikon `aria-label` |
| Motion | Hormati `prefers-reduced-motion` (animasi sekunder dimatikan) |
| Semantik | Satu `h1`/halaman; nav pakai elemen `nav`; tabel pakai `th` |

---

## 18. Responsive & Device

**Admin (`admin-web`)** — desktop-first:

| Breakpoint | Perilaku |
|---|---|
| ≥ 1280px | Layout penuh, sidebar w-60, grid 3–4 kolom |
| 1024–1279px | Sidebar tetap; konten `p-6`; grid 2 kolom |
| < 1024px | Sidebar jadi `Sheet` (hamburger); tabel `overflow-x-auto` |
| Mobile admin | stacked form; halaman create/edit maks. 2 kolom |

**Customer (`customer-web`)** — mobile-first:

| Breakpoint | Perilaku |
|---|---|
| ≤ 430px | Alur utama; bottom CTA + safe-area |
| 431–767px | Konten `max-w-md`; mungkin 2 kolom kartu menu |
| ≥ 768px | Konten `max-w-3xl`; kartu menu grid 3 kolom; tetap ringkas |

**POS (Flutter, nanti):** target ≥ 480px wide portrait; tombol besar; kartu produk grid.

---

## 19. Dark Mode

- **Out of scope untuk v1/v1-5**; aktif pada Phase 6 (Stabilization).
- Tokens sudah disiapkan sebagai CSS variables agar dark mode dapat diimplementasikan
  dengan mem-swap nilai `@theme` berdasarkan `:root[data-theme='dark']`.
- Keputusan saat implementasi: palet dark memakai slate-950/900, emerald tetap accent,
  rose tetap destructive.

---

## 20. Implementasi di Kode

### 20.1 Struktur

```text
apps/<app>/src/
├── index.css                     # @theme tokens (IDENTIK di kedua app)
├── lib/
│   └── utils.ts                  # cn() = clsx + tailwind-merge
│   └── format.ts                 # (Phase 1) rupiah/tanggal/number
├── components/
│   └── ui/                       # komponen shadcn-style berbasis token
│       ├── button.tsx  input.tsx  label.tsx  card.tsx
│       ├── badge.tsx   skeleton.tsx  separator.tsx
│       ├── table.tsx   dropdown-menu.tsx        # admin
│       └── ...(Dialog, Sheet, Toast/Phase 1)
└── pages/ ... / features/ ...
```

### 20.2 Aturan implementasi

1. **Token** sebelum komponen, komponen sebelum halaman.
2. Modifikasi token di `index.css` **kedua app sekaligus**, lalu update dokumen ini.
3. Komponen baru: buat di `components/ui/*` shadcn-style, berbasis token, sebarkan
   dari satu tempat (jangan inline styling yang sama di 5 halaman).
4. `cn()` wajib untuk menggabung className.
5. Halaman tidak boleh hardcode hex. Jika butuh warna baru → tambah token.
6. Packages bersama: `clsx`, `tailwind-merge`, `class-variance-authority`,
   `lucide-react`, `@radix-ui/react-slot`, `@radix-ui/react-separator`,
   `@radix-ui/react-dropdown-menu` (admin). Library `sonner` menyusul (Phase 1).
7. Belum ada shared package workspace — token & komponen **diduplikasi identik**
   di kedua app dengan **dokumen ini sebagai rujukan tunggal**.

### 20.3 Status implementasi (v1.0)

| Item | admin-web | customer-web |
|---|---|---|
| Token `@theme` + base | ✅ | ✅ |
| `cn()` utils | ✅ | ✅ |
| Button / Input / Label / Card / Badge / Skeleton / Separator | ✅ | ✅ |
| Table / DropdownMenu | ✅ | (saat dibutuhkan) |
| Dialog / Sheet / Toast / format.ts / Can | Phase 1 | Phase 4 |

---

## 21. Aplikasi per Phase

### Phase 1 — Catalog (admin-web)

- Produk (index + create/edit): Table, Toolbar, Form (Input, Select kategori,
  Button), Badge status, Skeleton, EmptyState, error inline, DropdownMenu aksi baris.
- Kategori: halaman index+form sederhana.
- `src/lib/format.ts` dibuat di phase ini.
- Halaman memakai `page-title` header, `max-w-2xl` form, tabel `overflow`.

### Phase 2 — Inventory

- Kartu stok per produk/variant; badge stok (10.1); tabel stock movement.
- Aksi: `+` pesan cepat; form stock opname memakai Dialog.

### Phase 3 — POS

- Layout POS: sidebar halus → grid produk (kartu rapat, gambar placeholder),
  keranjang sticky kanan (panel lebar 360px), total menonjol, tombol besar.
- Barcode scan: fokus input tersembunyi + `Barcode` lucide icon; audio beep opsional.
- Receipt: `font-mono`, padding thermal 80mm.

### Phase 4 — QR Ordering (customer-web)

- Redirect `/qr/:token` → menu outlet; bottom CTA; Sheet keranjang; stepper status.
- Optimistic cart (localStorage saat Phase 4 awal); realtime status via Reverb.

### Phase 5 — Admin Dashboard (aksi lanjut)

- Dashboard stat cards (sales today, avg order value, low stock).
- Tenant/Outlet switcher dropdown; laporan dengan tabel + export CSV (bukan PDF dulu).

### Phase 6 — Stabilization

- Dark mode, audit aksesibilitas, perf (code-split per route), sheets/drawer konsisten.

---

## 22. Definition of Done

Setiap halaman baru dianggap selesai bila:

- [ ] Memakai `index.css` token & komponen `components/ui/*` (tanpa hex/hardcode).
- [ ] Tiga state async lengkap: loading (skeleton), empty, error+retry.
- [ ] Status ditampilkan via Badge mengikuti tabel §10.1.
- [ ] Format uang/tanggal konsisten (§12).
- [ ] Permission-aware bila ada aksi (§13).
- [ ] Destruktif selalu pakai konfirmasi (§2, §10).
- [ ] Focus visible & keyboard test lolos (§17).
- [ ] Responsive mengikuti §18 (admin ≥1024, customer ≤430).
- [ ] Copy bahasa sesuai §16; label status sesuai tabel 10.1.
- [ ] `npm run lint` (oxlint) + `npx tsc -b` + `npm run build` hijau.

---

## 23. Proses Perubahan

1. Perubahan token → edit `@theme` **kedua app** + update dokumen (bagian 4–6).
2. Perubahan komponen → update file komponen + contoh di dokumen (bagian 9).
3. Perubahan pola halaman → tambahkan pattern di dokumen (bagian 7) sebelum dipakai.
4. Komponen/library baru → catat di §20.2 dan §20.3 sebelum dipasang.
5. PR melampirkan tautan seksi dokumen yang berubah.

---

## Document Status

| Property | Value |
|---|---|
| Product | Dagana |
| Document | UI/UX Design System |
| Version | v1.0 |
| Status | Published — Foundation |
| Kaitan | PRD v0.1 · Architecture · API Spec |
| Next | Terapkan di Phase 1 (Catalog) |