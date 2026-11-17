import { useMutation } from '@tanstack/react-query'
import { BadgeCheck, CircleX, LoaderCircle } from 'lucide-react'
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'

import { api } from '@/lib/api'

/**
 * Halaman tujuan tautan verifikasi email. Tanda tangan yang diberikan lewat
 * query diteruskan apa adanya ke endpoint API; tidak butuh sesi karena tanda
 * tangan adalah buktinya.
 */
export function VerifyEmailPage() {
  const [params] = useSearchParams()
  const id = params.get('id') ?? ''
  const hash = params.get('hash') ?? ''
  const expires = params.get('expires') ?? ''
  const signature = params.get('signature') ?? ''

  const verify = useMutation({
    mutationFn: () => api.verifyEmail(id, hash, expires, signature),
  })

  useEffect(() => {
    if (!id || !hash || !expires || !signature) return
    verify.mutate()
    // Verifikasi hanya boleh dijalankan sekali per tautan yang dibuka.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Pending mencakup sebelum dan selama panggilan API berjalan.
  if (!verify.isError && !verify.isSuccess) {
    return (
      <StatusCard title="Memverifikasi email..." body="Mohon tunggu sebentar.">
        <LoaderCircle
          aria-hidden="true"
          className="size-6 animate-spin text-dagana-primary motion-reduce:animate-none"
        />
      </StatusCard>
    )
  }

  if (verify.isError) {
    return (
      <StatusCard
        icon={<CircleX aria-hidden="true" className="size-6 text-destructive" />}
        title="Verifikasi belum berhasil"
        body="Tautan verifikasi tidak valid atau sudah kedaluwarsa. Minta tautan baru setelah masuk ke aplikasi."
      >
        <Link
          to="/login"
          className="inline-flex min-h-11 items-center rounded-sm font-medium text-dagana-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
        >
          Ke halaman masuk
        </Link>
      </StatusCard>
    )
  }

  return (
    <StatusCard
      icon={<BadgeCheck aria-hidden="true" className="size-6 text-dagana-primary" />}
      title="Email terverifikasi"
      body={verify.data?.message ?? 'Email berhasil diverifikasi. Silakan login untuk melanjutkan.'}
    >
      <Link
        to="/login"
        className="inline-flex min-h-11 items-center rounded-sm font-medium text-dagana-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
      >
        Masuk ke aplikasi
      </Link>
    </StatusCard>
  )
}

function StatusCard({
  icon,
  title,
  body,
  children,
}: {
  icon?: ReactNode
  title: string
  body: string
  children?: ReactNode
}) {
  return (
    <section
      aria-labelledby="verify-email-title"
      className="mx-auto mt-24 w-full max-w-md rounded-lg border bg-card p-6 text-center sm:p-9"
    >
      <div className="mb-6 grid place-items-center">
        {icon ?? <LoaderCircle aria-hidden="true" className="size-6 animate-spin motion-reduce:animate-none" />}
      </div>
      <h1 id="verify-email-title" className="text-page-title tracking-tight">
        {title}
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p>
      {children ? <div className="mt-6">{children}</div> : null}
    </section>
  )
}
