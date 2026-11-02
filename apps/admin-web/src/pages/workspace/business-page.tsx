import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, MapPin } from 'lucide-react'
import { useState } from 'react'
import { Navigate } from 'react-router'

import { useSession } from '@/auth/session-context'
import { ErrorState, LoadingState } from '@/components/page-feedback'
import { SettingsForm, type SettingsValues } from '@/components/settings-form'
import { api } from '@/lib/api'

export function BusinessPage() {
  const { token } = useSession()
  const queryClient = useQueryClient()
  const [selectedOutletId, setSelectedOutletId] = useState<number | null>(null)
  const outlets = useQuery({
    queryKey: ['outlets', token],
    queryFn: () => api.outlets(token!),
    enabled: Boolean(token),
  })
  const selectedOutlet =
    outlets.data?.find((outlet) => outlet.id === selectedOutletId) ?? outlets.data?.[0]
  const business = useQuery({
    queryKey: ['business', token, selectedOutlet?.business_id],
    queryFn: () => api.business(token!, selectedOutlet!.business_id),
    enabled: Boolean(token && selectedOutlet),
  })

  if (outlets.isPending) return <LoadingState label="Memuat konteks Business..." />
  if (outlets.isError) {
    return (
      <ErrorState
        message="Outlet belum dapat dimuat. Periksa koneksi lalu coba lagi."
        onRetry={() => void outlets.refetch()}
      />
    )
  }
  if (!outlets.data.length) return <Navigate to="/onboarding" replace />
  if (business.isPending) return <LoadingState label="Memuat pengaturan Business..." />
  if (business.isError) {
    return (
      <ErrorState
        message="Pengaturan Business belum dapat dimuat. Coba lagi."
        onRetry={() => void business.refetch()}
      />
    )
  }
  const businessData = business.data

  async function saveBusiness(values: SettingsValues) {
    await api.updateBusiness(token!, businessData.id, values)
    await queryClient.invalidateQueries({ queryKey: ['business', token, businessData.id] })
  }

  async function saveOutlet(values: SettingsValues) {
    await api.updateOutlet(token!, selectedOutlet!.id, values)
    await queryClient.invalidateQueries({ queryKey: ['outlets', token] })
  }

  return (
    <section className="space-y-8">
      <header className="flex flex-col justify-between gap-5 border-b pb-7 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">Pengaturan</p>
          <h1 className="text-page-title tracking-tight">Business Anda</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Kelola informasi dasar Business dan outlet yang terhubung ke akun Anda.
          </p>
        </div>
        {outlets.data.length > 1 ? (
          <div className="min-w-56 space-y-1.5">
            <label htmlFor="active-outlet" className="text-sm font-medium">
              Outlet
            </label>
            <select
              id="active-outlet"
              value={selectedOutlet!.id}
              onChange={(event) => setSelectedOutletId(Number(event.target.value))}
              className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
            >
              {outlets.data.map((outlet) => (
                <option key={outlet.id} value={outlet.id}>
                  {outlet.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </header>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border bg-background px-4 py-3 text-sm">
        <span className="inline-flex items-center gap-2 font-medium">
          <Building2 aria-hidden="true" className="size-4 text-muted-foreground" />
          {businessData.name}
        </span>
        <span className="inline-flex items-center gap-2 text-muted-foreground">
          <MapPin aria-hidden="true" className="size-4" />
          {selectedOutlet!.name}
        </span>
        <span className="ml-auto rounded-full bg-dagana-success-container px-3 py-1 text-xs font-medium text-dagana-success">
          Business aktif
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SettingsForm
          key={`business-${businessData.id}`}
          title="Business"
          description="Informasi utama yang digunakan untuk mengenali bisnis Anda."
          values={businessData}
          onSave={saveBusiness}
        />
        <SettingsForm
          key={`outlet-${selectedOutlet!.id}`}
          title={`Outlet · ${selectedOutlet!.name}`}
          description="Informasi lokasi untuk outlet yang sedang dipilih."
          values={selectedOutlet!}
          onSave={saveOutlet}
        />
      </div>
    </section>
  )
}
