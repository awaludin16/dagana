import {
  Building2,
  CircleUserRound,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Store,
  Users,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'

import { useSession } from '@/auth/session-context'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/business', label: 'Business', icon: Building2 },
  { to: '/members', label: 'Anggota', icon: Users },
  { to: '/profile', label: 'Profil', icon: CircleUserRound },
]

export function AppLayout() {
  const { token, user, endSession } = useSession()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

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

  const closeMobile = () => setMobileOpen(false)

  return (
    <div className="min-h-svh bg-muted/30 text-foreground">
      <a
        href="#main"
        className="sr-only rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
      >
        Lewati ke konten utama
      </a>

      <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b bg-white px-4 backdrop-blur supports-[backdrop-filter]:bg-white/95 lg:hidden">
        <Link
          to="/"
          onClick={closeMobile}
          aria-label="Beranda Dagana"
          className="inline-flex min-h-11 items-center gap-2.5 rounded-sm text-base font-semibold tracking-tight"
        >
          <span className="grid size-9 place-items-center rounded-lg bg-dagana-amber text-dagana-amber-foreground">
            <Store aria-hidden="true" className="size-4.5" />
          </span>
          dagana
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={mobileOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
          aria-expanded={mobileOpen}
          aria-controls="app-sidebar"
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? (
            <X aria-hidden="true" className="size-5" />
          ) : (
            <Menu aria-hidden="true" className="size-5" />
          )}
        </Button>
      </header>

      <div
        aria-hidden="true"
        onClick={closeMobile}
        className={cn(
          'fixed inset-0 z-30 bg-foreground/40 backdrop-blur-sm transition-opacity duration-200 lg:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      <aside
        id="app-sidebar"
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-card transition-[transform,width] duration-200 lg:translate-x-0',
          mobileOpen ? 'visible translate-x-0' : 'invisible -translate-x-full lg:visible',
          collapsed ? 'lg:w-[4.75rem]' : 'lg:w-64',
        )}
      >
        <div className="flex min-h-16 items-center justify-between gap-2 border-b px-4">
          <Link
            to="/"
            onClick={closeMobile}
            className="inline-flex min-h-11 items-center gap-2.5 rounded-sm text-base font-semibold tracking-tight"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-dagana-amber text-dagana-amber-foreground">
              <Store aria-hidden="true" className="size-4.5" />
            </span>
            <span className={cn('whitespace-nowrap', collapsed && 'lg:hidden')}>dagana</span>
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden lg:inline-flex"
            aria-label={collapsed ? 'Lebarkan sidebar' : 'Ciutkan sidebar'}
            aria-pressed={collapsed}
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? (
              <PanelLeftOpen aria-hidden="true" className="size-5" />
            ) : (
              <PanelLeftClose aria-hidden="true" className="size-5" />
            )}
          </Button>
        </div>

        <nav aria-label="Navigasi utama" className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={closeMobile}
              className={({ isActive }) =>
                cn(
                  'flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition',
                  isActive
                    ? 'bg-dagana-primary-soft text-dagana-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              <Icon aria-hidden="true" className="size-5 shrink-0" />
              <span className={cn('whitespace-nowrap', collapsed && 'lg:sr-only')}>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t p-3">
          <div
            className={cn(
              'mb-2 rounded-lg bg-muted/60 px-3 py-2',
              collapsed ? 'lg:hidden' : undefined,
            )}
          >
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            className={cn(
              'w-full justify-start gap-3 px-3',
              collapsed && 'lg:justify-center lg:px-0',
            )}
            onClick={handleLogout}
            aria-label="Keluar"
          >
            <LogOut aria-hidden="true" className="size-5 shrink-0" />
            <span className={cn(collapsed && 'lg:sr-only')}>Keluar</span>
          </Button>
        </div>
      </aside>

      <div
        className={cn(
          'transition-[padding] duration-200 lg:pl-64',
          collapsed ? 'lg:pl-[4.75rem]' : undefined,
        )}
      >
        <main id="main" className="mx-auto w-full max-w-6xl p-4 sm:px-4 sm:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
