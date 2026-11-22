import { useQuery } from '@tanstack/react-query'
import { Banknote, Coins, Receipt, TrendingUp } from 'lucide-react'

import { ErrorState, LoadingState } from '@/components/PageFeedback'
import { SectionTitle } from '@/components/SectionTitle'
import { SummaryCard } from '@/components/SummaryCard'
import { api } from '@/lib/api'
import { apiErrorMessage } from '@/lib/form-errors'
import { formatNumber, formatRupiah } from '@/lib/order-format'

import { SalesTrendChart } from './SalesTrendChart'
import { TODAY, WEEK_AGO } from './utils'

export function SummarySection() {
  const sales = useQuery({
    queryKey: ['dashboard', 'sales', WEEK_AGO, TODAY],
    queryFn: () => api.reportSales({ from: WEEK_AGO, to: TODAY }),
  })

  if (sales.isPending) return <LoadingState label="Memuat ringkasan hari ini..." />

  if (sales.isError || !sales.data) {
    return (
      <ErrorState
        message={apiErrorMessage(
          sales.error,
          'Ringkasan hari ini belum dapat dimuat. Periksa koneksi lalu coba lagi.',
        )}
        onRetry={() => void sales.refetch()}
      />
    )
  }

  // Satu query 7 hari: kartu memakai hari ini (hari terakhir), grafik memakai
  // seluruh rentang. Hari ini selalu ada di days sesuai kontrak /reports/sales.
  const { days } = sales.data
  const today = days.find((day) => day.date === TODAY) ?? days[days.length - 1]

  return (
    <div className="space-y-3" aria-label="Ringkasan hari ini">
      <SectionTitle icon={TrendingUp}>Hari ini</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          label="Penjualan hari ini"
          value={formatRupiah(today.sales_total)}
          icon={Banknote}
          tone="primary"
        />
        <SummaryCard
          label="Transaksi hari ini"
          value={`${formatNumber(today.transactions)} transaksi`}
          icon={Receipt}
          tone="soft"
        />
        <SummaryCard
          label="Rata-rata per transaksi"
          value={today.average_order_value === null ? '—' : formatRupiah(today.average_order_value)}
          icon={Coins}
          tone="info"
        />
      </div>
      <h3 className="text-sm font-semibold">Tren penjualan 7 hari terakhir</h3>
      <SalesTrendChart days={days} />
    </div>
  )
}
