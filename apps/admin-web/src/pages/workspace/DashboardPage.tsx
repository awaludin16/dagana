import { useQuery } from '@tanstack/react-query'
import { tableFeatures, useTable } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'
import { Banknote, Clock, Coins, PackageOpen, Receipt, TrendingUp, Wallet } from 'lucide-react'
import { useMemo } from 'react'
import { Link, Navigate } from 'react-router'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { useAccess } from '@/auth/useAccess'
import { ErrorState, LoadingState } from '@/components/PageFeedback'
import { SectionTitle } from '@/components/SectionTitle'
import { SummaryCard } from '@/components/SummaryCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { apiErrorMessage } from '@/lib/form-errors'
import {
  formatNumber,
  formatOrderDate,
  formatRupiah,
  orderStatusClass,
  orderStatusLabel,
} from '@/lib/order-format'
import type { CashSession, InventoryItem, Order, ReportDay } from '@/types'

// Owner Dashboard (PRD): Today's Sales, Transactions, Cash Status, Low Stock,
// Recent Orders, primary action "Mulai Jualan". Semua angka dari endpoint
// reporting/list yang sudah ada; frontend tidak menghitung ulang agregasi.
const TREND_DAYS = 7
const WIDGET_PER_PAGE = 50
const EMPTY_ORDERS: Order[] = []

// TanStack Table v9: fitur bersifat opt-in; tabel terbaru tidak butuh sorting.
const tableFeatureSet = tableFeatures({})

// shortcut: tanggal trend dihitung sekali saat modul dimuat; sesi lintas tengah
// malam butuh reload halaman untuk memperbarui "hari ini".
const TODAY = toISODate(new Date())
const WEEK_AGO = toISODateDaysAgo(TREND_DAYS - 1)

const compactNumber = new Intl.NumberFormat('id-ID', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

function toISODate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function toISODateDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return toISODate(date)
}

