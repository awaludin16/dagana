# Dagana Admin Web

Aplikasi admin Dagana. Stack: React 19 + TypeScript + Vite, Tailwind CSS v4, shadcn/ui, TanStack Query, dan react-router.

## Menjalankan

```bash
npm install
cp .env.example .env   # opsional
npm run dev
```

## Pemeriksaan

```bash
npm run lint
npm run type-check
npm run test
npm run build
npm run format:check
```

Panduan lengkap: `docs/operations/development-environment.md`.

The Admin Web uses the shared Dagana theme from `docs/design-system/web-theme.css` and bundles
Plus Jakarta Sans locally under `public/fonts`.

## Phase 1 identity flow

The admin app uses the `/api/v1` identity, business, and outlet endpoints. Bearer tokens stay in
React memory and are never written to browser storage; refreshing the page requires signing in
again. After authentication, users without an outlet are directed to create their Business and
first Outlet. Outlet selection appears only when the API returns multiple outlets for that
Business.
