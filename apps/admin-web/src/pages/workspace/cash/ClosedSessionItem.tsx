import { Badge } from '@/components/ui/badge'
import {
  cashSessionStatusClass,
  cashSessionStatusLabel,
  formatSignedRupiah,
  varianceClass,
  varianceLabel,
} from '@/lib/cash-format'
import { formatOrderDate, formatRupiah } from '@/lib/order-format'
import type { CashSession } from '@/types'

export function ClosedSessionItem({
  session,
  outletName,
}: {
  session: CashSession
  outletName?: string
}) {
  const variance = session.variance ?? 0

  return (
    <li className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div className="space-y-1">
          <h3 className="text-section-title">Session #{session.id}</h3>
          <p className="text-sm text-muted-foreground">
            {outletName ?? `Outlet ${session.outlet_id}`} · Ditutup{' '}
            {formatOrderDate(session.closed_at)}
          </p>
        </div>
        <Badge className={cashSessionStatusClass(session.status)}>
          {cashSessionStatusLabel(session.status)}
        </Badge>
      </div>

      <dl className="grid gap-3 border-t pt-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-muted-foreground">Kas awal</dt>
          <dd className="mt-1 font-medium tabular-nums">{formatRupiah(session.opening_cash)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Expected cash</dt>
          <dd className="mt-1 font-medium tabular-nums">{formatRupiah(session.expected_cash)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Actual cash</dt>
          <dd className="mt-1 font-medium tabular-nums">
            {session.actual_cash === null ? 'Tidak tersedia' : formatRupiah(session.actual_cash)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Variance ({varianceLabel(variance)})</dt>
          <dd className={`mt-1 font-semibold tabular-nums ${varianceClass(variance)}`}>
            {formatSignedRupiah(variance)}
          </dd>
        </div>
      </dl>

      {session.variance_note && (
        <p className="border-t pt-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Catatan operator:</span>{' '}
          {session.variance_note}
        </p>
      )}
    </li>
  )
}
