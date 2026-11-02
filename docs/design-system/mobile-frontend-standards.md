# Dagana Frontend Standard — Flutter Mobile

> **Scope:** `apps/pos-mobile`  
> **Stack:** Flutter + Dart + Material 3 + Riverpod + go_router.

## 1. Source of truth

Follow `PRD-Dagana.md`, the relevant `docs/requirements/` file, `docs/design-system/visual-foundation.md`, `tokens.json`, `docs/architecture/`, `docs/planning/phase-targets.md`, `AGENTS.md`, and `docs/engineering/engineering-standards.md`.

The Flutter app is a client of the same Dagana backend and domain. Do not implement a different checkout, pricing, payment, cash, inventory, or authorization rule on mobile.

## 2. Product experience

The POS is an operational tool used while serving customers. Optimize for **fast, touch-first, low-friction selling**.

- The next required action must be obvious without reading long instructions.
- Keep product selection, cart, quantity, and checkout easy to reach.
- Avoid deep navigation during an active sale.
- Show the current outlet and operator context clearly when relevant.
- Keep cart state visible and prevent accidental loss when navigating away.
- Provide clear feedback for online/offline state, pending sync, payment status, and failed actions.
- Do not force the operator to configure inventory, employee, QR, or recipe features before ordinary selling unless a requirement explicitly makes it mandatory.

## 3. Adaptive layouts and orientation

The application must not assume portrait orientation only. Support the screen classes and operational use cases actually included in the release target.

- **Compact phone:** prioritize a single task at a time. Product listing and cart can be separate surfaces, but cart count and total should remain discoverable.
- **Large phone / small tablet:** use a compact master-detail pattern where it improves speed without squeezing product labels and buttons.
- **Tablet / landscape POS:** prefer a two-pane layout with product/catalog area and persistent cart/checkout area when width permits.
- **Portrait tablet:** preserve the same priority order with responsive sizing; do not force a desktop-like layout if it makes touch targets too small.
- When orientation changes, preserve draft/cart state and avoid resetting a transaction.
- Do not lock orientation unless the product requirement and target-device validation explicitly justify it.

## 4. Touch and visual hierarchy

- Aim for at least 48 × 48 logical px for primary touch targets.
- Keep enough spacing between adjacent actions, especially cancel/delete/refund actions.
- Use a clear primary CTA and keep destructive actions visually separate.
- Use high-contrast item names, prices, quantities, cart totals, and order status.
- Avoid relying on hover, tiny overflow menus, or gestures with no visible alternative.
- Use haptic feedback only for meaningful confirmation where it improves usability; do not add vibration to every tap.
- Support keyboard/scanner input where validated hardware behaves like keyboard input, without requiring it for basic selling.

## 5. Navigation and screen structure

Use go_router for route declaration and navigation. Route guards may improve navigation UX but are not authorization; every protected API operation must still be checked by the backend.

Navigation pattern:

- Phone layouts may use a small bottom navigation set for top-level destinations.
- Tablet layouts may use NavigationRail or an adaptive navigation panel.
- Keep active-sale/cart flow prominent and avoid placing rarely used settings in the primary navigation.
- Use a standard page structure: app context/header, primary content, local actions, and optional persistent cart/summary region.
- Confirm before leaving an in-progress action when the user could lose meaningful work.

## 6. Flutter project structure

Prefer feature-first organization with clear separation between UI, application state, domain behavior, and data access. Keep the structure proportional to feature complexity.

```text
lib/
├── app/
│   ├── app.dart
│   ├── router.dart
│   └── theme/
├── core/
│   ├── network/
│   ├── storage/
│   ├── errors/
│   └── formatting/
├── shared/
│   └── widgets/
└── features/
    └── <feature>/
        ├── data/
        ├── domain/
        ├── application/
        └── presentation/
```

Rules:

- Riverpod owns dependency injection and application state lifecycle. Do not turn providers into a dumping ground for business logic.
- Keep Dio/API code in the data layer. Widgets must not contain endpoint strings, auth token handling, or raw JSON parsing.
- Treat server responses as authoritative. Client-side totals are previews only; backend validates and calculates final values.
- Keep local cache/outbox/sync logic separate from remote source of truth. Only use Drift/SQLite where the feature requires local persistence/offline behavior.
- Keep presentation widgets small enough to review; extract repeated widgets only when reuse or clarity justifies it.
- Handle lifecycle, permission, and plugin errors explicitly for camera, printing, Bluetooth, and local storage.

