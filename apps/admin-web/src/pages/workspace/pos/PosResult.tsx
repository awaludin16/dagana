import { ShoppingBasket } from 'lucide-react'
import type { RefObject } from 'react'

import { ErrorState, LoadingState } from '@/components/PageFeedback'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  formatOrderDate,
  formatRupiah,
  orderStatusClass,
  orderStatusLabel,
  paymentMethodLabel,
  paymentStatusClass,
  paymentStatusLabel,
} from '@/lib/order-format'
import type { Order } from '@/types'

type Props = {
  receipt: Order | null
  canReadOrders: boolean
  isLoading: boolean
  isRefreshing: boolean
  error: string | null
  onRefresh: () => void
  onNewSale: () => void
  headingRef: RefObject<HTMLHeadingElement | null>
}

export function PosResult({
  receipt,
  canReadOrders,
  isLoading,
  isRefreshing,
  error,
  onRefresh,
  onNewSale,
  headingRef,
}: Props) {
  if (!receipt && isLoading) return <LoadingState label="Memuat hasil transaksi..." />
  if (!receipt) {
    return (
      <section className="grid min-h-0 flex-1 place-items-center p-6">
        <ErrorState
          message={error ?? 'Receipt transaksi tidak dapat ditampilkan.'}
          onRetry={onRefresh}
        />
      </section>
    )
  }

  return (
    <section className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-8">
      <article className="mx-auto max-w-2xl space-y-5 rounded-xl border bg-card p-5 sm:p-8">
        <header className="space-y-3 border-b pb-5 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-dagana-primary-soft text-dagana-primary">
            <ShoppingBasket aria-hidden="true" className="size-6" />
          </div>
          <h1 ref={headingRef} tabIndex={-1} className="text-page-title outline-none">
            Transaksi tercatat
          </h1>
          <p className="text-sm text-muted-foreground">{formatOrderDate(receipt.created_at)}</p>
          <Badge className={orderStatusClass(receipt.status)}>
            {orderStatusLabel(receipt.status)}
          </Badge>
        </header>

        <ul className="divide-y">
          {receipt.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 py-3 text-sm">
              <span className="min-w-0">
                <span className="block font-medium">{item.product_name}</span>
                <span className="text-muted-foreground">
                  {item.quantity} × {formatRupiah(item.product_price)}
                </span>
              </span>
              <span className="shrink-0 font-semibold tabular-nums">
                {formatRupiah(item.total)}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex justify-between border-t pt-4 text-base">
          <span className="font-semibold">Total final</span>
          <span className="font-bold tabular-nums">{formatRupiah(receipt.total_amount)}</span>
        </div>

        <section
          className="space-y-2 rounded-lg bg-muted/50 p-4"
          aria-labelledby="pos-payment-result"
        >
          <h2 id="pos-payment-result" className="text-sm font-semibold">
            Pembayaran
          </h2>
          {receipt.payment ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>{paymentMethodLabel(receipt.payment.method)}</span>
                <Badge className={paymentStatusClass(receipt.payment.status)}>
                  {paymentStatusLabel(receipt.payment.status)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {receipt.payment.status === 'PENDING'
                  ? 'Pembayaran belum terkonfirmasi. Verifikasi pembayaran terlebih dahulu; POS tidak mengubah status secara otomatis.'
                  : receipt.payment.paid_at
                    ? `Dikonfirmasi ${formatOrderDate(receipt.payment.paid_at)}`
                    : 'Status pembayaran diterima dari server.'}
              </p>
              {receipt.payment.method === 'cash' &&
                receipt.payment.amount_tendered !== null &&
                receipt.payment.change_amount !== null && (
                  <dl className="space-y-1 border-t pt-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Jumlah dibayar</dt>
                      <dd className="font-medium tabular-nums">
                        {formatRupiah(receipt.payment.amount_tendered)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Kembalian</dt>
                      <dd className="font-medium tabular-nums">
                        {formatRupiah(receipt.payment.change_amount)}
                      </dd>
                    </div>
                  </dl>
                )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Catatan pembayaran belum tersedia pada respons server.
            </p>
          )}
        </section>

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          >
            {error}
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          {canReadOrders && (
            <Button
              type="button"
              variant="outline"
              className="min-h-11 flex-1"
              disabled={isRefreshing}
              onClick={onRefresh}
            >
              {isRefreshing ? 'Memuat ulang receipt...' : 'Muat ulang receipt'}
            </Button>
          )}
          <Button type="button" className="min-h-11 flex-1" onClick={onNewSale}>
            Transaksi baru
          </Button>
        </div>
      </article>
    </section>
  )
}
