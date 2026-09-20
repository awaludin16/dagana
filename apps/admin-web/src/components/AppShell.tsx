import { useQuery } from '@tanstack/react-query'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { getActiveTenant, logout } from '../lib/auth'
import { api } from '../lib/api'

interface Me {
  user: { id: string; name: string; email: string }
  tenants: { id: string; name: string; slug: string }[]
  current_tenant: string | null
  permissions: string[]
}

const nav = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/products', label: 'Produk' },
]

export default function AppShell() {
  const navigate = useNavigate()
  const activeTenant = getActiveTenant()
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<{ data: Me }>('/auth/me').then((r) => r.data.data),
  })

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="fixed inset-y-0 left-0 w-60 bg-slate-900 text-slate-100 flex flex-col">
        <div className="px-5 py-4 border-b border-slate-800">
          <div className="font-bold text-lg">Dagana</div>
          <div className="text-xs text-slate-400">Admin Dashboard</div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm transition ${
                  isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-slate-800 text-xs text-slate-400">
          <div className="truncate">{me?.user.name}</div>
          <button onClick={handleLogout} className="mt-2 text-rose-300 hover:text-rose-200">
            Keluar
          </button>
        </div>
      </aside>
      <main className="ml-60 p-8">
        {activeTenant && (
          <div className="mb-4 text-xs text-slate-500">
            Tenant aktif: <span className="font-mono">{activeTenant}</span>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  )
}