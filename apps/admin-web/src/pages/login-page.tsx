import { ArrowRight, KeyRound } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'

import { useSession } from '@/auth/session-context'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { ApiError, api } from '@/lib/api'

export function LoginPage() {
  const { startSession, message: sessionMessage } = useSession()
  const navigate = useNavigate()
  const location = useLocation()
  const routeNotice =
    typeof location.state === 'object' &&
    location.state !== null &&
    'notice' in location.state &&
    typeof location.state.notice === 'string'
      ? location.state.notice
      : null

  const login = useMutation({
    mutationFn: api.login,
    onSuccess: ({ token, user }) => {
      startSession(token, user)
      navigate('/', { replace: true })
    },
  })

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)

    login.mutate({
      email: String(form.get('email')).trim(),
      password: String(form.get('password')),
      device_name: 'dagana-admin-web',
    })
  }

  const errors = login.error instanceof ApiError ? login.error.errors : {}

  return (
    <section aria-labelledby="login-title" className="rounded-lg border bg-card p-6 sm:p-9">
      <div className="mb-8 grid size-11 place-items-center rounded-lg bg-dagana-primary-soft text-dagana-primary">
        <KeyRound aria-hidden="true" className="size-5" />
      </div>
      <div className="mb-7 space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Selamat datang kembali</p>
        <h1 id="login-title" className="text-page-title tracking-tight">
          Masuk ke Dagana
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Lanjutkan mengelola bisnis dan outlet Anda.
        </p>
      </div>

      {sessionMessage || routeNotice ? (
        <p role="status" className="mb-5 rounded-lg border bg-muted px-3.5 py-3 text-sm">
          {sessionMessage ?? routeNotice}
        </p>
      ) : null}
      {login.isError ? (
        <p
          role="alert"
          className="mb-5 rounded-lg border border-destructive/30 bg-destructive/5 px-3.5 py-3 text-sm text-destructive"
        >
          {login.error.message}
        </p>
      ) : null}

      <form className="space-y-5" onSubmit={submit}>
        <FormField
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="nama@bisnis.id"
          required
          maxLength={255}
          error={errors.email?.[0]}
        />
        <FormField
          name="password"
          label="Kata sandi"
          type="password"
          autoComplete="current-password"
          placeholder="Masukkan kata sandi"
          required
          error={errors.password?.[0]}
        />
        <Button type="submit" className="h-11 w-full gap-2" disabled={login.isPending}>
          {login.isPending ? 'Memeriksa akun...' : 'Masuk'}
          {!login.isPending ? <ArrowRight aria-hidden="true" className="size-4" /> : null}
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-muted-foreground">
        Belum punya akun?{' '}
        <Link
          to="/register"
          className="font-semibold text-foreground underline-offset-4 hover:underline"
        >
          Daftar
        </Link>
      </p>
    </section>
  )
}
