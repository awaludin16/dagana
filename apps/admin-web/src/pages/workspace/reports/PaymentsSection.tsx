import { useQuery } from '@tanstack/react-query'
import { CreditCard } from 'lucide-react'

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
import {
  formatNumber,
  formatRupiah,
  paymentMethodLabel,
  paymentStatusLabel,
} from '@/lib/order-format'
import type { ReportRangeParams } from '@/types'

export function PaymentsSection({ params }: { params: ReportRangeParams }) {
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
      <Table aria-label="Pembayaran per metode (hanya lunas)">
        <TableHeader>
          <TableRow>
            <TableHead>Metode</TableHead>
            <TableHead>Transaksi</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {by_method.map((row) => (
            <TableRow key={row.method}>
              <TableCell className="font-medium">{paymentMethodLabel(row.method)}</TableCell>
              <TableCell className="tabular-nums">{formatNumber(row.transactions)}</TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatRupiah(row.total)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="text-xs text-muted-foreground">
        Tabel di atas hanya pembayaran Terkonfirmasi. Pembayaran menunggu/gagal tidak pernah
        digabung ke angka lunas.
      </p>
      <Table aria-label="Pembayaran per status">
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Transaksi</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {by_status.map((row) => (
            <TableRow key={row.status}>
              <TableCell className="font-medium">{paymentStatusLabel(row.status)}</TableCell>
              <TableCell className="tabular-nums">{formatNumber(row.transactions)}</TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatRupiah(row.total)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
