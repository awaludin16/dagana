import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'

import { useMutation } from '@tanstack/react-query'
import { MailCheck, LoaderCircle } from 'lucide-react'

import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { useSession } from '@/auth/SessionContext'
import { useAccess } from '@/auth/useAccess'
import { AccessDeniedState, ErrorState, LoadingState } from '@/components/PageFeedback'

export function RequireSession() {
  const { isAuthenticated, isPending, isError, refetch, user } = useSession()
  const location = useLocation()

  if (isPending) return <LoadingState label="Memeriksa sesi..." />

  if (isError) {
    return (
      <ErrorState
        message="Sesi belum dapat diperiksa. Periksa koneksi lalu coba lagi."
        onRetry={refetch}
      />
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  // Owner self-register wajib verifikasi email sebelum memakai aplikasi;
  // akun yang dibuat Owner otomatis terverifikasi (keputusan email 2026-11-18).
  if (user && user.email_verified_at === null) {
    return <VerifyEmailRequired />
  }

  return <Outlet />
}

function VerifyEmailRequired() {
  const { endSession } = useSession()

  const resend = useMutation({ mutationFn: api.resendVerification })

  function signOut() {
    void api.logout().finally(() => endSession('Anda telah keluar.'))
  }

  return (
    <main className="grid min-h-svh place-items-center bg-muted/50 px-4">
      <section
        aria-labelledby="verify-required-title"
        className="w-full max-w-md rounded-lg border bg-card p-6 text-center sm:p-9"
      >
        <div className="mb-6 grid size-11 place-items-center justify-self-center rounded-lg bg-dagana-primary-soft text-dagana-primary">
          <MailCheck aria-hidden="true" className="size-5" />
        </div>
        <h1 id="verify-required-title" className="text-page-title tracking-tight">
          Verifikasi email Anda
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Kami mengirim tautan verifikasi ke email Anda. Buka tautan tersebut untuk mulai
          menggunakan aplikasi. Jika belum terima, kirim ulang tautannya.
        </p>

        {resend.isError ? (
          <p role="alert" className="mt-5 rounded-lg border border-destructive/30 bg-destructive/5 px-3.5 py-3 text-sm text-destructive">
            Pengiriman ulang belum berhasil. Coba lagi sebentar.
          </p>
        ) : null}
        {resend.isSuccess && resend.data?.message ? (
          <p role="status" className="mt-5 rounded-lg border bg-muted px-3.5 py-3 text-sm">
            {resend.data.message}
          </p>
        ) : null}

        <div className="mt-6 grid gap-2">
          <Button type="button" onClick={() => resend.mutate()} disabled={resend.isPending}>
            {resend.isPending ? (
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />
            ) : null}
            {resend.isPending ? 'Mengirim...' : 'Kirim ulang tautan verifikasi'}
          </Button>
          <Button type="button" variant="outline" onClick={signOut} disabled={resend.isPending}>
            Keluar
          </Button>
        </div>
      </section>
    </main>
  )
}

export function RequirePermission({
  permission,
  children,
}: {
  permission: string
  children: ReactNode
}) {
  const access = useAccess()

  if (access.isPending) return <LoadingState label="Memeriksa hak akses..." />

  if (access.isError) {
    return (
      <ErrorState
        message="Hak akses belum dapat diperiksa. Periksa koneksi lalu coba lagi."
        onRetry={access.refetch}
      />
    )
  }

  if (!access.can(permission)) {
    return <AccessDeniedState message="Anda tidak memiliki izin untuk membuka halaman ini." />
  }

  return children
}

export function AnonymousOnly() {
  const { isAuthenticated, isPending } = useSession()

  if (isPending) return <LoadingState label="Memeriksa sesi..." />

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
