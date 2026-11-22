import { useQuery } from '@tanstack/react-query'
import { useTable } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'
import { Clock } from 'lucide-react'
import { useMemo } from 'react'

import { ErrorState, LoadingState } from '@/components/PageFeedback'
import { SectionTitle } from '@/components/SectionTitle'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { api } from '@/lib/api'
import { apiErrorMessage } from '@/lib/form-errors'
import {
  formatOrderDate,
  formatRupiah,
  orderStatusClass,
  orderStatusLabel,
} from '@/lib/order-format'
import type { Order } from '@/types'

import { EMPTY_ORDERS, outletLabel, tableFeatureSet } from './utils'

export function RecentOrdersSection({ outlets }: { outlets: { id: number; name: string }[] }) {
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
        <Table aria-label="Transaksi terbaru">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={header.column.id === 'total_amount' ? 'text-right' : ''}
                  >
                    {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getAllCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={
                      cell.column.id === 'total_amount' ? 'text-right font-medium tabular-nums' : ''
                    }
                  >
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
