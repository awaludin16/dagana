# Dagana Design System — Visual Foundation

> **Status:** Recommended baseline for product and engineering review  
> **Scope:** Brand colors, typography, visual hierarchy, shared tokens, and accessibility baseline for React Web and Flutter POS.

## 1. Visual direction

**Direction: Modern F&B — Fresh, Warm, Professional.**

Dagana is an operational tool used during busy service hours and for business administration. Its visual identity must feel fresh and connected to food businesses without looking playful or decorative at the expense of readability. The interface should feel calm, direct, reliable, and fast.

Design principles:

1. **Operational clarity first.** The most important action and transaction value must be easy to identify.
2. **Fresh, not childish.** Use forest green as the brand anchor, warm amber as a restrained accent, and warm neutral surfaces.
3. **Readable under pressure.** Favor clear type, strong hierarchy, stable spacing, and unambiguous status labels.
4. **Consistent, platform-native.** Web and Flutter share tokens and visual language, but use components and interaction patterns suitable for each platform.
5. **Content over decoration.** Avoid gradients, decorative illustrations, oversized rounded cards, and shadows that compete with operational data.

## 2. Brand palette

### 2.1 Core brand colors

| Token | Hex | Purpose | Guidance |
|---|---|---|---|
| `brand.primary` | `#176B52` | Forest green; primary CTA, active navigation, selected controls, key emphasis | Main Dagana identity. Use with white foreground. |
| `brand.primaryHover` | `#12543F` | Darker green for hover/pressed emphasis | Web hover and pressed state; not a separate brand color. |
| `brand.primarySoft` | `#DCEFE7` | Soft green container | Selected rows, subtle highlights, low-emphasis surfaces. |
| `brand.amber` | `#E8A23A` | Warm amber | Highlights, small accent markers, promotional emphasis, secondary action. Use dark text on solid amber. |
| `brand.terracotta` | `#A94F36` | Terracotta | Rare secondary accent, food-related feature highlights, restrained emphasis. Use white text if used as a solid fill. |

### 2.2 Light theme semantic colors

| Token | Hex | Purpose |
|---|---|---|
| `background` | `#F6F8F5` | App/page background |
| `surface` | `#FFFFFF` | Cards, dialogs, menus, input surfaces |
| `surfaceSubtle` | `#EDF2EE` | Quiet grouping surface |
| `text` | `#18231E` | Main text and icons |
| `textMuted` | `#5D6B63` | Supporting text, metadata |
| `border` | `#E3E8E4` | Divider and component outline |
| `inputBorder` | `#D5DED8` | Input outline |
| `focus` | `#176B52` | Keyboard focus ring |

### 2.3 Status colors

| Status | Foreground | Container/background | Meaning |
|---|---|---|---|
| Success | `#18794E` | `#E1F3E8` | Paid, completed, active, successful sync |
| Warning | `#A15C00` | `#FFF1D6` | Pending, low stock, attention required |
| Danger | `#B42318` | `#FCE8E6` | Failed, cancelled, destructive action, discrepancy requiring action |
| Info | `#245E9B` | `#E7F0FA` | Informational state, neutral process update |

Status must never be communicated through color alone. Pair color with a readable label and, where useful, an icon.

Representative calculated contrast pairs for the light palette: white on primary green **6.44:1**; dark text on amber **7.02:1**; white on terracotta **5.44:1**; muted text on white **5.60:1**; status text on its light container: success **4.68:1**, warning **4.65:1**, danger **5.58:1**, info **5.79:1**. These are token-pair checks; each actual component/state must still be checked in context.

### 2.4 Dark theme semantic colors

Dark theme is supported by the token set, but each app may expose a theme toggle only when the product scope and UX are ready. Do not use operating-system dynamic colors to replace the Dagana brand palette.

