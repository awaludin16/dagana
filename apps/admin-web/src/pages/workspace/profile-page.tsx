import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, CircleUserRound, Mail } from 'lucide-react'
import { Link } from 'react-router'

import { useSession } from '@/auth/session-context'
import { ErrorState, LoadingState } from '@/components/page-feedback'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

export function ProfilePage() {
  const { token } = useSession()
  const profile = useQuery({
    queryKey: ['profile', token],
    queryFn: () => api.profile(token!),
    enabled: Boolean(token),
  })

  if (profile.isPending) return <LoadingState label="Memuat profil..." />
  if (profile.isError) {
    return (
      <ErrorState
        message="Profil belum dapat dimuat. Periksa koneksi lalu coba lagi."
        onRetry={() => void profile.refetch()}
      />
    )
  }

  return (
    <section className="mx-auto max-w-2xl space-y-7">
      <header className="space-y-2">
        <Link
          to="/business"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Kembali ke Business
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
            <h2 className="text-card-title">{profile.data.name}</h2>
            <p className="text-sm text-muted-foreground">Akun Dagana</p>
          </div>
        </div>
        <dl className="space-y-5">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Nama
            </dt>
            <dd className="mt-1.5 text-sm">{profile.data.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Email
            </dt>
            <dd className="mt-1.5 inline-flex items-center gap-2 text-sm">
              <Mail aria-hidden="true" className="size-4 text-muted-foreground" />
              {profile.data.email}
            </dd>
          </div>
        </dl>
      </div>
      <Button asChild variant="outline" className="min-h-11">
        <Link to="/business">Lihat pengaturan Business</Link>
      </Button>
    </section>
  )
}
