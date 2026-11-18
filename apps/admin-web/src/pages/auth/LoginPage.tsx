import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { ArrowRight, LoaderCircle, Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router'
import { BrandLogo } from '@/components/Logo'

import { useSession } from '@/auth/SessionContext'
import { useState } from 'react'
import { FormField } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { apiErrorMessage, applyApiErrors, getFieldError, hasFieldErrors } from '@/lib/form-errors'
import { loginSchema, type LoginFormValues } from '@/lib/validation'

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)

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
      <BrandLogo mode="icon" className="mx-auto mb-8 mt-2 h-10 w-auto" />
      <div className="mb-7 space-y-2">
        <h1 id="login-title" className="text-page-title tracking-tight mb-0 text-foreground">
          Welcome Back!
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Please enter your details to sign in to your account.
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
        <div className="flex flex-col gap-1 mb-6 relative">
          <FormField
            {...register('password')}
            label="Kata sandi"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Masukkan kata sandi"
            containerClassName="mb-1"
            required
            disabled={login.isPending}
            error={getFieldError(errors, 'password')}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-6 z-10 rounded-full p-1 text-muted-foreground hover:bg-transparent hover:text-foreground"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? (
              <EyeOff aria-hidden="true" className="size-5" />
            ) : (
              <Eye aria-hidden="true" className="size-5" />
            )}
          </Button>
          <Link
            to="/forgot-password"
            className="self-end w-fit text-sm text-foreground underline-offset-4 hover:underline"
          >
            Lupa kata sandi?
          </Link>
        </div>
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

      <p className="mt-10 text-center text-sm text-muted-foreground">
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