| Token | Hex | Purpose |
|---|---|---|
| `background` | `#101A16` | App background |
| `surface` | `#17231D` | Main surface |
| `surfaceRaised` | `#1E2D25` | Elevated surface / popup |
| `surfaceSubtle` | `#25372D` | Subtle grouping |
| `text` | `#F2F6F3` | Main text |
| `textMuted` | `#B2C0B7` | Supporting text |
| `border` | `#34463B` | Dividers and outlines |
| `primary` | `#77CBAA` | Main action and active state |
| `onPrimary` | `#0C2D20` | Text/icon on primary |
| `primaryContainer` | `#204C3B` | Selected or highlighted surface |
| `onPrimaryContainer` | `#D9F3E7` | Text/icon on primary container |
| `secondary` | `#F1B756` | Amber accent |
| `onSecondary` | `#30200A` | Text/icon on amber |
| `tertiary` | `#F0A087` | Terracotta accent |
| `onTertiary` | `#30150E` | Text/icon on terracotta |

Dark-theme status containers: success `#153C2B` / text `#A7E9C7`; warning `#49310F` / text `#FFD48B`; danger `#4A1E1B` / text `#FFC4BC`; info `#18334D` / text `#B9D9FF`.

## 3. Color usage rules

- Use semantic tokens (`primary`, `background`, `text`, `success`, etc.) in product UI. Do not sprinkle raw hex values through feature components.
- Primary green is reserved for primary actions, active navigation, focus, and selected states. Do not paint every card or icon green.
- Amber is an accent, not a second primary. Avoid amber for long text, full-page backgrounds, or large repeated surfaces.
- Terracotta is used sparingly and must not replace the danger/error status color.
- Use neutral surfaces for most of the interface. Cards should be separated by spacing and subtle borders before adding shadows.
- Financial values must remain readable and aligned; do not color all totals green. Use status color only when it communicates actual state.
- In charts, use a consistent series palette and labels/legends; never rely on color alone to identify a series.

## 4. Typography

### Primary typeface: Plus Jakarta Sans

Use **Plus Jakarta Sans** as the shared UI typeface for Web and Flutter. It is a variable sans-serif with a broad weight range and Latin Extended support. Bundle the font with each application instead of depending on a runtime font download; this keeps typography consistent and reliable offline.

- Family: `Plus Jakarta Sans`
- Weights: 400 Regular, 500 Medium, 600 SemiBold, 700 Bold, 800 ExtraBold
- Default body: 14–16 px on Web; 14–16 logical px on Mobile depending on density
- Body copy: 400 / 500
- Labels and controls: 500 / 600
- Page and section headings: 600 / 700
- KPI/transaction totals: 600 / 700 with tabular figures

Fallbacks: `Inter`, `Roboto`, `Arial`, `sans-serif` on Web; bundled Plus Jakarta Sans, then platform sans-serif fallback on Flutter.

### Type scale

| Role | Web size / line height | Mobile size / line height | Weight |
|---|---:|---:|---:|
| Display / hero | 36 / 44 | 32 / 40 | 700 |
| Page title | 28 / 36 | 24 / 32 | 700 |
| Section title | 20 / 28 | 18 / 26 | 600 |
| Card title | 16 / 24 | 16 / 24 | 600 |
| Body | 14 / 22 | 14 / 22 | 400 |
| Body emphasis | 14 / 22 | 14 / 22 | 600 |
| Control label | 13 / 20 | 14 / 20 | 600 |
| Caption / metadata | 12 / 18 | 12 / 18 | 500 |

Treat this scale as a default, not a reason to shrink text. Dense operational content may use 13–14 px when still comfortably readable. Avoid using caption size for important transaction information.

### Numbers and currency

- Use tabular figures for totals, prices, quantities, dates in aligned columns, and KPI values.
- Use locale-aware formatting for Indonesian Rupiah (`IDR` / `Rp`) and Indonesian dates.
- Keep the currency symbol and amount together; do not let wrapping separate them on narrow screens.
- Do not use a decorative or monospace font for normal prices. Tabular numerals in Plus Jakarta Sans are preferred.

## 5. Layout and spacing

