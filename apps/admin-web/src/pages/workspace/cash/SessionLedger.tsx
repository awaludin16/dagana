import { useQuery } from '@tanstack/react-query'

import { ErrorState, LoadingState } from '@/components/PageFeedback'
import { api } from '@/lib/api'
import { formatSignedRupiah, movementTypeLabel } from '@/lib/cash-format'
import { apiErrorMessage } from '@/lib/form-errors'
import { formatOrderDate } from '@/lib/order-format'
import type { CashMovement, CashSession } from '@/types'

const LEDGER_PER_PAGE = 50

export function SessionLedger({ session }: { session: CashSession }) {
  const ledger = useQuery({
    queryKey: ['cash-movements', session.id],
    queryFn: () => api.cashMovements(session.id, { per_page: LEDGER_PER_PAGE }),
  })

  if (ledger.isPending) return <LoadingState label="Memuat arus kas..." />
  if (ledger.isError) {
    return (
      <ErrorState
        message={apiErrorMessage(ledger.error, 'Arus kas belum dapat dimuat.')}
        onRetry={() => void ledger.refetch()}
      />
    )
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold">Arus kas (ledger server)</h4>
      {ledger.data.data.length === 0 ? (
        <p className="rounded-lg border bg-card p-3 text-sm text-muted-foreground" role="status">
          Belum ada aktivitas kas pada session ini.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border bg-card" aria-label="Ledger arus kas">
          {ledger.data.data.map((movement: CashMovement) => (
            <li key={movement.id} className="flex items-center justify-between gap-3 p-3 text-sm">
              <div className="min-w-0">
                <p className="font-medium">{movementTypeLabel(movement.type)}</p>
                <p className="truncate text-muted-foreground">
                  {formatOrderDate(movement.created_at)}
                  {movement.reason ? ` · ${movement.reason}` : ''}
                </p>
              </div>
              <p className="shrink-0 font-medium tabular-nums">
                {formatSignedRupiah(movement.amount)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
