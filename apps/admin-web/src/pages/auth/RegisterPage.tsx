import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { ArrowRight, LoaderCircle, Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'

import { useSession } from '@/auth/SessionContext'
import { FormField } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/Logo'
import { useState } from 'react'
import { api } from '@/lib/api'
import { apiErrorMessage, applyApiErrors, getFieldError, hasFieldErrors } from '@/lib/form-errors'
import { registerSchema, type RegisterFormValues } from '@/lib/validation'

export function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false)
  const { startSession } = useSession()
  const navigate = useNavigate()
  const {
    register: registerField,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', password_confirmation: '' },
    mode: 'onBlur',
  })

  const register = useMutation({
    mutationFn: api.register,
    onSuccess: (profile) => {
      startSession(profile)
      navigate('/dashboard', { replace: true })
    },
  })

  const submit = handleSubmit((values) => {
    register.mutate(values, {
      onError: (error) => {
        applyApiErrors(error, setError)
      },
    })
  })

  return (
    <section aria-labelledby="register-title" className="rounded-lg border bg-card p-6 sm:p-9">
      <BrandLogo mode="icon" className="mx-auto mb-8 mt-2 h-10 w-auto" />
      <div className="mb-7 space-y-2">
        <h1 id="register-title" className="text-page-title tracking-tight mb-0 text-foreground">
          Getting Started
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Create an account to start using Dagana.
        </p>
      </div>

      {register.isError && !hasFieldErrors(register.error) ? (
        <p
          role="alert"
          className="mb-5 rounded-lg border border-destructive/30 bg-destructive/5 px-3.5 py-3 text-sm text-destructive"
        >
          {apiErrorMessage(
            register.error,
            'Pendaftaran belum berhasil. Periksa kembali data Anda.',
          )}
        </p>
      ) : null}

      <form className="space-y-4" onSubmit={submit} noValidate aria-busy={register.isPending}>
        <FormField
          {...registerField('name')}
          label="Nama lengkap"
          type="text"
          autoComplete="name"
          placeholder="Nama Anda"
          required
          maxLength={255}
          disabled={register.isPending}
          error={getFieldError(errors, 'name')}
        />
        <FormField
          {...registerField('email')}
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="nama@bisnis.id"
          required
          maxLength={255}
          disabled={register.isPending}
          error={getFieldError(errors, 'email')}
        />
        <div className="flex flex-col gap-1 mb-6 relative">
          <FormField
            {...registerField('password')}
            label="Kata sandi"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Minimal 8 karakter"
            required
            minLength={8}
            disabled={register.isPending}
            hint="Gunakan minimal 8 karakter."
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
        </div>
        <div className="flex flex-col gap-1 mb-6 relative">
          <FormField
            {...registerField('password_confirmation')}
            label="Ulangi kata sandi"
            type={showPasswordConfirmation ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Ketik ulang kata sandi"
            required
            minLength={8}
            disabled={register.isPending}
            error={getFieldError(errors, 'password_confirmation')}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-6 z-10 rounded-full p-1 text-muted-foreground hover:bg-transparent hover:text-foreground"
            onClick={() => setShowPasswordConfirmation((prev) => !prev)}
          >
            {showPasswordConfirmation ? (
              <EyeOff aria-hidden="true" className="size-5" />
            ) : (
              <Eye aria-hidden="true" className="size-5" />
            )}
          </Button>
        </div>
        <Button type="submit" className="mt-2 h-11 w-full gap-2" disabled={register.isPending}>
          {register.isPending ? (
            <LoaderCircle
              aria-hidden="true"
              className="size-4 animate-spin motion-reduce:animate-none"
            />
          ) : null}
          {register.isPending ? 'Membuat akun...' : 'Buat akun'}
          {!register.isPending ? <ArrowRight aria-hidden="true" className="size-4" /> : null}
        </Button>
      </form>

      <p className="mt-10 text-center text-sm text-muted-foreground">
        Sudah punya akun?{' '}
        <Link
          to="/login"
          className="font-semibold text-foreground underline-offset-4 hover:underline"
        >
          Masuk
        </Link>
      </p>
    </section>
  )
}
