import { ArrowUpRight, Check, Store } from 'lucide-react'
import { Link, Outlet } from 'react-router'

export function AuthLayout() {
  return (
    <div className="min-h-svh bg-muted/50 lg:grid lg:grid-cols-[minmax(22rem,0.9fr)_1.1fr]">
      <aside className="hidden min-h-svh flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex xl:p-14">
        <Link to="/login" className="inline-flex min-h-11 w-fit items-center gap-3 rounded-sm">
          <span className="grid size-10 place-items-center rounded-lg bg-dagana-amber text-dagana-amber-foreground">
            <Store aria-hidden="true" className="size-5" />
          </span>
          <span className="text-xl font-semibold tracking-tight">dagana</span>
        </Link>

        <div className="max-w-lg space-y-8">
          <div className="space-y-4">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary-foreground">
              Operasional F&B, lebih sederhana
            </p>
            <h2 className="text-display leading-tight tracking-tight">
              Mulai dari transaksi pertama Anda.
            </h2>
            <p className="max-w-md text-body-large leading-7 text-primary-foreground">
              Siapkan bisnis dan outlet dalam beberapa langkah. Menu dan operasional dapat
              dilanjutkan setelah Anda masuk.
            </p>
          </div>
          <ul className="space-y-4 text-sm text-primary-foreground">
            {[
              'Satu akun untuk satu Business',
              'Outlet pertama langsung siap',
              'Data bisnis tetap milik Anda',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="grid size-6 place-items-center rounded-full bg-dagana-primary-soft text-dagana-primary">
                  <Check aria-hidden="true" className="size-3.5" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-caption text-primary-foreground">
          Dagana · F&B Business Operating Platform
        </p>
      </aside>

      <main className="flex min-h-svh flex-col">
        <div className="flex h-16 items-center justify-between px-5 lg:hidden">
          <Link to="/login" className="inline-flex min-h-11 items-center gap-2 font-semibold">
            <span className="grid size-8 place-items-center rounded-lg bg-dagana-amber text-dagana-amber-foreground">
              <Store aria-hidden="true" className="size-4" />
            </span>
            dagana
          </Link>
          <span className="text-xs text-muted-foreground">Merchant</span>
        </div>
        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">
            <Outlet />
            <p className="mt-8 text-center text-xs text-muted-foreground">
              Butuh bantuan?{' '}
              <a
                className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-4 hover:underline"
                href="mailto:support@dagana.id"
              >
                Hubungi tim Dagana <ArrowUpRight aria-hidden="true" className="size-3" />
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
