import { useQuery } from '@tanstack/react-query'
import {
  Banknote,
  Boxes,
  CreditCard,
  Receipt,
  TrendingUp,
  UserRoundCog,
  Wallet,
} from 'lucide-react'
import { useState } from 'react'

import { useAccess } from '@/auth/useAccess'
import { FormField } from '@/components/FormField'
import { ErrorState, LoadingState } from '@/components/PageFeedback'
import { SectionTitle } from '@/components/SectionTitle'
import { SummaryCard } from '@/components/SummaryCard'
import { Badge } from '@/components/ui/badge'
import {
  cashSessionStatusClass,
  cashSessionStatusLabel,
  formatSignedRupiah,
  movementTypeLabel,
  varianceClass,
  varianceLabel,
} from '@/lib/cash-format'
import { api } from '@/lib/api'
import { apiErrorMessage } from '@/lib/form-errors'
import {
  formatNumber,
  formatOrderDate,
  formatRupiah,
  paymentMethodLabel,
  paymentStatusLabel,
} from '@/lib/order-format'
import type {
  OperatorReportRow,
  ReportCashRow,
  ReportDay,
  ReportInventoryRow,
  ReportRangeParams,
  SalesReport,
} from '@/types'

// Backend membatasi rentang 92 hari dan per_page maks 100 (api-design §13).
const MAX_REPORT_DAYS = 92
const REPORT_PER_PAGE = 50

function toISODate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function defaultFrom(): string {
  const date = new Date()
  date.setDate(date.getDate() - 6)
  return toISODate(date)
}

function rangeDays(from: string, to: string): number {
  return Math.floor((Date.parse(to) - Date.parse(from)) / 86_400_000) + 1
}

