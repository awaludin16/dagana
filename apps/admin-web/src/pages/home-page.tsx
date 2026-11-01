import { env } from '@/lib/env'

export function HomePage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Dagana Admin</h1>
      <p className="max-w-prose text-sm text-muted-foreground">
        Fondasi aplikasi admin sudah berjalan. Halaman pengelolaan bisnis, menu, dan laporan
        dibangun pada fase berikutnya.
      </p>
      <p className="text-xs text-muted-foreground">
        API: <code className="rounded bg-muted px-1.5 py-0.5">{env.apiBaseUrl}</code>
      </p>
    </section>
  )
}
