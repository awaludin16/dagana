import { useQuery } from '@tanstack/react-query'
import { Wallet } from 'lucide-react'

import { ErrorState, LoadingState } from '@/components/PageFeedback'
import { SectionTitle } from '@/components/SectionTitle'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { apiErrorMessage } from '@/lib/form-errors'
import { formatOrderDate, formatRupiah } from '@/lib/order-format'
import type { CashSession } from '@/types'

import { outletLabel, WIDGET_PER_PAGE } from './utils'

export function CashStatusSection({ outlets }: { outlets: { id: number; name: string }[] }) {
  const sessions = useQuery({
    queryKey: ['dashboard', 'cash-open'],
    queryFn: () => api.cashSessions({ status: 'OPEN', per_page: WIDGET_PER_PAGE }),
  })

  if (sessions.isPending) return <LoadingState label="Memuat status kas..." />

  if (sessions.isError || !sessions.data) {
    return (
      <ErrorState
        message={apiErrorMessage(
          sessions.error,
          'Status kas belum dapat dimuat. Periksa koneksi lalu coba lagi.',
        )}
        onRetry={() => void sessions.refetch()}
      />
    )
  }

  const rows: CashSession[] = sessions.data.data

  return (
    <div className="space-y-3" aria-label="Status kas">
      <SectionTitle icon={Wallet}>Status kas</SectionTitle>
      {rows.length === 0 ? (
        <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground" role="status">
          Belum ada sesi kas yang terbuka. Sesi akan muncul setelah operator membuka kas.
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {rows.map((session) => (
            <li key={session.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">{outletLabel(outlets, session.outlet_id)}</h3>
                <Badge className="border-dagana-success/20 bg-dagana-success-container text-dagana-success">
                  Terbuka
                </Badge>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-3 border-t pt-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Kas awal</dt>
                  <dd className="mt-1 font-medium tabular-nums">
                    {formatRupiah(session.opening_cash)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Kas saat ini</dt>
                  <dd className="mt-1 font-medium tabular-nums">
                    {formatRupiah(session.expected_cash)}
                  </dd>
                </div>
              </dl>
              <p className="mt-2 text-xs text-muted-foreground">
                Dibuka {formatOrderDate(session.opened_at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
