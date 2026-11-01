import { Link, Outlet } from 'react-router'

import { Badge } from '@/components/ui/badge'

export function AppLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <a
        href="#main"
        className="sr-only rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
      >
        Lewati ke konten utama
      </a>
      <header className="border-b">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
          <Link to="/" className="text-sm font-semibold">
            Dagana Admin
          </Link>
          <Badge variant="secondary">Development</Badge>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <Outlet />
      </main>
    </div>
  )
}