Use a 4 px base spacing unit. Prefer these values: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64`.

| Token | Value | Typical use |
|---|---:|---|
| `space-1` | 4 px | Icon/text micro gap |
| `space-2` | 8 px | Compact control gap |
| `space-3` | 12 px | Input internals, compact card gap |
| `space-4` | 16 px | Default component gap / page padding on compact screens |
| `space-5` | 20 px | Related sections |
| `space-6` | 24 px | Card padding / section gap |
| `space-8` | 32 px | Major section gap |
| `space-10` | 40 px | Large section separation |
| `space-12` | 48 px | Large layout spacing |
| `space-16` | 64 px | Page-level separation |

Radius guidance: 8 px for controls, 10–12 px for cards, 14–16 px for dialogs/sheets, and full pill only for chips/badges where appropriate. Avoid rounding every container excessively.

Elevation: default to no shadow or a very subtle shadow. Use clear border and surface contrast for tables, forms, and operational panels. Reserve elevation for dropdowns, menus, dialogs, and floating controls.

## 6. Component appearance

- **Primary button:** green fill, white label, minimum 44 px Web / 48 logical px Flutter; use one dominant primary action per local context.
- **Secondary button:** neutral surface with border; use for alternate actions.
- **Accent action:** amber fill only when clearly secondary and paired with dark text.
- **Danger action:** red styling; destructive confirmation must explain the impact.
- **Inputs:** label above field, visible focus, clear error/help text, and persistent value. Placeholder is not a label.
- **Cards:** neutral surface, subtle border, restrained radius; avoid nested-card overload.
- **Tables:** clear column headings, aligned numeric columns, stable status labels, pagination, and useful empty states.
- **Badges:** small and restrained. Use status colors only for actual statuses, not decoration.
- **Icons:** use a consistent line icon family. Do not mix emoji and icon libraries in the same interface.
- **Loading:** prefer skeletons for page structure and small progress indicators for local actions. Preserve layout to avoid jumping.
- **Empty/error states:** explain what happened and give a recovery action when possible.

## 7. Accessibility baseline

Target WCAG 2.2 AA for web and use the same contrast/touch principles in mobile UI.

- Normal text: contrast ratio at least 4.5:1.
- Large text: at least 3:1.
- Important UI boundaries and graphical controls: at least 3:1 against adjacent colors where applicable.
- Never rely on color alone; include text, icon, or shape differences for status.
- Keyboard focus must be clearly visible on Web.
- Inputs and icon-only actions require accessible labels.
- Respect text scaling and platform accessibility settings on Flutter.
- Touch targets: aim for at least 44 × 44 CSS px on Web and 48 × 48 logical px on Flutter for primary interactive controls. Avoid tightly packed destructive controls.
- Validate key combinations using an automated contrast checker when tokens are changed; re-check real component states, not only palette swatches.

## 8. Brand and product usage

- Product name is written **Dagana**; avoid alternate capitalization.
- Brand green should be the most recognizable interface color.
- Use the tagline only in onboarding/marketing contexts, not in every operational screen: **“Mulai sendiri. Jualan langsung. Berkembang tanpa pindah sistem.”**
- Product screens should prioritize merchant work. Avoid marketing-style gradients, large hero imagery, and extra decoration in POS/admin flows.

## 9. Implementation references

- React Web: [`web-frontend-standards.md`](web-frontend-standards.md) and [`web-theme.css`](web-theme.css).
- Flutter Mobile: [`mobile-frontend-standards.md`](mobile-frontend-standards.md) and [`flutter/dagana_theme.dart`](flutter/dagana_theme.dart).
- Machine-readable palette/layout tokens: [`tokens.json`](tokens.json).

## 10. External references

- [Plus Jakarta Sans — Google Fonts source metadata](https://github.com/google/fonts/tree/main/ofl/plusjakartasans) — typeface coverage, variable weights, and license metadata.
- [Flutter Material `ColorScheme`](https://api.flutter.dev/flutter/material/ColorScheme-class.html) — semantic color roles and matching on-colors.
- [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/) — contrast, use of color, and accessibility criteria.

