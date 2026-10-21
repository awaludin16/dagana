# Dagana Frontend Standards

> **Standar front-end** Dagana. Dokumen ini bersifat pelengkap terhadap `docs/UIUX-Design-Dagana.md`, `AGENTS.md` §9, dan `docs/engineering-standards.md`. Bila ada pertentangan, UX otoritatif di `docs/UIUX-Design-Dagana.md`, aturan agent di `AGENTS.md`, product di `PRD-Dagana.md`.

## 1. Prinsip dasar

1. **Frontend-first untuk fitur yang kontrak backend-nya belum stabil.** Gunakan data mock bertipe untuk layar tersebut. Untuk autentikasi dan organisasi yang endpoint `/api/v1`-nya sudah tersedia, integrasikan langsung melalui API client dan TanStack Query; backend tetap otoritatif.
2. **Mobile-first adalah standar wajib.** Desain dari 375px, enhance di `md:`/`lg:` Tailwind default. Portrait dan landscape harus usable (UIUX §36, §67, §68).
3. **Backend otoritatif.** Validasi finansial/otorisasi hanya untuk UX preview; keputusan bisnis tetap di backend. Jangan re-implementasi rule kritis di frontend.
4. **TypeScript strict.** Hindari `any`. Justifikasi tertulis diperlukan jika terpaksa.
5. **Satu sumber kebenaran visual.** Token CSS di `src/index.css` + CSS variables Tailwind v4. Jangan hardcode warna/spacing berulang.

## 2. Stack aplikasi

`apps/admin-web` (React + Vite + TypeScript):
- **Build:** Vite
- **Styling:** Tailwind CSS v4 (@tailwindcss/vite)
- **Komponen:** shadcn/ui (Base/Radix), icon **Phosphor** (`@phosphor-icons/react`)
- **Routing:** React Router DOM v7
- **Data:** TanStack Query v5
- **Font:** Plus Jakarta Sans (`@fontsource/plus-jakarta-sans`), weight 400/500/600/700
- **Util:** clsx, tailwind-merge

## 3. Design tokens & palet (baseline Dagana Fresh & Focused)

Ikuti `design-system/dagana/MASTER.md` — khususnya **Dagana Project Overrides**.

| Token | Hex | Makna |
|---|---|---|
| `--primary` | `#176B5B` | Aksi utama dan identitas Dagana. |
| `--primary-hover` | `#12564A` | Hover/pressed primary. |
| `--soft-primary` | `#E7F3EE` | Permukaan pendukung primary dan aksi sekunder. |
| `--accent` | `#F4A340` | Highlight/penekanan terbatas; bukan warna aksi utama. |
| `--accent-foreground` | `#19312B` | Teks di atas accent agar kontras AA. |
| `--background` / `--canvas` | `#F7F9F7` | Latar aplikasi. |
| `--card` / `--surface` | `#FFFFFF` | Permukaan konten. |
| `--foreground` / `--text` | `#19312B` | Teks utama. |
| `--muted-foreground` / `--muted-text` | `#596B64` | Teks sekunder yang tetap terbaca. |
| `--border` | `#DDE7E2` | Pemisah dekoratif dan batas permukaan. |
| `--input` | `#596B64` | Batas kontrol interaktif; kontras non-teks ≥ 3:1. |
| `--success` | `#15803D` | Status berhasil. |
| `--warning` | `#B45309` | Status peringatan. |
| `--error` / `--destructive` | `#B91C1C` | Status gagal dan aksi destructive. |
| `--info` | `#1D4ED8` | Status informasi. |

Aturan penting:
- Primary teal digunakan untuk aksi utama dan identitas aplikasi. Hover memakai primary hover.
- Amber hanya untuk highlight atau penekanan visual; jangan gunakan sebagai pengganti primary.
- Warna semantic hanya untuk status sistem, bukan sebagai warna brand.
- Teks putih di atas accent amber tidak memenuhi AA; gunakan `--accent-foreground`.
- `--border` yang lembut khusus pemisah dekoratif. Gunakan `--input` pada batas kontrol
  yang perlu terlihat; focus ring harus tetap jelas.
- Warna adalah komunikasi, bukan dekorasi. Status selalu memiliki label/ikon selain warna
  (UIUX §51).
- Palet peran yang sama berlaku untuk Owner/Admin, POS, dan Customer Web; tata letak,
  kepadatan, dan hierarki aksi boleh berbeda mengikuti tugas tiap permukaan.
- CSS token aktif berada di `apps/admin-web/src/index.css`. Saat Customer Web tersedia,
  gunakan nilai dan nama peran yang sama; POS Flutter memetakan nilai warna ke theme native.

## 4. Arsitektur folder (frontend)

Struktur awal `apps/admin-web/src/`:

```text
src/
├── components/
│   ├── ui/        # shadcn/ui primitives
│   ├── shared/    # komponen reusable lintas fitur (bersih, generik)
│   ├── layout/    # app shell (header, sidebar, bottom nav)
│   └── states/    # EmptyState, ErrorState, StatusBadge, dll.
├── config/
├── features/      # fitur per domain (auth, business, members, products, pos, cash, reports)
├── hooks/
├── lib/           # utils, api client
├── routes/
├── types/
├── constants/
└── mocks/         # mock data (frontend-first)
```

Aturan: jangan buat abstraksi terlalu dini. Tambah folder saat benar-benar dipakai berulang.

## 4.1 Shell Owner/Admin

- Logo resmi Dagana memakai aset `design-system/dagana/dagana-logo.png`; jangan menggantinya
  dengan ikon generik atau mengetik ulang wordmark.
