import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { KeyRound, LoaderCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'

import { FormField } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { apiErrorMessage, applyApiErrors, getFieldError, hasFieldErrors } from '@/lib/form-errors'
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/lib/validation'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const email = params.get('email') ?? ''
  const token = params.get('token') ?? ''

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', password_confirmation: '' },
    mode: 'onBlur',
  })

  const reset = useMutation({
    mutationFn: api.resetPassword,
    onSuccess: () => {
      navigate('/login', {
        replace: true,
        state: { notice: 'Kata sandi berhasil diperbarui. Silakan masuk dengan kata sandi baru.' },
      })
    },
  })

  const submit = handleSubmit((values) => {
    reset.mutate(
      { email, token, password: values.password },
      {
        onError: (error) => {
          applyApiErrors(error, setError)
        },
      },
    )
  })

  if (!email || !token) {
    // Tautan dari email selalu membawa token & email; tanpa keduanya halaman
    // tidak bermakna, arahkan untuk meminta tautan baru.
    return <Navigate to="/forgot-password" replace />
  }

  return (
    <section aria-labelledby="reset-password-title" className="rounded-lg border bg-card p-6 sm:p-9">
      <div className="mb-8 grid size-11 place-items-center rounded-lg bg-dagana-primary-soft text-dagana-primary">
        <KeyRound aria-hidden="true" className="size-5" />
      </div>
      <div className="mb-7 space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Atur ulang kata sandi</p>
        <h1 id="reset-password-title" className="text-page-title tracking-tight">
          Buat kata sandi baru
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Kata sandi baru berlaku untuk akun <span className="font-medium">{email}</span>. Setelah
          disimpan, semua sesi lama akan keluar.
        </p>
      </div>

      {reset.isError && !hasFieldErrors(reset.error) ? (
        <p
          role="alert"
          className="mb-5 rounded-lg border border-destructive/30 bg-destructive/5 px-3.5 py-3 text-sm text-destructive"
        >
          {apiErrorMessage(reset.error, 'Pengaturan ulang belum berhasil. Minta tautan baru jika tautan sudah kedaluwarsa.')}
        </p>
      ) : null}

      <form className="space-y-5" onSubmit={submit} noValidate aria-busy={reset.isPending}>
        <FormField
          {...register('password')}
          label="Kata sandi baru"
          type="password"
          autoComplete="new-password"
          placeholder="Minimal 8 karakter"
          required
          disabled={reset.isPending}
          error={getFieldError(errors, 'password')}
        />
        <FormField
          {...register('password_confirmation')}
          label="Ulangi kata sandi baru"
          type="password"
          autoComplete="new-password"
          placeholder="Ulangi kata sandi"
          required
          disabled={reset.isPending}
          error={getFieldError(errors, 'password_confirmation')}
        />
        <Button type="submit" className="h-11 w-full" disabled={reset.isPending}>
          {reset.isPending ? (
            <LoaderCircle
              aria-hidden="true"
              className="size-4 animate-spin motion-reduce:animate-none"
            />
          ) : null}
          {reset.isPending ? 'Menyimpan...' : 'Simpan kata sandi baru'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        <Link
          to="/forgot-password"
          className="min-h-11 rounded-sm font-medium text-dagana-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
        >
          Tautan kedaluwarsa? Minta tautan baru
        </Link>
      </p>
    </section>
  )
}
