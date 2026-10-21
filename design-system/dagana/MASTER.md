# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Dagana
**Generated:** 2026-10-15 23:45:42
**Revised:** 2026-10-15 — diselaraskan dengan keputusan proyek (lihat Dagana Project Overrides)

**Category:** F&B Business Operating Platform (operational tool)

---

## Dagana Project Overrides (berlaku mengatur di atas spesifikasi hasil generator)

Bagian ini adalah keputusan proyek yang telah disetujui Product Owner. Jika bertentangan
dengan bagian lain di file ini, bagian ini yang menang.

1. **Karakter produk:** operational tool untuk bisnis F&B — bukan landing page, bukan
   dashboard enterprise. Ikuti `docs/UIUX-Design-Dagana.md` (terutama §61–§64 anti AI-slop)
   sebagai otoritas UX; file ini adalah pelengkap visual.
2. **Primary action = teal `#176B5B`**, dengan hover `#12564A`. Amber `#F4A340`
   digunakan terbatas untuk highlight dan penekanan, bukan sebagai pengganti primary.
   Gunakan foreground gelap di atas amber.
3. **Warna semantic** success, warning, error, dan info khusus untuk status sistem.
   Error `#B91C1C` juga menjadi warna destructive; jangan gunakan warna semantic sebagai
   warna brand/primary.
4. **Warna adalah komunikasi, bukan dekorasi** (UIUX §40). Status selalu
   dot/ikon + label tekstual; warna tidak pernah menjadi satu-satunya indikator.
5. **Mobile-first adalah standar wajib** (UIUX §36, §67, §68): desain dari 375px ke atas,
   enhance di `md:`/`lg:`. Breakpoint Tailwind default saja. Portrait DAN landscape harus
   usable; landscape tidak pernah jadi syarat workflow.
6. **Uang:** seluruh amount IDR berupa integer rupiah, diformat dengan
   `Intl.NumberFormat('id-ID')`. Jangan pernah kalkulasi uang dengan floating point.
7. **Ikon:** Phosphor Icons (`@phosphor-icons/react`) sebagai library utama; Heroicons
   sebagai fallback. Gaya konsisten (outline di layer hierarki yang sama). Tanpa emoji.
8. **Tanpa hover yang menggeser layout** pada kartu/item interaktif (POS grid): gunakan
   border/elevation change, bukan `translateY`. Pada POS, kecepatan sentuh > efek visual.
9. **Skeleton untuk loading konten**, spinner hanya untuk loading aksi (panduan stack shadcn).
10. **Satu primary action per layar** (UIUX §41); hierarki button: primary / secondary /
    tertiary / destructive (UIUX §42).

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#176B5B` | `--color-primary` |
| Primary Hover | `#12564A` | `--color-primary-hover` |
| On Primary | `#FFFFFF` | `--color-primary-foreground` |
| Soft Primary | `#E7F3EE` | `--color-soft-primary` |
| Accent | `#F4A340` | `--color-accent` |
| On Accent | `#19312B` | `--color-accent-foreground` |
| Canvas | `#F7F9F7` | `--color-canvas` |
| Surface | `#FFFFFF` | `--color-surface` |
| Text | `#19312B` | `--color-text` |
| Muted Text | `#596B64` | `--color-muted-text` |
| Border | `#DDE7E2` | `--color-border` |
| Control Border | `#596B64` | `--color-input` |
| Success | `#15803D` | `--color-success` |
| Warning | `#B45309` | `--color-warning` |
| Error / Destructive | `#B91C1C` | `--color-error` / `--color-destructive` |
| Info | `#1D4ED8` | `--color-info` |
| On Semantic | `#FFFFFF` | `--color-semantic-foreground` |
| Focus Ring | `#176B5B` | `--color-ring` |

**Color Notes:** Gunakan teal untuk aksi utama. Amber selalu dipasangkan dengan teks
`#19312B`, bukan teks putih. Border `#DDE7E2` untuk pemisah dekoratif; batas kontrol
interaktif memakai `#596B64` agar kontras non-teks memadai. Semua status harus memiliki
label/ikon selain warna. Pasangan teks utama, muted, tombol, dan status telah diperiksa
terhadap kontras WCAG 2.2 AA.

### Typography

- **Heading Font:** Plus Jakarta Sans
- **Body Font:** Plus Jakarta Sans
- **Mood:** modern, clean, warm, professional, efficient
- **Weights:** 400, 500, 600, 700
- **Source:** Fontsource, served locally by the application

**CSS Import:**
```css
@import "@fontsource/plus-jakarta-sans/400.css";
@import "@fontsource/plus-jakarta-sans/500.css";
@import "@fontsource/plus-jakarta-sans/600.css";
@import "@fontsource/plus-jakarta-sans/700.css";
```

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `16px` / `1rem` | Standard padding |
| `--space-lg` | `24px` / `1.5rem` | Section padding |
| `--space-xl` | `32px` / `2rem` | Large gaps |
| `--space-2xl` | `48px` / `3rem` | Section margins |
| `--space-3xl` | `64px` / `4rem` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured cards |

---

## Component Specs

### Buttons

```css
/* Primary Button — teal (lihat Dagana Project Overrides #2) */
.btn-primary {
  background: var(--primary);
  color: var(--primary-foreground);
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  background: var(--primary-hover);
}

/* Accent — amber untuk highlight terbatas, bukan pengganti primary */
.btn-accent {
  background: var(--accent);
  color: var(--accent-foreground);
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-accent:hover {
  filter: brightness(0.96);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: var(--primary);
  border: 2px solid var(--primary);
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}
```

### Cards

```css
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 24px;
  transition: border-color 200ms ease;
}

/* Kartu interaktif (mis. product card di POS): TANPA transform yang
   menggeser layout (Dagana Project Overrides #8). Cukup border/elevation. */
.card-interactive:hover {
  border-color: var(--primary);
}

.card-interactive:active {
  background: var(--canvas);
}
```

### Inputs

```css
.input {
  padding: 12px 16px;
  border: 1px solid var(--input);
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: var(--primary);
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
```

### Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  background: var(--surface);
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** Minimalism & Swiss Style

**Keywords:** Clean, simple, spacious, functional, white space, high contrast, geometric, sans-serif, grid-based, essential

**Best For:** Enterprise apps, dashboards, documentation sites, SaaS platforms, professional tools

**Key Effects:** Subtle hover (200-250ms), smooth transitions, sharp shadows if any, clear type hierarchy, fast loading

### Page Pattern

**Pattern Name:** Trust & Authority + Conversion

- **Conversion Strategy:** Security badges. Case studies. Transparent pricing. Low-friction form. Provide pause/stop and stop the logo carousel on focus, hover, and reduced motion. Previous/next controls provide the keyboard equivalent; pause offscreen/hidden and render a static logo set under reduced motion.
- **CTA Placement:** Contact Sales / Get Quote (primary) + Nav
- **Section Order:** Hero (mission/credibility) > Proof (logos, certs, stats) > Solution overview > Clear CTA path

---

## Anti-Patterns (Do NOT Use)

- ❌ Playful design
- ❌ Poor security UX
- ❌ AI purple/pink gradients

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
