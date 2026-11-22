import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { formatRupiah } from '@/lib/order-format'
import type { ReportDay } from '@/types'

import { compactNumber, formatDayLabel } from './utils'

export function SalesTrendChart({ days }: { days: ReportDay[] }) {
  const data = days.map((day) => ({
    label: formatDayLabel(day.date),
    sales_total: day.sales_total,
  }))
  const best = days.reduce((top, day) => (day.sales_total > top.sales_total ? day : top), days[0])

  return (
    <div
      role="img"
      aria-label={`Tren penjualan 7 hari terakhir. Hari terbaik ${formatDayLabel(best.date)} dengan ${formatRupiah(best.sales_total)}.`}
      className="rounded-xl border bg-card p-3"
    >
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={(value) => compactNumber.format(Number(value))}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={56}
          />
          <Tooltip
            formatter={(value) => formatRupiah(Number(value))}
            cursor={{ strokeDasharray: '3 3' }}
          />
          <Area
            type="monotone"
            dataKey="sales_total"
            name="Penjualan"
            stroke="var(--color-dagana-primary)"
            fill="var(--color-dagana-primary)"
            fillOpacity={0.12}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
