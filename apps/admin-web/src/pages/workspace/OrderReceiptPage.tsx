import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { Navigate, Link, useParams } from 'react-router'

import { useAccess } from '@/auth/useAccess'
import { ErrorState, LoadingState } from '@/components/PageFeedback'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { apiErrorMessage } from '@/lib/form-errors'
import {
  formatOrderDate,
  formatRupiah,
  orderStatusClass,
  orderStatusLabel,
  paymentMethodLabel,
  paymentStatusClass,
  paymentStatusLabel,
} from '@/lib/order-format'

export function OrderReceiptPage() {
  const { orderId } = useParams()
  const access = useAccess()
  const id = Number(orderId)
  const validId = Number.isSafeInteger(id) && id > 0
  const order = useQuery({
    queryKey: ['orders', 'detail', id],
    queryFn: () => api.order(id),
    enabled: validId,
  })

  if (!validId) return <Navigate to="/orders" replace />
  if (order.isPending) return <LoadingState label="Memuat receipt transaksi..." />
  if (order.isError) {
    return (
      <ErrorState
        message={apiErrorMessage(
          order.error,
          'Receipt belum dapat dimuat. Periksa koneksi lalu coba lagi.',
        )}
        onRetry={() => void order.refetch()}
      />
    )
  }

  const receipt = order.data
  const outletName =
    access.membership?.outlets.find((outlet) => outlet.id === receipt.outlet_id)?.name ?? 'Outlet'

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/orders"
          className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-medium text-primary outline-none hover:bg-primary/5 focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <ArrowLeft aria-hidden="true" className="size-4" /> Kembali ke transaksi
        </Link>
        <Button
          type="button"
          variant="outline"
          disabled={order.isFetching}
          onClick={() => void order.refetch()}
        >
          <RefreshCw
            aria-hidden="true"
            className={
              order.isFetching ? 'size-4 animate-spin motion-reduce:animate-none' : 'size-4'
            }
          />
          {order.isFetching ? 'Memuat ulang...' : 'Muat ulang receipt'}
        </Button>
      </div>

      <article className="space-y-6 rounded-xl border bg-card p-5 sm:p-8">
        <header className="space-y-3 border-b pb-5">
          <p className="text-sm font-medium text-primary">Receipt transaksi</p>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-page-title tracking-tight">Receipt transaksi</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {outletName} · {formatOrderDate(receipt.created_at)}
              </p>
            </div>
            <Badge className={orderStatusClass(receipt.status)}>
              {orderStatusLabel(receipt.status)}
            </Badge>
          </div>
        </header>

        <section aria-labelledby="receipt-items-heading" className="space-y-3">
          <h2 id="receipt-items-heading" className="text-section-title">
            Rincian item
          </h2>
          {receipt.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tidak ada item pada receipt ini.</p>
          ) : (
            <ul className="divide-y">
              {receipt.items.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} × {formatRupiah(item.product_price)}
                    </p>
                  </div>
                  <p className="font-semibold tabular-nums">{formatRupiah(item.total)}</p>
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-center justify-between border-t pt-4 text-base">
            <span className="font-semibold">Total</span>
            <span className="font-bold tabular-nums">{formatRupiah(receipt.total_amount)}</span>
          </div>
        </section>

        <section aria-labelledby="receipt-payment-heading" className="space-y-3 border-t pt-5">
          <h2 id="receipt-payment-heading" className="text-section-title">
            Pembayaran
          </h2>
          {receipt.payment ? (
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Metode</dt>
                <dd className="mt-1 font-medium">{paymentMethodLabel(receipt.payment.method)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Status pembayaran</dt>
                <dd className="mt-1">
                  <Badge className={paymentStatusClass(receipt.payment.status)}>
                    {paymentStatusLabel(receipt.payment.status)}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Jumlah pembayaran</dt>
                <dd className="mt-1 font-semibold tabular-nums">
                  {formatRupiah(receipt.payment.amount)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Waktu konfirmasi</dt>
                <dd className="mt-1 font-medium">
                  {receipt.payment.paid_at
                    ? formatOrderDate(receipt.payment.paid_at)
                    : 'Belum dikonfirmasi'}
                </dd>
              </div>
              {receipt.payment.reference && (
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Referensi pembayaran</dt>
                  <dd className="mt-1 font-medium">{receipt.payment.reference}</dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada data pembayaran.</p>
          )}
        </section>

        {receipt.notes && (
          <section aria-labelledby="receipt-notes-heading" className="border-t pt-5">
            <h2 id="receipt-notes-heading" className="text-section-title">
              Catatan
            </h2>
            <p className="mt-2 text-sm leading-6">{receipt.notes}</p>
          </section>
        )}
      </article>
    </section>
  )
}
