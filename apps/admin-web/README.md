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

## Form dan penamaan file

Semua form memakai React Hook Form + Zod. Schema berada di `src/lib/validation.ts`, sedangkan
pemetaan error API ke field berada di `src/lib/form-errors.ts`. Field menampilkan error inline,
input dinonaktifkan saat request berjalan, dan alert global hanya muncul untuk error yang tidak
memiliki field terkait.

Komponen, halaman, layout, provider, dan context memakai `PascalCase.tsx`. Hook memakai
`useCamelCase.ts`. Modul non-komponen, file test alur, dan primitive shadcn tetap memakai
`kebab-case`.

## Phase 1 identity flow

The admin app uses the `/api/v1` identity, business, and outlet endpoints. Web authentication uses a
Sanctum SPA session stored in the `HttpOnly` `dagana-session` cookie; the app requests
`/sanctum/csrf-cookie` and sends `X-XSRF-TOKEN` for mutations. No token is written to browser
storage. After authentication, users without an outlet are directed to create their Business and
first Outlet. Outlet management appears only when the API returns the Business context for that
user.
