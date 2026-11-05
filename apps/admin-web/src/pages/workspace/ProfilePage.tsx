import { ArrowLeft, CircleUserRound, Mail } from 'lucide-react'
import { Link } from 'react-router'

import { useAccess } from '@/auth/useAccess'
import { ErrorState, LoadingState } from '@/components/PageFeedback'
import { Button } from '@/components/ui/button'

export function ProfilePage() {
  const profile = useAccess()

  if (profile.isPending) return <LoadingState label="Memuat profil..." />
  if (profile.isError) {
    return (
      <ErrorState
        message="Profil belum dapat dimuat. Periksa koneksi lalu coba lagi."
        onRetry={() => void profile.refetch()}
      />
    )
  }

  const user = profile.data

  if (!user) return null

  return (
    <section className="mx-auto max-w-2xl space-y-7">
      <header className="space-y-2">
        <Link
          to="/outlets"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Kembali ke Outlet
        </Link>
        <h1 className="pt-3 text-page-title tracking-tight">Profil pengguna</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Informasi akun yang digunakan untuk mengakses Dagana.
        </p>
      </header>

      <div className="rounded-lg border bg-card p-6 sm:p-8">
        <div className="mb-7 flex items-center gap-4 border-b pb-6">
          <span className="grid size-14 place-items-center rounded-2xl bg-muted text-foreground">
            <CircleUserRound aria-hidden="true" className="size-7" />
          </span>
          <div>
            <h2 className="text-card-title">{user.name}</h2>
            <p className="text-sm text-muted-foreground">Akun Dagana</p>
          </div>
        </div>
        <dl className="space-y-5">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Nama
            </dt>
            <dd className="mt-1.5 text-sm">{user.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Email
            </dt>
            <dd className="mt-1.5 inline-flex items-center gap-2 text-sm">
              <Mail aria-hidden="true" className="size-4 text-muted-foreground" />
              {user.email}
            </dd>
          </div>
        </dl>
      </div>
      <Button asChild variant="outline" className="min-h-11">
        <Link to="/outlets">Lihat pengaturan Outlet</Link>
      </Button>
    </section>
  )
}
