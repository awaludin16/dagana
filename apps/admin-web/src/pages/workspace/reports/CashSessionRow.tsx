import { Badge } from '@/components/ui/badge'
import {
  cashSessionStatusClass,
  cashSessionStatusLabel,
  formatSignedRupiah,
  movementTypeLabel,
  varianceClass,
  varianceLabel,
} from '@/lib/cash-format'
import { formatOrderDate, formatRupiah } from '@/lib/order-format'
import type { ReportCashRow } from '@/types'

export function CashSessionRow({
  session,
  outletName,
}: {
  session: ReportCashRow
  outletName?: string
}) {
  const variance = session.variance ?? 0

  return (
    <li className="space-y-3 rounded-xl border bg-card p-4">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold">
            Session #{session.id} · {outletName ?? `Outlet ${session.outlet_id}`}
          </h3>
          <p className="text-xs text-muted-foreground">
            Dibuka {session.opened_at ? formatOrderDate(session.opened_at) : '—'}
          </p>
        </div>
        <Badge className={cashSessionStatusClass(session.status)}>
          {cashSessionStatusLabel(session.status)}
        </Badge>
      </div>

      <dl className="grid gap-3 border-t pt-3 text-sm sm:grid-cols-3 lg:grid-cols-5">
        <div>
          <dt className="text-muted-foreground">Kas awal</dt>
          <dd className="mt-1 font-medium tabular-nums">{formatRupiah(session.opening_cash)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Arus kas</dt>
          <dd className="mt-1 font-medium tabular-nums">
            {formatSignedRupiah(session.net_movement)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Expected cash</dt>
          <dd className="mt-1 font-medium tabular-nums">{formatRupiah(session.expected_cash)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Actual cash</dt>
          <dd className="mt-1 font-medium tabular-nums">
            {session.actual_cash === null ? 'Belum ditutup' : formatRupiah(session.actual_cash)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Variance ({varianceLabel(variance)})</dt>
          <dd className={`mt-1 font-semibold tabular-nums ${varianceClass(variance)}`}>
            {formatSignedRupiah(variance)}
          </dd>
        </div>
      </dl>

      {session.movements_by_type.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {session.movements_by_type
            .map(
              (movement) =>
                `${movementTypeLabel(movement.type)} ${formatSignedRupiah(movement.amount)}`,
            )
            .join(' · ')}
        </p>
      )}

      {session.variance_note && (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Catatan operator:</span>{' '}
          {session.variance_note}
        </p>
      )}
    </li>
  )
}
