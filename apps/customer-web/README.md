# Dagana Customer Web

Aplikasi customer Dagana (pemesanan QR). Stack: React 19 + TypeScript + Vite, Tailwind CSS v4, shadcn/ui, TanStack Query, dan react-router.

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

The Customer Web uses the shared Dagana theme from `docs/design-system/web-theme.css` and bundles
Plus Jakarta Sans locally under `public/fonts`.
