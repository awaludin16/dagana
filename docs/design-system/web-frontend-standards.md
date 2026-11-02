# Dagana Frontend Standard — React Web

> **Scope:** `apps/admin-web` and `apps/customer-web`  
> **Stack:** React + TypeScript + Vite + Tailwind CSS + shadcn/ui + TanStack Query.

## 1. Source of truth

Follow these documents in order:

1. `PRD-Dagana.md` for product purpose and scope.
2. `docs/requirements/` for feature behavior.
3. `docs/design-system/visual-foundation.md` and `tokens.json` for visual decisions.
4. `docs/architecture/` for API and system boundaries.
5. `docs/planning/phase-targets.md` for delivery scope and acceptance criteria.
6. `AGENTS.md` and `docs/engineering/engineering-standards.md` for engineering rules.

Do not create a separate color palette, spacing scale, typography system, or component style inside an individual feature.

## 2. Application surfaces

### Owner/Admin Web

This application is an operational workspace for owners and employees. Optimize for clear navigation, quick scanning, data comparison, and predictable forms.

- Use a persistent sidebar on desktop; collapse to a drawer or compact navigation on narrower viewports.
- Use a top bar for current business/outlet context, user menu, and global actions that are defined by the product.
- Keep page title, context/breadcrumb, primary action, and page content in a predictable order.
- Use KPI cards sparingly; show metrics that support an action or decision.
- Use tables for desktop data comparison. On narrow layouts, replace them with stacked summary cards or a carefully designed responsive table; do not simply shrink every column until text becomes unreadable.
- Keep filters visible and summarize active filters. Preserve filters and pagination when returning from a detail screen where appropriate.

### Customer Web / QR Ordering

This application is a focused ordering surface, not an administration dashboard.

- Keep the merchant identity, outlet/table context, menu categories, cart summary, and checkout action clear.
- Minimize navigation and unrelated links.
- Prioritize mobile viewport first; category navigation and cart access must remain usable on narrow screens.
- Product images may be used when they help identify menu items, but missing images must not break layout.
- Make menu name, price, selected modifiers, quantity, and cart total easy to scan.
- Communicate order state and next step clearly; do not imply payment success until backend state confirms it.

## 3. Responsive behavior

Use content-driven responsive layout with these default breakpoints:

| Name | Min width | Guidance |
|---|---:|---|
| `sm` | 640 px | Wider form/card arrangements |
| `md` | 768 px | Tablet layout and compact navigation |
| `lg` | 1024 px | Desktop sidebar and multi-column operational views |
| `xl` | 1280 px | Expanded data workspace |
| `2xl` | 1536 px | Limit content width; do not stretch every element |

Rules:

- Avoid fixed-width pages that overflow at 320–375 px.
- Use a readable maximum content width for forms and settings pages.
- Data tables must have a mobile alternative or a documented horizontal-scroll region with an obvious affordance.
- Dialogs become full-screen sheets on narrow screens when the content cannot fit comfortably.
- Do not make essential controls hover-only; touch and keyboard users must have equivalent access.

## 4. Project structure

Prefer feature-oriented organization. Adapt to the repository if a convention already exists; do not reorganize all code without a concrete need.

```text
src/
├── app/
│   ├── providers/
│   ├── router/
│   └── app.tsx
├── components/
│   ├── layout/
│   └── ui/                 # shared primitives / shadcn wrappers
├── features/
│   └── <feature>/
│       ├── api/
│       ├── components/
│       ├── hooks/
│       ├── pages/
│       ├── schemas/
│       └── types/
├── lib/
│   ├── api-client.ts
│   ├── query-client.ts
│   ├── formatters/
│   └── utils/
└── styles/
    └── globals.css
```

Rules:

- Put API calls in feature API modules or a shared typed API client, never inline in unrelated presentation components.
- TanStack Query owns server state, cache, mutations, retries, and invalidation. Do not mirror API responses into a second global store without a documented reason.
- Use React local state for local UI state. Add a global client-state library only when a real cross-route requirement exists and is approved in the stack document.
- Use React Hook Form/Zod only if included in the approved dependency baseline; do not add them by habit where a small native form is sufficient.
- Keep shared `components/ui` limited to generic, reusable primitives. Feature-specific composition belongs in the feature.
- Permission-based visibility is a UX aid only. The backend remains the security boundary.