- Navigasi fitur utama tampil eksplisit di sidebar. Jangan menyembunyikan tujuan utama dalam
  halaman "Lainnya". Hanya tampilkan tautan ke workflow yang sudah tersedia dan otorisasi
  menu berdasarkan permission dari membership aktif.
- Navigasi utama tersembunyi secara default di seluruh breakpoint. Tombol menu membuka
  drawer kiri pada mobile, tablet, dan desktop; drawer dapat ditutup dengan Escape,
  overlay, tombol tutup, atau setelah navigasi, dengan perilaku fokus dialog yang aksesibel.
- Tampilkan pemilih bisnis/outlet pada header tanpa mengorbankan tombol menu dan area sentuh
  minimum. Konten utama tidak boleh tertutup sidebar atau drawer.
- Nama pengguna dan aksi logout tersedia di bagian bawah drawer navigasi; jangan menaruh
  tombol logout di header atau menyembunyikannya pada halaman "Lainnya".
- Editor permission menampilkan preset bawaan role sebagai status toggle on/off. Mengubah
  role menerapkan kembali default role secara visual; override hanya untuk penyesuaian dan
  tetap dibatasi oleh permission aktor.

## 5. State UI wajib (Definition of Done)

Setiap screen wajib menangani kelima state (UIUX §64):
- [ ] `loading` (gunakan **Skeleton** mengikuti bentuk konten; spinner hanya untuk aksi)
- [ ] `empty` (pesan + CTA yang mengarahkan tindakan)
- [ ] `error` (apa yang terjadi + apa yang bisa dilakukan, gunakan `role="alert"` bila error kritis)
- [ ] `success` (feedback jelas, bisa via toast Sonner)
- [ ] `disabled` (state non-interaktif jelas, tidak terkesan bisa diklik)

## 6. Aksesibilitas & interaksi

- Kontras ≥ 4.5:1, fokus keyboard terlihat, error inline terhubung `aria-describedby`.
- Destructive action wajib dialog konfirmasi (konsekuensi dijelaskan, bukan "Are you sure?").
- `prefers-reduced-motion` dihormati (animasi 150–250ms untuk feedback saja).
- Tanpa hover yang menggeser layout (border/elevation change untuk card interaktif). POS prioritaskan kecepatan.

## 7. Data layer & integrasi backend

- **Frontend-first:** mock data di `src/mocks/`, tipe di `src/types/`. Gunakan tipe yang merefleksikan kontrak API (Resource shape) tanpa mengikat detail DB.
- **API client terpusat:** `src/lib/api.ts` (base URL, headers, CSRF jika diperlukan, error parsing). Error terstandar (UI konsisten).
- **TanStack Query:** server state via Query/Mutation, invalidasi terencana. Jangan simpan server data di local state tanpa alasan.
- **Integrasi Phase 1–2:** auth, profil/membership, onboarding business/outlet, serta pengelolaan anggota memakai endpoint yang terdokumentasi di `docs/api-conventions.md`. Pemilihan konteks di UI tidak menggantikan tenant/outlet authorization backend.
- **Organisasi:** outlet memiliki layar list/create/read/update serta disable/enable yang mempertahankan riwayat. Pengelolaan anggota mengirim undangan ke email, bukan membuat password/akun atas nama employee. Penerima dapat mendaftar atau masuk lalu menerima undangan dengan token sekali pakai.
- **Daftar:** gunakan pagination API untuk koleksi anggota dan outlet; tampilkan status halaman, jumlah hasil bila tersedia, serta aksi halaman sebelumnya/berikutnya. Jangan mengasumsikan respons koleksi selalu berupa `data` saja.
- **Backend authority:** semua nilai finansial/otorisasi divalidasi ulang backend. UI hanya preview.
- **Auth:** session cookie Sanctum stateful + CSRF (mengacu `docs/api-conventions.md`). Jangan hardcode token di localStorage untuk flow ini.

## 8. Git, branch & commit

Ikuti AGENTS.md §10. Branch baru per unit kerja: `feat/admin-web-foundation`, `feat/admin-shell`, `feat/pos-mock`, dst. Gunakan **Conventional Commits**. Jangan push/merge tanpa permintaan eksplisit.

## 9. Definition of Done (UI)

Sebuah layar selesai jika:
- Mobile-first, portrait+landscape usable, tidak ada horizontal overflow tidak sengaja
- 5 state terpenuhi + empty/error punya aksi pemulihan
- Menggunakan token/design system, komponen reusable bila pola terulang
- Type-safe, tidak ada `any` tanpa justifikasi
- Aksesibilitas dasar terpenuhi (label, focus, kontras, error terhubung)
- Tidak menambah kompleksitas workflow (UIUX §65: "Apa yang ingin diselesaikan user sekarang?")

## 10. Catatan implementasi

- `Toaster` (Sonner) hanya di root layout (panduan shadcn).
- Drawer navigasi memakai primitive Radix `Sheet` yang sudah tersedia pada semua breakpoint
  agar overlay, Escape, dan focus management konsisten.
- Icon Phosphor: impor subset bila perlu, hindari import seluruh bundle tanpa alasan performa (bisa dioptimasi nanti).
- Tailwind v4: gunakan `@theme inline` + CSS variables (sudah terkonfigurasi di `src/index.css`).

---

**Referensi wajib dibaca sebelum mengubah UI:** `docs/UIUX-Design-Dagana.md`, `design-system/dagana/MASTER.md`, `AGENTS.md` §9, `docs/api-conventions.md`.
