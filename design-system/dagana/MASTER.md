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
2. **Primary action = navy `#0F172A`.** Emas `#A16207` HANYA untuk CTA tingkat tertinggi
   yang bersifat "mulai/menyelesaikan" (Mulai Jualan, Checkout, Bayar) — maksimal satu
   per layar. Jangan memakai emas sebagai primary button generik.
3. **Merah `#DC2626` eksklusif untuk destructive/danger** (payment gagal, refund, void,
   tutup kas, hapus). Jangan memakai merah sebagai warna brand/primary.
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
| Primary | `#0F172A` | `--color-primary` |
| On Primary | `#FFFFFF` | `--color-on-primary` |
| Secondary | `#1E3A8A` | `--color-secondary` |
| On Secondary | `#FFFFFF` | `--color-on-secondary` |
| Accent/CTA | `#A16207` | `--color-accent` |
| On Accent/CTA | `#FFFFFF` | `--color-on-accent` |
| Background | `#F8FAFC` | `--color-background` |
| Foreground | `#020617` | `--color-foreground` |
| Card | `#FFFFFF` | `--color-card` |
| Card Foreground | `#020617` | `--color-card-foreground` |
| Muted | `#E8ECF1` | `--color-muted` |
| Muted Foreground | `#475569` | `--color-muted-foreground` |
| Border | `#E2E8F0` | `--color-border` |
| Destructive | `#DC2626` | `--color-destructive` |
| On Destructive | `#FFFFFF` | `--color-on-destructive` |
| Ring | `#0F172A` | `--color-ring` |

**Color Notes:** Trust navy + premium gold [Accent adjusted from #CA8A04]

### Typography

- **Heading Font:** Atkinson Hyperlegible
- **Body Font:** Atkinson Hyperlegible
- **Mood:** accessible, readable, inclusive, WCAG, dyslexia-friendly, clear
- **Google Fonts:** [Atkinson Hyperlegible + Atkinson Hyperlegible](https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap)

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap');
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
/* Primary Button — navy (lihat Dagana Project Overrides #2) */
.btn-primary {
  background: #0F172A;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  opacity: 0.9;
}

/* Accent CTA — emas, hanya untuk aksi "mulai/menyelesaikan" tertinggi */
.btn-accent {
  background: #A16207;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-accent:hover {
  opacity: 0.9;
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: #0F172A;
  border: 2px solid #0F172A;
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
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 24px;
  transition: border-color 200ms ease;
}

/* Kartu interaktif (mis. product card di POS): TANPA transform yang
   menggeser layout (Dagana Project Overrides #8). Cukup border/elevation. */
.card-interactive:hover {
  border-color: #0F172A;
}

.card-interactive:active {
  background: #F8FAFC;
}
```

### Inputs

```css
.input {
  padding: 12px 16px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: #0F172A;
  outline: none;
  box-shadow: 0 0 0 3px #0F172A20;
}
```

### Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
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
