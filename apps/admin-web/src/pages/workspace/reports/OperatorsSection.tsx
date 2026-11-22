import { useQuery } from '@tanstack/react-query'
import { UserRoundCog } from 'lucide-react'

import { ErrorState, LoadingState } from '@/components/PageFeedback'
import { SectionTitle } from '@/components/SectionTitle'
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
import { formatNumber, formatRupiah } from '@/lib/order-format'
import type { OperatorReportRow, ReportRangeParams } from '@/types'

import { MetaNote } from './MetaNote'
import { REPORT_PER_PAGE } from './utils'

export function OperatorsSection({ params }: { params: ReportRangeParams }) {
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
            <Table aria-label="Agregasi transaksi per operator">
              <TableHeader>
                <TableRow>
                  <TableHead>Operator</TableHead>
                  <TableHead>Transaksi</TableHead>
                  <TableHead className="text-right">Total penjualan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.membership_id}>
                    <TableCell className="font-medium">{row.operator_name}</TableCell>
                    <TableCell className="tabular-nums">{formatNumber(row.transactions)}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatRupiah(row.sales_total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <MetaNote shown={rows.length} total={operators.data.meta.total} />
        </>
      )}
    </div>
  )
}
