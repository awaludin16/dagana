import { useQuery } from '@tanstack/react-query'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'

import { useAccess } from '@/auth/useAccess'
import { ErrorState, LoadingState } from '@/components/PageFeedback'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { apiErrorMessage } from '@/lib/form-errors'
import {
  formatOrderDate,
  formatRupiah,
  orderSourceLabel,
  orderStatusClass,
  orderStatusLabel,
  paymentMethodLabel,
  paymentStatusLabel,
} from '@/lib/order-format'

const PER_PAGE = 20

export function OrdersPage() {
  const access = useAccess()
  const [page, setPage] = useState(1)
  const orders = useQuery({
    queryKey: ['orders', 'list', page],
    queryFn: () => api.orders({ page, per_page: PER_PAGE }),
  })

  if (orders.isPending) return <LoadingState label="Memuat riwayat transaksi..." />
  if (orders.isError) {
    return (
      <ErrorState
        message={apiErrorMessage(
          orders.error,
          'Riwayat transaksi belum dapat dimuat. Periksa koneksi lalu coba lagi.',
        )}
        onRetry={() => void orders.refetch()}
      />
    )
  }

  const result = orders.data

  return (
    <section className="space-y-6">
      <header className="space-y-2 border-b pb-6">
        <p className="text-sm font-medium text-primary">Operasional</p>
        <h1 className="text-page-title tracking-tight">Riwayat transaksi</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Order dan status pembayaran ditampilkan sesuai catatan server.
        </p>
      </header>

      {result.data.length === 0 ? (
        <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground" role="status">
          Belum ada transaksi.
        </div>
      ) : (
        <ul className="space-y-3" aria-label="Daftar transaksi">
          {result.data.map((order) => {
            const outletName =
              access.membership?.outlets.find((outlet) => outlet.id === order.outlet_id)?.name ??
              'Outlet'

            return (
              <li key={order.id} className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div className="space-y-1">
                    <h2 className="text-section-title">
                      Transaksi {orderSourceLabel(order.source)}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {outletName} · {formatOrderDate(order.created_at)}
                    </p>
                  </div>
                  <Badge className={orderStatusClass(order.status)}>
                    {orderStatusLabel(order.status)}
                  </Badge>
                </div>

                <dl className="grid gap-3 border-t pt-4 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-muted-foreground">Sumber</dt>
                    <dd className="mt-1 font-medium">{orderSourceLabel(order.source)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Pembayaran</dt>
                    <dd className="mt-1 font-medium">
                      {order.payment
                        ? `${paymentMethodLabel(order.payment.method)} · ${paymentStatusLabel(order.payment.status)}`
                        : 'Belum ada data pembayaran'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Total dari server</dt>
                    <dd className="mt-1 font-semibold tabular-nums">
                      {formatRupiah(order.total_amount)}
                    </dd>
                  </div>
                </dl>

                <div className="flex justify-end border-t pt-3">
                  <Link
                    to={`/orders/${order.id}`}
                    aria-label={`Lihat receipt transaksi ${formatOrderDate(order.created_at)} di ${outletName}`}
                    className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-medium text-primary outline-none hover:bg-primary/5 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    Lihat receipt <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {result.meta.last_page > 1 && (
        <nav
          aria-label="Navigasi halaman riwayat transaksi"
          className="flex flex-wrap items-center justify-between gap-3 border-t pt-4"
        >
          <p className="text-sm text-muted-foreground" aria-live="polite">
            Halaman {result.meta.current_page} dari {result.meta.last_page} · {result.meta.total}{' '}
            transaksi
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={result.meta.current_page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              <ChevronLeft aria-hidden="true" /> Sebelumnya
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={result.meta.current_page >= result.meta.last_page}
              onClick={() => setPage((current) => current + 1)}
            >
              Berikutnya <ChevronRight aria-hidden="true" />
            </Button>
          </div>
        </nav>
      )}
    </section>
  )
}
