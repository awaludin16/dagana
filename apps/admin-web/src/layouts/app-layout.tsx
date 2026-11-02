import { Building2, CircleUserRound, LogOut, Store } from 'lucide-react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'

import { useSession } from '@/auth/session-context'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'

export function AppLayout() {
  const { token, user, endSession } = useSession()
  const navigate = useNavigate()

  async function handleLogout() {
    if (!token) return

    let notice: string | undefined

    try {
      await api.logout(token)
    } catch {
      notice = 'Sesi di perangkat ini sudah ditutup, tetapi server belum mengonfirmasi logout.'
    } finally {
      endSession(notice)
      navigate('/login', { replace: true, state: notice ? { notice } : undefined })
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-muted/30 text-foreground">
      <a
        href="#main"
        className="sr-only rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
      >
        Lewati ke konten utama
      </a>
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            to="/"
            className="inline-flex min-h-11 shrink-0 items-center gap-2.5 rounded-sm text-base font-semibold tracking-tight"
          >
            <span className="grid size-9 place-items-center rounded-lg bg-dagana-amber text-dagana-amber-foreground">
              <Store aria-hidden="true" className="size-4.5" />
            </span>
            dagana
          </Link>
          <nav aria-label="Navigasi utama" className="flex items-center gap-1">
            <NavLink
              to="/business"
              className={({ isActive }) =>
                `hidden min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium sm:inline-flex ${isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`
              }
            >
              <Building2 aria-hidden="true" className="size-4" />
              Business
            </NavLink>
            <NavLink
              to="/profile"
              aria-label="Profil"
              className={({ isActive }) =>
                `inline-flex size-11 items-center justify-center rounded-lg text-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${isActive ? 'bg-muted text-foreground' : 'text-muted-foreground'}`
              }
            >
              <CircleUserRound aria-hidden="true" className="size-5" />
            </NavLink>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="min-h-11 gap-2 px-2.5 sm:px-3"
              onClick={handleLogout}
            >
              <LogOut aria-hidden="true" className="size-4" />
              <span className="sr-only sm:not-sr-only">Keluar</span>
            </Button>
          </nav>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Workspace
            </p>
            <p className="mt-1 text-sm font-medium">{user?.name}</p>
          </div>
          <Link
            to="/profile"
            className="max-w-[55%] truncate text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {user?.email}
          </Link>
        </div>
        <Outlet />
      </main>
    </div>
  )
}
