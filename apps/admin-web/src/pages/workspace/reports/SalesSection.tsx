import { Banknote, Receipt, TrendingUp } from 'lucide-react'

import { ErrorState, LoadingState } from '@/components/PageFeedback'
import { SectionTitle } from '@/components/SectionTitle'
import { SummaryCard } from '@/components/SummaryCard'
import { apiErrorMessage } from '@/lib/form-errors'
import { formatNumber, formatRupiah } from '@/lib/order-format'
import type { SalesReport } from '@/types'

import { TrendChart } from './TrendChart'
import { formatDayLabel } from './utils'

export function SalesSection({
  sales,
  from,
  to,
}: {
  sales: {
    isPending: boolean
    isError: boolean
    error: unknown
    data?: SalesReport
    refetch: () => Promise<unknown>
  }
  from: string
  to: string
}) {
  if (sales.isPending) return <LoadingState label="Memuat ringkasan penjualan..." />

  if (sales.isError || !sales.data) {
    return (
      <ErrorState
        message={apiErrorMessage(
          sales.error,
          'Ringkasan penjualan belum dapat dimuat. Periksa koneksi lalu coba lagi.',
        )}
        onRetry={() => void sales.refetch()}
      />
    )
  }

  const { summary, days } = sales.data
  const periodLabel = `${formatDayLabel(from)} – ${formatDayLabel(to)}`

  return (
    <div className="space-y-3">
      <SectionTitle icon={TrendingUp}>Ringkasan penjualan</SectionTitle>
      <p className="text-sm text-muted-foreground">
        Periode {periodLabel} · Hanya transaksi berstatus Lunas yang dihitung.
      </p>

      {summary.transactions === 0 ? (
        <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground" role="status">
          Belum ada transaksi pada periode {periodLabel}. Coba ubah rentang tanggal atau filter
          outlet.
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <SummaryCard
              label="Total penjualan"
              value={formatRupiah(summary.sales_total)}
              icon={Banknote}
              tone="primary"
            />
            <SummaryCard
              label="Jumlah transaksi"
              value={`${formatNumber(summary.transactions)} transaksi`}
              icon={Receipt}
              tone="soft"
            />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Tren penjualan harian</h3>
            <TrendChart days={days} />
          </div>
        </>
      )}
    </div>
  )
}