### Current `apps/admin-web` convention

The repository adapts the structure above into a flat, category-based layout so that feature work stays easy to find without a large migration:

```text
apps/admin-web/src/
├── auth/                    # session context + provider
├── components/
│   ├── layout/              # app shell/sidebar and auth shell
│   └── ui/                  # shared primitives (button, badge, dialog, alert-dialog)
├── lib/                     # typed API client, env, query client, utils
├── pages/
│   ├── auth/                # login, register
│   ├── onboarding/          # first-Business setup
│   └── workspace/           # home, business, members, profile, not-found
├── test/                    # feature-flow tests + setup
├── types/                   # shared domain/API types (auth, access, business)
├── router.tsx
└── main.tsx
```

- Keep shared domain types in `src/types/` and import them through the barrel; do not redeclare API entities inside pages.
- Put cross-feature flow tests in `src/test/`; keep component-level tests beside the component only when they are truly local.
- Use `components/ui/dialog.tsx` and `components/ui/alert-dialog.tsx` for modal forms and destructive confirmations so the overlay, focus trap, and backdrop blur stay consistent.

## 5. Component rules

- Build on shadcn/ui primitives and Dagana tokens. Wrap/compose them where the product needs a consistent default; do not fork component styling separately in each app.
- Buttons must have explicit variants: primary, secondary/outline, ghost, destructive, and link where needed. Do not create a new color variant for each feature.
- Inputs need a persistent label, helper/error text, disabled state, and visible focus state.
- Use confirmation dialogs for irreversible or high-impact actions. Explain the target and consequence; destructive action should not be the default button.
- Use toast/snackbar for short feedback, not as the only place where an important error or reconciliation result is shown.
- Use a consistent icon set, recommended `lucide-react`; icon-only buttons require `aria-label` and tooltip where helpful.
- Avoid placing several primary actions side by side. Use a clear hierarchy and overflow menu for secondary actions.

## 6. Data display and operational workflows

- Align currency and numeric columns to the right; use tabular numerals.
- Use locale-aware Indonesian formatting for dates, time, quantities, and IDR.
- Preserve exact transaction snapshot values in receipts/history. Do not display current catalog price as though it were the historical order price.
- Every list page must account for loading, empty, error, partial/filtered empty, and success states.
- Empty states should explain why no data is shown and offer a permitted next action.
- Status badges require text, not color alone. Use the approved status palette.
- Do not overuse charts when a concise number, table, or trend is more actionable.
- For destructive/financial actions, show confirmation and relevant context; do not hide an important outcome only in a toast.

## 7. Accessibility and interaction

- Target WCAG 2.2 AA contrast and keyboard accessibility.
- All interactive controls must be reachable and operable by keyboard.
- Provide visible focus rings using the Dagana focus token.
- Use semantic HTML (`button`, `label`, `input`, `table`, `nav`, headings) rather than clickable generic containers.
- Maintain logical heading order and meaningful page title.
- Do not use color alone for validation, order status, cash variance, or inventory state.
- Respect browser zoom; 200% text zoom must not hide essential content or functionality.
- Do not make small text or tightly packed controls the default for the sake of dashboard density.

## 8. Theming and tokens

- Import `docs/design-system/web-theme.css` or port its tokens without changing token names/values.
- Map semantic CSS variables to Tailwind/shadcn theme values in the shared app stylesheet/config.
- Use `.dark` semantic values if dark theme is enabled. Do not implement a second hand-maintained palette in components.
- Bundle the Plus Jakarta Sans variable font locally under the agreed public font directory and reference it with `@font-face`; do not rely on a runtime network request.
- Use tabular numerals for money and quantities (`font-variant-numeric: tabular-nums`).

## 9. Frontend completion checklist

- [ ] Uses shared Dagana colors, font, spacing, radius, and semantic statuses.
- [ ] Works at 375 px, tablet, and desktop widths relevant to the page.
- [ ] Loading, empty, error, disabled, and success states are designed.
- [ ] Keyboard focus, labels, and icon-only accessible names are present.
- [ ] Primary action is obvious and secondary/destructive actions are visually distinct.
- [ ] Currency, totals, and numeric alignment are consistent.
- [ ] No duplicated API/business rules or hardcoded permission decisions.
- [ ] Unit/component tests and lint/type-check/build for changed areas are run and reported.

