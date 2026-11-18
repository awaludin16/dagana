import { ArrowUpRight } from 'lucide-react'
import { Outlet } from 'react-router'

export function AuthLayout() {
  return (
    <main className="flex min-h-svh flex-col">
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-md">
          <Outlet />
          <p className="mt-16 mb-4 text-center text-xs text-muted-foreground">
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
  )
}