## 7. Material 3 theme

- Use `ThemeData(useMaterial3: true)` with the Dagana `ColorScheme` and Plus Jakarta Sans family.
- Start from `docs/design-system/flutter/dagana_theme.dart`; do not hardcode color values in screens.
- Use Material components as a baseline, then apply shared Dagana shape, spacing, and typography rules.
- Use semantic colors for success/warning/danger/info. If a semantic color cannot be represented by `ColorScheme`, keep it in a dedicated semantic palette class.
- Keep brand green as the key action color; amber is an accent with dark foreground text.
- Avoid unapproved dynamic color overrides that make Dagana look different on different devices.

### Font setup

Bundle Plus Jakarta Sans files in `assets/fonts/` and register the family in `pubspec.yaml` for weights 400, 500, 600, 700, and 800. Use the same family and weights as Web. Do not depend on runtime font downloads, especially for POS/offline use.

Example `pubspec.yaml` mapping (use the actual filenames downloaded into the repository):

```yaml
flutter:
  fonts:
    - family: PlusJakartaSans
      fonts:
        - asset: assets/fonts/PlusJakartaSans-Regular.ttf
          weight: 400
        - asset: assets/fonts/PlusJakartaSans-Medium.ttf
          weight: 500
        - asset: assets/fonts/PlusJakartaSans-SemiBold.ttf
          weight: 600
        - asset: assets/fonts/PlusJakartaSans-Bold.ttf
          weight: 700
        - asset: assets/fonts/PlusJakartaSans-ExtraBold.ttf
          weight: 800
```

Check the selected distribution's license and include its license notice in the repository's third-party notices. Do not rename the font family differently between the Web and Flutter themes.

## 8. State and feedback

Every asynchronous operation needs explicit states:

- Initial/loading.
- Success/loaded.
- Empty (when a collection has no entries).
- Recoverable error with retry or corrective action.
- Disabled/unavailable when the operation is not currently permitted.
- Offline/pending-sync when relevant.

Do not use a spinner without context for long-running operations. Disable duplicate submissions while a request is in flight and show a result after completion. A local connectivity indicator is not proof that the API is reachable.

## 9. Localization and operational data

- Initial UI language: Bahasa Indonesia, unless a requirement states otherwise.
- Use locale-aware Indonesian formatting for IDR, dates, time, and quantity.
- Align totals and numeric columns; use tabular figures where available through `FontFeature.tabularFigures()`.
- Keep currency and value visually together.
- Do not show unformatted raw enum values or internal IDs to operators.
- Maintain transaction snapshot values for receipts/history; never replace them with current catalog values.

## 10. Accessibility and performance

- Respect platform text scaling; avoid fixed heights that clip expanded text.
- Give icons and icon-only buttons semantic labels/tooltips.
- Provide sufficient contrast and do not communicate status by color alone.
- Test touch targets and important flows on representative small and large devices.
- Use lazy lists/grids for large catalogs and history lists; avoid eagerly building unbounded lists.
- Avoid heavy animation during checkout; prioritize responsive taps and stable frames.
- Test portrait and landscape layouts where supported, plus network interruption and app resume for flows with draft/offline state.

## 11. Mobile frontend completion checklist

- [ ] Uses Dagana `ColorScheme`, Plus Jakarta Sans, shared spacing and component shapes.
- [ ] Supports the required phone/tablet and portrait/landscape layouts.
- [ ] Important touch targets are at least 48 logical px where practical.
- [ ] Loading, empty, error, offline/pending-sync, disabled, and success states are handled.
- [ ] Draft/cart is preserved across expected navigation and orientation changes.
- [ ] API access is in the data layer; Riverpod is used for lifecycle/state, not backend business rules.
- [ ] Text scaling, semantic labels, and color contrast are checked.
- [ ] `flutter analyze`, widget/unit tests, and relevant integration tests are run and reported.

