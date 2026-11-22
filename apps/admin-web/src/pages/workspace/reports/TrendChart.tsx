import { formatNumber, formatRupiah } from '@/lib/order-format'
import type { ReportDay } from '@/types'

import { formatDayLabel } from './utils'

export function TrendChart({ days }: { days: ReportDay[] }) {
  const max = Math.max(...days.map((day) => day.sales_total), 1)
  const best = days.reduce((top, day) => (day.sales_total > top.sales_total ? day : top), days[0])

  return (
    <div
      role="img"
      aria-label={`Tren penjualan harian ${formatDayLabel(days[0].date)} hingga ${formatDayLabel(days[days.length - 1].date)}. Hari terbaik ${formatDayLabel(best.date)} dengan ${formatRupiah(best.sales_total)}.`}
      className="flex h-40 items-end gap-px rounded-xl border bg-card p-3"
    >
      {days.map((day) => (
        <div
          key={day.date}
          title={`${formatDayLabel(day.date)}: ${formatRupiah(day.sales_total)} (${formatNumber(day.transactions)} transaksi)`}
          className="min-w-0 flex-1 rounded-sm bg-dagana-primary/60"
          style={{
            height:
              day.sales_total === 0
                ? '2px'
                : `${Math.max(4, Math.round((day.sales_total / max) * 100))}%`,
          }}
        />
      ))}
    </div>
  )
}