function formatDayLabel(date: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${date}T00:00:00`))
}

function timeGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 11) return 'Selamat pagi'
  if (hour < 15) return 'Selamat siang'
  if (hour < 19) return 'Selamat sore'
  return 'Selamat malam'
}

function outletLabel(outlets: { id: number; name: string }[], outletId: number): string {
  return outlets.find((outlet) => outlet.id === outletId)?.name ?? `Outlet ${outletId}`
}

export function DashboardPage() {
  const access = useAccess()

  if (access.isPending) return <LoadingState label="Memeriksa Business Anda..." />

  if (access.isError) {
    return (
      <ErrorState
        message="Business belum dapat dimuat. Periksa koneksi lalu coba lagi."
        onRetry={() => void access.refetch()}
      />
    )
  }

  if (!access.membership) return <Navigate to="/onboarding" replace />

  const outlets = access.membership.outlets

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">
            {timeGreeting()}, {access.data?.name ?? 'Pengguna'}
          </p>
          <h1 className="text-page-title tracking-tight">{access.membership.business.name}</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Ringkasan operasional: penjualan hari ini, tren 7 hari terakhir, status kas, stok
            rendah, dan transaksi terbaru. Semua angka dihitung server; bukan accounting penuh.
          </p>
        </div>
        {access.can('orders.create') && (
          <Button asChild size="lg" className="self-start sm:self-center">
            <Link to="/pos">Mulai Jualan</Link>
          </Button>
        )}
      </header>

      {access.can('reports.read') && <SummarySection />}
      {access.can('cash.read') && <CashStatusSection outlets={outlets} />}
      {access.can('inventory.read') && <LowStockSection />}
      {access.can('orders.read') && <RecentOrdersSection outlets={outlets} />}
    </section>
  )
}

function SummarySection() {
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

function SalesTrendChart({ days }: { days: ReportDay[] }) {
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

function CashStatusSection({ outlets }: { outlets: { id: number; name: string }[] }) {
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

function LowStockSection() {
  const inventory = useQuery({
    queryKey: ['dashboard', 'low-stock'],
    queryFn: () => api.inventoryItems({ low_stock: true, per_page: WIDGET_PER_PAGE }),
  })

  if (inventory.isPending) return <LoadingState label="Memuat stok rendah..." />

  if (inventory.isError || !inventory.data) {
    return (
      <ErrorState
        message={apiErrorMessage(
          inventory.error,
          'Stok rendah belum dapat dimuat. Periksa koneksi lalu coba lagi.',
        )}
        onRetry={() => void inventory.refetch()}
      />
    )
  }

  const rows: InventoryItem[] = inventory.data.data

  return (
    <div className="space-y-3" aria-label="Stok rendah">
      <SectionTitle icon={PackageOpen}>Stok rendah</SectionTitle>
      {rows.length === 0 ? (
        <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground" role="status">
          Tidak ada item dengan stok rendah. Semua stok aman.
        </div>
      ) : (
        <>
          <ul className="grid gap-3 sm:grid-cols-2">
            {rows.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4"
              >
                <div className="min-w-0 space-y-0.5">
                  <h3 className="truncate text-sm font-semibold">{item.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    Sisa {formatNumber(item.current_stock)} {item.unit}
                  </p>
                </div>
                <Badge className="border-dagana-warning/20 bg-dagana-warning-container text-dagana-warning">
                  Stok rendah
                </Badge>
              </li>
            ))}
          </ul>
          {inventory.data.meta.total > rows.length && (
            <p className="text-xs text-muted-foreground">
              Menampilkan {formatNumber(rows.length)} dari {formatNumber(inventory.data.meta.total)}{' '}
              item stok rendah. Lihat halaman Inventory untuk daftar lengkap.
            </p>
          )}
        </>
      )}
    </div>
  )
}

function RecentOrdersSection({ outlets }: { outlets: { id: number; name: string }[] }) {
  const orders = useQuery({
    queryKey: ['dashboard', 'recent-orders'],
    queryFn: () => api.orders({ per_page: 5 }),
  })

  const columns = useMemo<Array<ColumnDef<typeof tableFeatureSet, Order>>>(
    () => [
      {
        accessorKey: 'created_at',
        header: 'Waktu',
        cell: (info) => formatOrderDate(info.getValue<string>()),
      },
      {
        id: 'outlet',
        header: 'Outlet',
        accessorFn: (row) => outletLabel(outlets, row.outlet_id),
      },
      {
        accessorKey: 'total_amount',
        header: 'Total',
        cell: (info) => formatRupiah(info.getValue<number>()),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => (
          <Badge className={orderStatusClass(info.getValue<string>())}>
            {orderStatusLabel(info.getValue<string>())}
          </Badge>
        ),
      },
    ],
    [outlets],
  )

  // Data harus referensinya stabil; pakai konstanta kosong saat masih memuat.
  const data = orders.data?.data ?? EMPTY_ORDERS
  const table = useTable({ features: tableFeatureSet, columns, data })

  if (orders.isPending) return <LoadingState label="Memuat transaksi terbaru..." />

  if (orders.isError || !orders.data) {
    return (
      <ErrorState
        message={apiErrorMessage(
          orders.error,
          'Transaksi terbaru belum dapat dimuat. Periksa koneksi lalu coba lagi.',
        )}
        onRetry={() => void orders.refetch()}
      />
    )
  }

  const rows = orders.data.data

  return (
    <div className="space-y-3" aria-label="Transaksi terbaru">
      <SectionTitle icon={Clock}>Transaksi terbaru</SectionTitle>
      {rows.length === 0 ? (
        <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground" role="status">
          Belum ada transaksi tercatat. Mulai jualan untuk melihat riwayat di sini.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm" aria-label="Transaksi terbaru">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b text-left text-muted-foreground">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={`p-3 font-medium ${header.column.id === 'total_amount' ? 'text-right' : ''}`}
                    >
                      {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getAllCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={`p-3 ${cell.column.id === 'total_amount' ? 'text-right font-medium tabular-nums' : ''}`}
                    >
                      <table.FlexRender cell={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
