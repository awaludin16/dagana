import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { ArrowRight, LoaderCircle, UserRoundPlus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'

import { useSession } from '@/auth/SessionContext'
import { FormField } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { apiErrorMessage, applyApiErrors, getFieldError, hasFieldErrors } from '@/lib/form-errors'
import { registerSchema, type RegisterFormValues } from '@/lib/validation'

export function RegisterPage() {
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
      <div className="mb-8 grid size-11 place-items-center rounded-lg bg-dagana-primary-soft text-dagana-primary">
        <UserRoundPlus aria-hidden="true" className="size-5" />
      </div>
      <div className="mb-7 space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Mulai perjalanan bisnis Anda</p>
        <h1 id="register-title" className="text-page-title tracking-tight">
          Buat akun Dagana
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Setelah mendaftar, Anda akan menyiapkan Business dan outlet pertama.
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
        <FormField
          {...registerField('password')}
          label="Kata sandi"
          type="password"
          autoComplete="new-password"
          placeholder="Minimal 8 karakter"
          required
          minLength={8}
          disabled={register.isPending}
          hint="Gunakan minimal 8 karakter."
          error={getFieldError(errors, 'password')}
        />
        <FormField
          {...registerField('password_confirmation')}
          label="Ulangi kata sandi"
          type="password"
          autoComplete="new-password"
          placeholder="Ketik ulang kata sandi"
          required
          minLength={8}
          disabled={register.isPending}
          error={getFieldError(errors, 'password_confirmation')}
        />
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

      <p className="mt-7 text-center text-sm text-muted-foreground">
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
