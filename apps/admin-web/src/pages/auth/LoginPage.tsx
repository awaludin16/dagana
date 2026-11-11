import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { ArrowRight, KeyRound, LoaderCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router'

import { useSession } from '@/auth/SessionContext'
import { FormField } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { apiErrorMessage, applyApiErrors, getFieldError, hasFieldErrors } from '@/lib/form-errors'
import { loginSchema, type LoginFormValues } from '@/lib/validation'

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

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onBlur',
  })

  const login = useMutation({
    mutationFn: api.login,
    onSuccess: (profile) => {
      startSession(profile)
      navigate('/dashboard', { replace: true })
    },
  })

  const submit = handleSubmit((values) => {
    login.mutate(values, {
      onError: (error) => {
        applyApiErrors(error, setError)
      },
    })
  })

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
      {login.isError && !hasFieldErrors(login.error) ? (
        <p
          role="alert"
          className="mb-5 rounded-lg border border-destructive/30 bg-destructive/5 px-3.5 py-3 text-sm text-destructive"
        >
          {apiErrorMessage(
            login.error,
            'Masuk belum berhasil. Periksa kembali email dan kata sandi.',
          )}
        </p>
      ) : null}

      <form className="space-y-5" onSubmit={submit} noValidate aria-busy={login.isPending}>
        <FormField
          {...register('email')}
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="nama@bisnis.id"
          required
          maxLength={255}
          disabled={login.isPending}
          error={getFieldError(errors, 'email')}
        />
        <FormField
          {...register('password')}
          label="Kata sandi"
          type="password"
          autoComplete="current-password"
          placeholder="Masukkan kata sandi"
          required
          disabled={login.isPending}
          error={getFieldError(errors, 'password')}
        />
        <Button type="submit" className="h-11 w-full gap-2" disabled={login.isPending}>
          {login.isPending ? (
            <LoaderCircle
              aria-hidden="true"
              className="size-4 animate-spin motion-reduce:animate-none"
            />
          ) : null}
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
