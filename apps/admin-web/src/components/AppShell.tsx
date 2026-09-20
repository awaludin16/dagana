import { LogOut } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Badge } from './ui/badge'
import { getActiveTenant, logout } from '../lib/auth'
import { useMe } from '../lib/me'
import { cn } from '../lib/utils'

const nav = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/products', label: 'Produk' },
  { to: '/categories', label: 'Kategori' },
  { to: '/inventory', label: 'Inventori' },
]

export default function AppShell() {
  const navigate = useNavigate()
  const activeTenant = getActiveTenant()
  const { data: me } = useMe()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 flex w-60 flex-col bg-sidebar text-sidebar-foreground">
        <div className="border-b border-sidebar-border px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-sidebar-accent text-sm font-bold text-sidebar-accent-foreground">
              D
            </span>
            <span className="text-lg font-bold text-white">Dagana</span>
          </div>
          <div className="mt-1 text-xs text-sidebar-muted">Admin Dashboard</div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'block rounded-lg px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-border/60 hover:text-white',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-sidebar-border px-5 py-4 text-xs text-sidebar-muted">
          <div className="truncate font-medium text-sidebar-foreground">{me?.user.name}</div>
          <div className="mt-0.5 truncate">{me?.user.email}</div>
          <button
            onClick={handleLogout}
            className="mt-3 inline-flex items-center gap-1.5 text-rose-300 transition-colors hover:text-rose-200"
          >
            <LogOut className="size-3.5" aria-hidden />
            Keluar
          </button>
        </div>
      </aside>

      <main className="ml-60 p-8">
        {activeTenant && (
          <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
            Tenant aktif
            <Badge variant="outline" className="font-mono">
              {activeTenant}
            </Badge>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  )
}