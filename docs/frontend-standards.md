# Dagana Frontend Standards

> **Standar front-end** Dagana. Dokumen ini bersifat pelengkap terhadap `docs/UIUX-Design-Dagana.md`, `AGENTS.md` §9, dan `docs/engineering-standards.md`. Bila ada pertentangan, UX otoritatif di `docs/UIUX-Design-Dagana.md`, aturan agent di `AGENTS.md`, product di `PRD-Dagana.md`.

## 1. Prinsip dasar

1. **Frontend dulu, integrasi backend di fase berikutnya.** Seluruh layar dibangun dengan data mock terlebih dahulu (tipe tetap, terdefinisi), baru diganti TanStack Query ke API (`/api/v1`) ketika kontrak endpoint cukup stabil. Ini adalah arahan eksplisit proyek.
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
- **Font:** Atkinson Hyperlegible (`@fontsource/atkinson-hyperlegible`), weight 400/700
- **Util:** clsx, tailwind-merge

## 3. Design tokens & palet (disetujui PO)

Ikuti `design-system/dagana/MASTER.md` — khususnya **Dagana Project Overrides**.

| Token | Hex | Makna |
|---|---|---|
| `--primary` | `#0F172A` | Primary action (navy). |
| `--accent` | `#A16207` | CTA tertinggi (emas) — maksimal 1 per layar. |
| `--destructive` | `#DC2626` | Eksklusif untuk destructive/danger. |
| `--background` | `#F8FAFC` | Background aplikasi. |

Aturan penting:
- Primary = navy. Emas HANYA untuk aksi "mulai/menyelesaikan" tertinggi.
- Merah eksklusif untuk destructive/danger (refund, void, tutup kas, hapus, payment gagal).
- Warna komunikasi, bukan dekorasi. Status: dot + label tekstual (UIUX §51).

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
├── features/      # fitur per domain (auth, business, products, pos, cash, reports)
├── hooks/
├── lib/           # utils, api client
├── routes/
├── types/
├── constants/
└── mocks/         # mock data (frontend-first)
```

Aturan: jangan buat abstraksi terlalu dini. Tambah folder saat benar-benar dipakai berulang.

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
- `SidebarProvider` + `SidebarTrigger` untuk sidebar desktop (shadcn sidebar).
- Icon Phosphor: impor subset bila perlu, hindari import seluruh bundle tanpa alasan performa (bisa dioptimasi nanti).
- Tailwind v4: gunakan `@theme inline` + CSS variables (sudah terkonfigurasi di `src/index.css`).

---

**Referensi wajib dibaca sebelum mengubah UI:** `docs/UIUX-Design-Dagana.md`, `design-system/dagana/MASTER.md`, `AGENTS.md` §9, `docs/api-conventions.md`.
