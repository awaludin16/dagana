---
name: Clean
colors:
  primary: "#176B5B"
  secondary: "#EAF1EE"
  success: "#247B50"
  warning: "#B45309"
  danger: "#DC2626"
  surface: "#FFFFFF"
  text: "#1F332C"
  neutral: "#FFFFFF"
  canvas: "#F4F8F6"
typography:
  h1:
    fontFamily: "Plus Jakarta Sans"
    fontSize: 1.75rem
  body-md:
    fontFamily: "Plus Jakarta Sans"
    fontSize: 1rem
  label:
    fontFamily: "Plus Jakarta Sans"
    fontSize: 0.75rem
  sourceScale: "12/14/16/20/24/28"
  weights: "400, 500, 600, 700"
rounded:
  sm: 4px
  md: 8px
  lg: 12px
spacing:
  sm: 8px
  md: 16px
  sourceScale: "8pt baseline grid"
---

## Overview

Desain sederhana dengan ruang putih yang lega, tipografi Plus Jakarta Sans yang mudah dibaca, dan palet warna terbatas untuk menekan visual clutter. Hijau `#176B5B` dipertahankan sebagai warna identitas brand Dagana (persyaratan produk), dipadukan dengan kanvas hijau-netral `#F4F8F6` agar layar operasional (POS/kasir) tetap tenang saat dipakai lama.

## Style Foundations

- **Visual style:** minimal, clean
- **Typography scale:** 12/14/16/20/24/28
- **Typography fonts:** satu keluarga — **Plus Jakarta Sans**; font monospace inheren hanya untuk data tabular
- **Typography weights:** 400, 500, 600, 700
- **Color palette:** primary, canvas, surface, text, success, warning, danger, neutral
- **Spacing scale:** 8pt baseline grid; tap target minimum 44px untuk layar operator mobile

## Colors

- **Primary (#176B5B):** warna brand Dagana; dipakai untuk aksi utama (primary button), tautan, fokus ring, dan state aktif navigasi.
- **Primary hover (#12574B):** turunan primary untuk hover/pressed aksi penting.
- **Soft primary / accent neutral (#EAF1EE):** netral kehijauan muda untuk hover sekunder, nav aktif, dan latar ghost; bukan warna brand sehingga tidak berebut perhatian dengan primary.
- **Canvas (#F4F8F6):** latar halaman; panel konten berwarna surface `#FFFFFF` dengan radius 12–16px.
- **Text (#1F332C):** teks utama kehijauan gelap yang menyatu dengan identitas hijau.
- **Success (#247B50):** hijau status semantik, dibedakan dari primary agar state "Lunas" tidak sama dengan warna brand.
- **Warning (#B45309) / Danger (#DC2626):** status menunggu dan gagal/batalkan.
- **Neutral (#FFFFFF):** sisi simetris palet; pill status memakai pasangan token `--pill-{success|warning|danger|neutral}-{bg|ink|border}`, semua di-mapping lewat `@theme inline` di `src/index.css`.

## Typografi

- Satu keluarga font: **Plus Jakarta Sans** (self-hosted via @fontsource, berat 400–700).
- Judul halaman memakai class `.app-page-title` (clamp 22–28px, tracking -0.025em, `text-wrap: balance`).
- Angka uang dan kuantitas memakai `tabular-nums`.

## Komponen & State

- Wajib menyediakan state `loading` (skeleton berbentuk konten; spinner hanya untuk aksi), `empty` (pesan + CTA), `error` (penjelasan + cara pemulihan, `role="alert"`), `success` (toast Sonner), dan `disabled` (jelas non-interaktif).
- Pesan error pengguna memakai helper bersama `apiErrorMessage` (pesanan pertama dari API + fallback yang bisa ditindaklanjuti).
- Paginasi memakai `PaginationBar` bawaan (`apps/admin-web/src/components/ui/pagination-bar.tsx`).
- Form: label selalu terkait kontrol, `spellCheck={false}` untuk email, `min-h-11` untuk target sentuh, placeholder diakhiri `…`.

## Referensi Implementasi

- Token CSS: `apps/admin-web/src/index.css`
- Komponen state: `apps/admin-web/src/components/states/`
- Logo: `design-system/dagana/dagana-logo.png` (dipakai lewat `DaganaLogo`)
