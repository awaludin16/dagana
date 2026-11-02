import { ArrowRight, UserRoundPlus } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'

import { useSession } from '@/auth/session-context'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { ApiError, api } from '@/lib/api'

export function RegisterPage() {
  const { startSession } = useSession()
  const navigate = useNavigate()
  const [passwordMismatch, setPasswordMismatch] = useState(false)
  const register = useMutation({
    mutationFn: api.register,
    onSuccess: ({ token, user }) => {
      startSession(token, user)
      navigate('/', { replace: true })
    },
  })
  const errors = register.error instanceof ApiError ? register.error.errors : {}

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const password = String(form.get('password'))
    const confirmation = String(form.get('password_confirmation'))

    if (password !== confirmation) {
      setPasswordMismatch(true)
      return
    }

    setPasswordMismatch(false)

    register.mutate({
      name: String(form.get('name')).trim(),
      email: String(form.get('email')).trim(),
      password,
      password_confirmation: confirmation,
    })
  }

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

      {register.isError ? (
        <p
          role="alert"
          className="mb-5 rounded-lg border border-destructive/30 bg-destructive/5 px-3.5 py-3 text-sm text-destructive"
        >
          {register.error.message}
        </p>
      ) : null}

      <form className="space-y-4" onSubmit={submit}>
        <FormField
          name="name"
          label="Nama lengkap"
          type="text"
          autoComplete="name"
          placeholder="Nama Anda"
          required
          maxLength={255}
          error={errors.name?.[0]}
        />
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
          autoComplete="new-password"
          placeholder="Minimal 8 karakter"
          required
          minLength={8}
          error={errors.password?.[0]}
        />
        <FormField
          name="password_confirmation"
          label="Ulangi kata sandi"
          type="password"
          autoComplete="new-password"
          placeholder="Ketik ulang kata sandi"
          required
          minLength={8}
          error={passwordMismatch ? 'Kata sandi belum sama.' : errors.password_confirmation?.[0]}
        />
        <Button type="submit" className="mt-2 h-11 w-full gap-2" disabled={register.isPending}>
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