function formatDayLabel(date: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${date}T00:00:00`))
}

function MetaNote({ shown, total }: { shown: number; total: number }) {
  if (total <= shown) return null

  return (
    <p className="text-xs text-muted-foreground">
      Menampilkan {formatNumber(shown)} dari {formatNumber(total)} entri pertama pada periode ini.
    </p>
  )
}

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
          Ringkasan penjualan, pembayaran, performa operator, rekonsiliasi kas, dan inventory. Semua
          angka dihitung server dari data transaksi; laporan ini bukan accounting penuh.
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
          <InventorySection params={params} />
        </>
      )}
    </section>
  )
}

function SalesSection({
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

function TrendChart({ days }: { days: ReportDay[] }) {
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

function PaymentsSection({ params }: { params: ReportRangeParams }) {
  const payments = useQuery({
    queryKey: ['reports', 'payments', params],
    queryFn: () => api.reportPayments(params),
  })

  if (payments.isPending) return <LoadingState label="Memuat laporan pembayaran..." />

  if (payments.isError || !payments.data) {
    return (
      <ErrorState
        message={apiErrorMessage(
          payments.error,
          'Laporan pembayaran belum dapat dimuat. Periksa koneksi lalu coba lagi.',
        )}
        onRetry={() => void payments.refetch()}
      />
    )
  }

  const { by_method, by_status } = payments.data

  if (by_method.length === 0 && by_status.length === 0) {
    return (
      <div className="space-y-3">
        <h2 className="text-section-title">Pembayaran</h2>
        <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground" role="status">
          Belum ada pembayaran pada periode ini.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <SectionTitle icon={CreditCard}>Pembayaran</SectionTitle>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm" aria-label="Pembayaran per metode (hanya lunas)">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="p-3 font-medium">Metode</th>
              <th className="p-3 font-medium">Transaksi</th>
              <th className="p-3 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {by_method.map((row) => (
              <tr key={row.method}>
                <td className="p-3 font-medium">{paymentMethodLabel(row.method)}</td>
                <td className="p-3 tabular-nums">{formatNumber(row.transactions)}</td>
                <td className="p-3 text-right font-medium tabular-nums">
                  {formatRupiah(row.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        Tabel di atas hanya pembayaran Terkonfirmasi. Pembayaran menunggu/gagal tidak pernah
        digabung ke angka lunas.
      </p>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm" aria-label="Pembayaran per status">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Transaksi</th>
              <th className="p-3 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {by_status.map((row) => (
              <tr key={row.status}>
                <td className="p-3 font-medium">{paymentStatusLabel(row.status)}</td>
                <td className="p-3 tabular-nums">{formatNumber(row.transactions)}</td>
                <td className="p-3 text-right font-medium tabular-nums">
                  {formatRupiah(row.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function OperatorsSection({ params }: { params: ReportRangeParams }) {
  const operators = useQuery({
    queryKey: ['reports', 'operators', params],
    queryFn: () => api.reportOperators({ ...params, per_page: REPORT_PER_PAGE }),
  })

  if (operators.isPending) return <LoadingState label="Memuat laporan operator..." />

  if (operators.isError || !operators.data) {
    return (
      <ErrorState
        message={apiErrorMessage(
          operators.error,
          'Laporan operator belum dapat dimuat. Periksa koneksi lalu coba lagi.',
        )}
        onRetry={() => void operators.refetch()}
      />
    )
  }

  const rows: OperatorReportRow[] = operators.data.data

  return (
    <div className="space-y-3">
      <SectionTitle icon={UserRoundCog}>Performa operator</SectionTitle>
      {rows.length === 0 ? (
        <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground" role="status">
          Belum ada transaksi per operator pada periode ini.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full text-sm" aria-label="Agregasi transaksi per operator">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-3 font-medium">Operator</th>
                  <th className="p-3 font-medium">Transaksi</th>
                  <th className="p-3 text-right font-medium">Total penjualan</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((row) => (
                  <tr key={row.membership_id}>
                    <td className="p-3 font-medium">{row.operator_name}</td>
                    <td className="p-3 tabular-nums">{formatNumber(row.transactions)}</td>
                    <td className="p-3 text-right font-medium tabular-nums">
                      {formatRupiah(row.sales_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <MetaNote shown={rows.length} total={operators.data.meta.total} />
        </>
      )}
    </div>
  )
}

function CashSection({
  params,
  outlets,
}: {
  params: ReportRangeParams
  outlets: { id: number; name: string }[]
}) {
  const cash = useQuery({
    queryKey: ['reports', 'cash', params],
    queryFn: () => api.reportCash({ ...params, per_page: REPORT_PER_PAGE }),
  })

  if (cash.isPending) return <LoadingState label="Memuat rekonsiliasi kas..." />

  if (cash.isError || !cash.data) {
    return (
      <ErrorState
        message={apiErrorMessage(
          cash.error,
          'Rekonsiliasi kas belum dapat dimuat. Periksa koneksi lalu coba lagi.',
        )}
        onRetry={() => void cash.refetch()}
      />
    )
  }

  const rows: ReportCashRow[] = cash.data.data

  return (
    <div className="space-y-3">
      <SectionTitle icon={Wallet}>Rekonsiliasi kas</SectionTitle>
      {rows.length === 0 ? (
        <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground" role="status">
          Belum ada Cash Session pada periode ini.
        </div>
      ) : (
        <>
          <ul className="space-y-3" aria-label="Rekap Cash Session pada periode">
            {rows.map((session) => (
              <CashSessionRow
                key={session.id}
                session={session}
                outletName={outlets.find((outlet) => outlet.id === session.outlet_id)?.name}
              />
            ))}
          </ul>
          <MetaNote shown={rows.length} total={cash.data.meta.total} />
        </>
      )}
    </div>
  )
}

function CashSessionRow({ session, outletName }: { session: ReportCashRow; outletName?: string }) {
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

function InventorySection({ params }: { params: ReportRangeParams }) {
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const inventory = useQuery({
    queryKey: ['reports', 'inventory', params, lowStockOnly],
    queryFn: () =>
      api.reportInventory({
        ...params,
        per_page: REPORT_PER_PAGE,
        low_stock: lowStockOnly || undefined,
      }),
  })

  if (inventory.isPending) return <LoadingState label="Memuat laporan inventory..." />

  if (inventory.isError || !inventory.data) {
    return (
      <ErrorState
        message={apiErrorMessage(
          inventory.error,
          'Laporan inventory belum dapat dimuat. Periksa koneksi lalu coba lagi.',
        )}
        onRetry={() => void inventory.refetch()}
      />
    )
  }

  const rows: ReportInventoryRow[] = inventory.data.data

  return (
    <div className="space-y-3">
      <SectionTitle icon={Boxes}>Inventory</SectionTitle>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={lowStockOnly}
          onChange={(event) => setLowStockOnly(event.target.checked)}
          className="size-4 rounded border-input accent-dagana-primary"
        />
        Hanya item dengan stok rendah
      </label>

      {rows.length === 0 ? (
        <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground" role="status">
          {lowStockOnly
            ? 'Tidak ada item dengan stok rendah pada filter ini.'
            : 'Belum ada item inventory pada periode ini. Modul inventory mungkin belum digunakan.'}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full text-sm" aria-label="Laporan inventory">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-3 font-medium">Item</th>
                  <th className="p-3 font-medium">Saldo stok</th>
                  <th className="p-3 font-medium">Movement rentang</th>
                  <th className="p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="p-3 font-medium">{row.name}</td>
                    <td className="p-3 tabular-nums">
                      {formatNumber(row.current_stock)} {row.unit}
                    </td>
                    <td className="p-3 tabular-nums">
                      {row.movements_net > 0 ? '+' : ''}
                      {formatNumber(row.movements_net)} ({formatNumber(row.movements_count)}x)
                    </td>
                    <td className="p-3">
                      {row.is_low_stock && (
                        <Badge className="border-dagana-warning/20 bg-dagana-warning-container text-dagana-warning">
                          Stok rendah
                        </Badge>
                      )}
                      {!row.is_active && <Badge>Nonaktif</Badge>}
                      {!row.is_low_stock && row.is_active ? (
                        <span className="text-muted-foreground">—</span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <MetaNote shown={rows.length} total={inventory.data.meta.total} />
        </>
      )}
    </div>
  )
}
