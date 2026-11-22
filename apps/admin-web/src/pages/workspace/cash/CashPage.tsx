import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { useAccess } from '@/auth/useAccess'
import { ErrorState, LoadingState } from '@/components/PageFeedback'
import { api } from '@/lib/api'
import { apiErrorMessage } from '@/lib/form-errors'

import { ActiveSessionCard } from './ActiveSessionCard'
import { ClosedSessionItem } from './ClosedSessionItem'
import { OpenSessionForm } from './OpenSessionForm'

export function CashPage() {
  const access = useAccess()
  const queryClient = useQueryClient()
  const outlets = access.membership?.outlets ?? []

  const [outletFilter, setOutletFilter] = useState('')
  const [openError, setOpenError] = useState<string | null>(null)

  const openSessions = useQuery({
    queryKey: ['cash-sessions', 'open', outletFilter],
    queryFn: () =>
      api.cashSessions({
        status: 'OPEN',
        outlet_id: outletFilter ? Number(outletFilter) : undefined,
        per_page: 50,
      }),
  })

  const closedSessions = useQuery({
    queryKey: ['cash-sessions', 'closed', outletFilter],
    queryFn: () =>
      api.cashSessions({
        status: 'CLOSED',
        outlet_id: outletFilter ? Number(outletFilter) : undefined,
        per_page: 20,
      }),
  })

  function refreshSessions() {
    void queryClient.invalidateQueries({ queryKey: ['cash-sessions'] })
  }

  if (openSessions.isPending || closedSessions.isPending) {
    return <LoadingState label="Memuat status kas..." />
  }

  if (openSessions.isError) {
    return (
      <ErrorState
        message={apiErrorMessage(
          openSessions.error,
          'Status kas belum dapat dimuat. Periksa koneksi lalu coba lagi.',
        )}
        onRetry={() => void openSessions.refetch()}
      />
    )
  }

  if (closedSessions.isError) {
    return (
      <ErrorState
        message={apiErrorMessage(
          closedSessions.error,
          'Riwayat kas belum dapat dimuat. Periksa koneksi lalu coba lagi.',
        )}
        onRetry={() => void closedSessions.refetch()}
      />
    )
  }

  const open = openSessions.data.data

  return (
    <section className="space-y-6">
      <header className="space-y-2 border-b pb-6">
        <p className="text-sm font-medium text-primary">Operasional</p>
        <h1 className="text-page-title tracking-tight">Kas</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Buka, pantau, dan tutup Cash Session. Expected cash, variance, dan saldo selalu dihitung
          server.
        </p>
      </header>

      {outlets.length > 1 && (
        <div className="max-w-xs">
          <label htmlFor="cash-outlet-filter" className="text-sm font-medium">
            Filter outlet
          </label>
          <select
            id="cash-outlet-filter"
            value={outletFilter}
            onChange={(event) => setOutletFilter(event.target.value)}
            className="mt-1.5 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none transition focus-visible:ring-[3px] focus-visible:ring-ring/40"
          >
            <option value="">Semua outlet</option>
            {outlets.map((outlet) => (
              <option key={outlet.id} value={outlet.id}>
                {outlet.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {openError && (
        <div
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm"
          role="alert"
        >
          {openError}
        </div>
      )}

      {access.can('cash.open') && (
        <OpenSessionForm
          outlets={outlets}
          defaultOutletId={outletFilter ? Number(outletFilter) : outlets[0]?.id}
          onOpened={refreshSessions}
          onError={(message) => {
            setOpenError(message)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
      )}

      <div className="space-y-3">
        <h2 className="text-section-title">Session aktif</h2>
        {open.length === 0 ? (
          <div
            className="rounded-xl border bg-card p-6 text-sm text-muted-foreground"
            role="status"
          >
            Belum ada Cash Session aktif{outletFilter ? ' untuk outlet ini' : ''}. Buka session
            untuk mulai mencatat arus kas.
          </div>
        ) : (
          open.map((session) => (
            <ActiveSessionCard
              key={session.id}
              session={session}
              outletName={outlets.find((outlet) => outlet.id === session.outlet_id)?.name}
              onChanged={refreshSessions}
            />
          ))
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-section-title">Riwayat & rekonsiliasi</h2>
        {closedSessions.data.data.length === 0 ? (
          <div
            className="rounded-xl border bg-card p-6 text-sm text-muted-foreground"
            role="status"
          >
            Belum ada session yang ditutup.
          </div>
        ) : (
          <ul className="space-y-3" aria-label="Daftar session kas yang ditutup">
            {closedSessions.data.data.map((session) => (
              <ClosedSessionItem
                key={session.id}
                session={session}
                outletName={outlets.find((outlet) => outlet.id === session.outlet_id)?.name}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
