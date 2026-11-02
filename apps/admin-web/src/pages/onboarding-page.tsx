import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Store } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'

import { useSession } from '@/auth/session-context'
import { FormField } from '@/components/form-field'
import { ErrorState, LoadingState } from '@/components/page-feedback'
import { Button } from '@/components/ui/button'
import { ApiError, api } from '@/lib/api'

export function OnboardingPage() {
  const { token } = useSession()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [clientError, setClientError] = useState<string | null>(null)
  const outlets = useQuery({
    queryKey: ['outlets', token],
    queryFn: () => api.outlets(token!),
    enabled: Boolean(token),
  })
  const createBusiness = useMutation({
    mutationFn: (input: Parameters<typeof api.createBusiness>[1]) =>
      api.createBusiness(token!, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['outlets', token] })
      navigate('/business', { replace: true })
    },
  })

  useEffect(() => {
    if (outlets.data?.length) navigate('/business', { replace: true })
  }, [outlets.data, navigate])

  if (outlets.isPending) return <LoadingState label="Menyiapkan onboarding..." />
  if (outlets.isError) {
    return (
      <ErrorState
        message="Status Business belum dapat diperiksa. Coba muat ulang sebelum melanjutkan."
        onRetry={() => void outlets.refetch()}
      />
    )
  }
  if (outlets.data.length) return <Navigate to="/business" replace />

  const errors = createBusiness.error instanceof ApiError ? createBusiness.error.errors : {}

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const value = (key: string) => String(form.get(key) ?? '').trim()
    const businessName = value('business.name')
    const outletName = value('outlet.name')

    if (!businessName || !outletName) {
      setClientError('Nama Business dan outlet wajib diisi.')
      return
    }

    setClientError(null)
    createBusiness.mutate({
      business: {
        name: businessName,
        phone: value('business.phone'),
        address: value('business.address'),
      },
      outlet: {
        name: outletName,
        phone: value('outlet.phone'),
        address: value('outlet.address'),
      },
    })
  }

  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Langkah 1 dari 1</p>
          <h1 className="mt-2 text-page-title tracking-tight">Siapkan bisnis Anda</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Business dan outlet pertama dibuat bersama. Anda dapat mulai mengelola operasional
            setelah ini.
          </p>
        </div>
        <span className="hidden size-12 shrink-0 place-items-center rounded-lg bg-dagana-primary-soft text-dagana-primary sm:grid">
          <Store aria-hidden="true" className="size-5" />
        </span>
      </div>

      {clientError || createBusiness.isError ? (
        <p
          role="alert"
          className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {clientError ?? createBusiness.error?.message}
        </p>
      ) : null}

      <form onSubmit={submit} className="space-y-6">
        <fieldset className="grid gap-5 rounded-lg border bg-card p-5 sm:grid-cols-2 sm:p-7">
          <legend className="px-2 text-lg font-semibold">Informasi Business</legend>
          <FormField
            name="business.name"
            label="Nama Business"
            placeholder="Contoh: Kedai Pagi"
            required
            maxLength={255}
            containerClassName="sm:col-span-2"
            error={errors['business.name']?.[0]}
          />
          <FormField
            name="business.phone"
            label="Nomor telepon (opsional)"
            type="tel"
            autoComplete="tel"
            placeholder="08xxxxxxxxxx"
            maxLength={30}
            error={errors['business.phone']?.[0]}
          />
          <FormField
            name="business.address"
            label="Alamat (opsional)"
            placeholder="Alamat Business"
            maxLength={1000}
            error={errors['business.address']?.[0]}
          />
        </fieldset>

        <fieldset className="grid gap-5 rounded-lg border bg-card p-5 sm:grid-cols-2 sm:p-7">
          <legend className="px-2 text-lg font-semibold">Outlet pertama</legend>
          <FormField
            name="outlet.name"
            label="Nama outlet"
            placeholder="Contoh: Outlet Utama"
            required
            maxLength={255}
            containerClassName="sm:col-span-2"
            error={errors['outlet.name']?.[0]}
          />
          <FormField
            name="outlet.phone"
            label="Nomor telepon (opsional)"
            type="tel"
            autoComplete="tel"
            placeholder="08xxxxxxxxxx"
            maxLength={30}
            error={errors['outlet.phone']?.[0]}
          />
          <FormField
            name="outlet.address"
            label="Alamat (opsional)"
            placeholder="Alamat outlet"
            maxLength={1000}
            error={errors['outlet.address']?.[0]}
          />
        </fieldset>

        <div className="flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <Link
            to="/profile"
            className="py-2 text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline sm:text-left"
          >
            Kembali ke profil
          </Link>
          <Button type="submit" className="h-11 gap-2 px-5" disabled={createBusiness.isPending}>
            {createBusiness.isPending ? 'Menyimpan Business...' : 'Simpan dan lanjutkan'}
            {!createBusiness.isPending ? (
              <ArrowRight aria-hidden="true" className="size-4" />
            ) : null}
          </Button>
        </div>
      </form>
    </section>
  )
}
