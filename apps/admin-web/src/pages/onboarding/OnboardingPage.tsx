import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { ArrowRight, LoaderCircle, Store } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router'

import { useAccess } from '@/auth/useAccess'
import { useSession } from '@/auth/SessionContext'
import { AddressFields } from '@/components/AddressFields'
import { FormField } from '@/components/FormField'
import { ErrorState, LoadingState } from '@/components/PageFeedback'
import { Button } from '@/components/ui/button'
import { normalizeAddress } from '@/lib/address'
import { api } from '@/lib/api'
import { apiErrorMessage, applyApiErrors, getFieldError, hasFieldErrors } from '@/lib/form-errors'
import { onboardingSchema, type OnboardingFormValues } from '@/lib/validation'
import { emptyAddress } from '@/types'

export function OnboardingPage() {
  const { startSession } = useSession()
  const access = useAccess()
  const navigate = useNavigate()
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      business: { name: '' },
      outlet: { name: '', phone: '', address: { ...emptyAddress } },
    },
    mode: 'onBlur',
  })

  const createBusiness = useMutation({
    mutationFn: (input: Parameters<typeof api.createBusiness>[0]) => api.createBusiness(input),
    onSuccess: async () => {
      const profile = await api.profile()
      if (profile) startSession(profile)
      navigate('/outlets', { replace: true })
    },
  })

  if (access.isPending) return <LoadingState label="Menyiapkan onboarding..." />
  if (access.isError) {
    return (
      <ErrorState
        message="Status Business belum dapat diperiksa. Coba muat ulang sebelum melanjutkan."
        onRetry={() => void access.refetch()}
      />
    )
  }
  if (access.membership) return <Navigate to="/outlets" replace />

  const submit = handleSubmit((values) => {
    createBusiness.mutate(
      {
        business: values.business,
        outlet: {
          ...values.outlet,
          phone: values.outlet.phone?.trim() || null,
          address: normalizeAddress(values.outlet.address),
        },
      },
      {
        onError: (error) => {
          applyApiErrors(error, setError)
        },
      },
    )
  })

  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Langkah 1 dari 1</p>
          <h1 className="mt-2 text-page-title tracking-tight">Siapkan bisnis Anda</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Business cukup memiliki nama. Nomor telepon dan alamat diisi pada outlet pertama dan
            dapat diubah kapan saja.
          </p>
        </div>
        <span className="hidden size-12 shrink-0 place-items-center rounded-lg bg-dagana-primary-soft text-dagana-primary sm:grid">
          <Store aria-hidden="true" className="size-5" />
        </span>
      </div>

      {createBusiness.isError && !hasFieldErrors(createBusiness.error) ? (
        <p
          role="alert"
          className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {apiErrorMessage(
            createBusiness.error,
            'Business dan outlet belum dapat disimpan. Periksa kembali data Anda.',
          )}
        </p>
      ) : null}

      <form onSubmit={submit} noValidate aria-busy={createBusiness.isPending}>
        <div className="space-y-8 rounded-lg border bg-card p-5 sm:p-7">
          <div className="space-y-5">
            <h2 className="text-lg font-semibold">Informasi Business</h2>
            <FormField
              {...register('business.name')}
              id="onboarding-business-name"
              label="Nama Business"
              placeholder="Contoh: Kedai Pagi"
              required
              maxLength={255}
              disabled={createBusiness.isPending}
              error={getFieldError(errors, 'business.name')}
            />
          </div>

          <div className="space-y-5">
            <h2 className="text-lg font-semibold">Outlet pertama</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                {...register('outlet.name')}
                id="onboarding-outlet-name"
                label="Nama outlet"
                placeholder="Contoh: Outlet Utama"
                required
                maxLength={255}
                containerClassName="sm:col-span-2"
                disabled={createBusiness.isPending}
                error={getFieldError(errors, 'outlet.name')}
              />
              <FormField
                {...register('outlet.phone')}
                id="onboarding-outlet-phone"
                label="Nomor telepon (opsional)"
                type="tel"
                autoComplete="tel"
                placeholder="08xxxxxxxxxx"
                maxLength={30}
                disabled={createBusiness.isPending}
                error={getFieldError(errors, 'outlet.phone')}
              />
            </div>
            <Controller
              control={control}
              name="outlet.address"
              render={({ field }) => (
                <AddressFields
                  idPrefix="onboarding-address"
                  errorPrefix="outlet.address"
                  value={field.value}
                  errors={errors}
                  disabled={createBusiness.isPending}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <Link
            to="/profile"
            className="py-2 text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline sm:text-left"
          >
            Kembali ke profil
          </Link>
          <Button type="submit" className="h-11 gap-2 px-5" disabled={createBusiness.isPending}>
            {createBusiness.isPending ? (
              <LoaderCircle
                aria-hidden="true"
                className="size-4 animate-spin motion-reduce:animate-none"
              />
            ) : null}
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
