# Catatan Proyek Dagana untuk skill ui-ux-pro-max

> File ini adalah catatan lokal proyek, bukan bagian dari skill upstream.
> Dibuat 2026-10-15 atas persetujuan Product Owner.

## Mobile-first adalah standar wajib Dagana

Seluruh web UI Dagana (admin-web, customer-web, dan layar POS web) **wajib
mobile-first**: desain dimulai dari 375px, lalu enhance pada breakpoint
`md:`/`lg:` Tailwind default. Rujukan otoritatif:

- `docs/UIUX-Design-Dagana.md` §36 (Mobile UX), §67 (Mobile-First Standard),
  §68 (Screen Orientation Policy — portrait DAN landscape harus usable).
- `AGENTS.md` §2 dan §9.

### Bagian skill yang TIDAK berlaku penuh untuk Dagana

Checklist skill ini sebagian ditujukan untuk **native app** (iOS/Android/
React Native/Flutter). Untuk Dagana yang berbasis web:

| Checklist skill | Berlaku untuk Dagana? |
|---|---|
| Touch target ≥44pt / ≥48dp | Sebagian — berlaku sebagai kenyamanan sentuh di web mobile (target praktis ≥40px), bukan aturan platform |
| Safe area / Dynamic Type / haptics | TIDAK berlaku (native-only); gunakan `env(safe-area-inset-*)` bila perlu untuk PWA |
| Bottom nav limit, back-behavior | Berlaku sebagai pola UX umum |
| Kontras light/dark, focus keyboard, reduced motion | BERLAKU penuh (web) |
| `aria-*`, `role=alert`, `aria-describedby` | BERLAKU penuh (web) |

### Aturan proyek yang mengatur

Keputusan desain Dagana yang telah disetujui ada di
`design-system/dagana/MASTER.md` bagian **Dagana Project Overrides** (navy
primary, emas untuk CTA tertinggi, merah khusus destructive, uang integer
rupiah, ikon Phosphor). Bagian itu menang atas rekomendasi generator skill
bila bertentangan. Otoritas UX secara umum tetap
`docs/UIUX-Design-Dagana.md`.
