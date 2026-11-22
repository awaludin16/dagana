import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { useAccess } from '@/auth/useAccess'
import { FormField } from '@/components/FormField'
import { api } from '@/lib/api'
import type { ReportRangeParams } from '@/types'

import { CashSection } from './CashSection'
import { OperatorsSection } from './OperatorsSection'
import { PaymentsSection } from './PaymentsSection'
import { SalesSection } from './SalesSection'
import { MAX_REPORT_DAYS, defaultFrom, rangeDays, toISODate } from './utils'

export function ReportsPage() {
  const access = useAccess()
  const outlets = access.membership?.outlets ?? []

  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(() => toISODate(new Date()))
  const [outletFilter, setOutletFilter] = useState('')

  const outletId = outletFilter ? Number(outletFilter) : undefined
  const params: ReportRangeParams = { from, to, outlet_id: outletId }

  const rangeError =
    rangeDays(from, to) < 1
      ? 'Tanggal awal harus sama dengan atau sebelum tanggal akhir.'
      : rangeDays(from, to) > MAX_REPORT_DAYS
        ? 'Rentang laporan maksimal 92 hari.'
        : null

  const sales = useQuery({
    queryKey: ['reports', 'sales', from, to, outletFilter],
    queryFn: () => api.reportSales({ from, to, outlet_id: outletId }),
    enabled: rangeError === null,
  })

  return (
    <section className="space-y-6">
      <header className="space-y-2 border-b pb-6">
        <p className="text-sm font-medium text-primary">Laporan</p>
        <h1 className="text-page-title tracking-tight">Laporan</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Ringkasan penjualan, pembayaran, performa operator, dan rekonsiliasi kas. Semua angka
          dihitung server dari data transaksi; laporan ini bukan accounting penuh.
        </p>
      </header>

      <form
        className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-3"
        aria-label="Filter laporan"
        onSubmit={(event) => event.preventDefault()}
      >
        <FormField
          id="report-from"
          name="report-from"
          label="Dari tanggal"
          type="date"
          value={from}
          onChange={(event) => setFrom(event.target.value)}
        />
        <FormField
          id="report-to"
          name="report-to"
          label="Sampai tanggal"
          type="date"
          value={to}
          onChange={(event) => setTo(event.target.value)}
        />
        {outlets.length > 1 && (
          <div className="space-y-1.5">
            <label htmlFor="report-outlet" className="text-sm font-medium">
              Outlet
            </label>
            <select
              id="report-outlet"
              value={outletFilter}
              onChange={(event) => setOutletFilter(event.target.value)}
              className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none transition focus-visible:ring-[3px] focus-visible:ring-ring/40"
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
      </form>

      {rangeError ? (
        <div
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm"
          role="alert"
        >
          {rangeError}
        </div>
      ) : (
        <>
          <SalesSection sales={sales} from={from} to={to} />
          <PaymentsSection params={params} />
          <OperatorsSection params={params} />
          <CashSection params={params} outlets={outlets} />
        </>
      )}
    </section>
  )
}
