import { Outlet, NavLink, Link } from 'react-router-dom'
import { Layout, House, ShoppingCart, ClipboardText, Warehouse, Coins, DotsThree } from '@phosphor-icons/react'

const navItems = [
  { to: '/', label: 'Dasbor', icon: House },
  { to: '/pos', label: 'POS', icon: ShoppingCart },
  { to: '/orders', label: 'Pesanan', icon: ClipboardText },
  { to: '/products', label: 'Produk', icon: Warehouse },
  { to: '/cash', label: 'Kas', icon: Coins },
  { to: '/more', label: 'Lainnya', icon: DotsThree },
] as const

export function RootLayout() {
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <Layout className="size-5" />
            <span className="text-sm font-semibold tracking-tight">Dagana</span>
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-screen-2xl flex-1 px-4 pb-20 pt-4 md:pb-4">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 z-50 w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
        <div className="mx-auto grid max-w-screen-2xl grid-cols-6">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-2 text-xs transition-colors ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`
              }
            >
              <Icon className="size-5" weight="duotone" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
      <aside className="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:z-50 md:w-64 md:flex-col md:border-r md:bg-background">
        <div className="flex h-14 items-center border-b px-4">
          <Link to="/" className="flex items-center gap-2">
            <Layout className="size-5" />
            <span className="text-sm font-semibold tracking-tight">Dagana</span>
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                }`
              }
            >
              <Icon className="size-5" weight="duotone" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="hidden md:block md:pl-64" />
    </div>
  )
}
