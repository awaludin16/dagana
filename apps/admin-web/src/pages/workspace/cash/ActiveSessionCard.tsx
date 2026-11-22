import { useState } from 'react'

import { useAccess } from '@/auth/useAccess'
import { Badge } from '@/components/ui/badge'
import { cashSessionStatusClass, cashSessionStatusLabel } from '@/lib/cash-format'
import { formatOrderDate, formatRupiah } from '@/lib/order-format'
import type { CashSession } from '@/types'

import { CloseSessionForm } from './CloseSessionForm'
import { MovementForm } from './MovementForm'
import { SessionLedger } from './SessionLedger'

export function ActiveSessionCard({
  session,
  outletName,
  onChanged,
}: {
  session: CashSession
  outletName?: string
  onChanged: () => void
}) {
  const access = useAccess()
  const [submitError, setSubmitError] = useState<string | null>(null)

  return (
    <article
      className="space-y-5 rounded-xl border bg-card p-4 sm:p-5"
      aria-label="Session kas aktif"
    >
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div className="space-y-1">
          <h3 className="text-section-title">Session #{session.id}</h3>
          <p className="text-sm text-muted-foreground">
            {outletName ?? `Outlet ${session.outlet_id}`} · Dibuka{' '}
            {formatOrderDate(session.opened_at)}
          </p>
        </div>
        <Badge className={cashSessionStatusClass(session.status)}>
          {cashSessionStatusLabel(session.status)}
        </Badge>
      </div>

      <dl className="grid gap-3 border-t pt-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Kas awal</dt>
          <dd className="mt-1 font-semibold tabular-nums">{formatRupiah(session.opening_cash)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Expected cash (server)</dt>
          <dd className="mt-1 font-semibold tabular-nums">{formatRupiah(session.expected_cash)}</dd>
        </div>
      </dl>

      {submitError && (
        <div
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm"
          role="alert"
        >
          {submitError}
        </div>
      )}

      <MovementForm session={session} onChanged={onChanged} onError={setSubmitError} />

      <SessionLedger session={session} />

      {access.can('cash.close') && (
        <CloseSessionForm session={session} onChanged={onChanged} onError={setSubmitError} />
      )}
    </article>
  )
}
