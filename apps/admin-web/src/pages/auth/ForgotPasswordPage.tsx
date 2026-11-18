import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { ArrowRight, LoaderCircle, Mail } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'

import { FormField } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { apiErrorMessage, applyApiErrors, getFieldError, hasFieldErrors } from '@/lib/form-errors'
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/lib/validation'

export function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
    mode: 'onBlur',
  })

  const forgot = useMutation({
    mutationFn: (values: ForgotPasswordFormValues) =>
      (
        api as unknown as {
          forgotPassword: (input: ForgotPasswordFormValues) => Promise<unknown>
        }
      ).forgotPassword(values),
  })

  const submit = handleSubmit((values) => {
    forgot.mutate(values, {
      onError: (error) => {
        applyApiErrors(error, setError)
      },
    })
  })

  return (
    <section
      aria-labelledby="forgot-password-title"
      className="rounded-lg border bg-card p-6 sm:p-9"
    >
      <div className="mb-8 grid size-11 place-items-center rounded-lg bg-dagana-primary-soft text-dagana-primary">
        <Mail aria-hidden="true" className="size-5" />
      </div>
      <div className="mb-7 space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Lupa kata sandi</p>
        <h1 id="forgot-password-title" className="text-page-title tracking-tight">
          Atur ulang kata sandi
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Masukkan email yang terdaftar, kami akan mengirim tautan atur ulang kata sandi.
        </p>
      </div>

      {forgot.isError && !hasFieldErrors(forgot.error) ? (
        <p
          role="alert"
          className="mb-5 rounded-lg border border-destructive/30 bg-destructive/5 px-3.5 py-3 text-sm text-destructive"
        >
          {apiErrorMessage(forgot.error, 'Permintaan belum berhasil. Coba lagi sebentar.')}
        </p>
      ) : null}

      {forgot.isSuccess ? (
        <p role="status" className="mb-5 rounded-lg border bg-muted px-3.5 py-3 text-sm">
          Jika email Anda terdaftar, tautan atur ulang kata sandi telah dikirim. Periksa kotak masuk
          dan folder spam.
        </p>
      ) : (
        <form className="space-y-5" onSubmit={submit} noValidate aria-busy={forgot.isPending}>
          <FormField
            {...register('email')}
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="nama@bisnis.id"
            required
            maxLength={255}
            disabled={forgot.isPending}
            error={getFieldError(errors, 'email')}
          />
          <Button type="submit" className="h-11 w-full gap-2" disabled={forgot.isPending}>
            {forgot.isPending ? (
              <LoaderCircle
                aria-hidden="true"
                className="size-4 animate-spin motion-reduce:animate-none"
              />
            ) : null}
            {forgot.isPending ? 'Mengirim...' : 'Kirim tautan atur ulang'}
            {!forgot.isPending ? <ArrowRight aria-hidden="true" className="size-4" /> : null}
          </Button>
        </form>
      )}

      <p className="mt-6 text-sm text-muted-foreground">
        <Link
          to="/login"
          className="min-h-11 rounded-sm font-medium text-dagana-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
        >
          Kembali ke halaman masuk
        </Link>
      </p>
    </section>
  )
}
