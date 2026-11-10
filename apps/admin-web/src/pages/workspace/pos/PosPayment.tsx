import { Banknote, Delete, QrCode } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

import { ErrorState, LoadingState } from '@/components/PageFeedback'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  formatRupiah,
  paymentStatusClass,
  paymentStatusLabel,
  formatNumber,
} from '@/lib/order-format'
import type { Order } from '@/types'

import {
  CASH_KEYS,
  PAYMENT_METHODS,
  QUICK_CASH_AMOUNTS,
  type CartLine,
  type CheckoutAttempt,
  type PaymentMethod,
} from '@/types/pos'

type Props = {
  cart: CartLine[]
  previewTotal: number
  outletName: string
  paymentMethod: PaymentMethod
  setPaymentMethod: (method: PaymentMethod) => void
  amountTendered: string
  setTenderedValue: (value: string) => void
  addCashAmount: (amount: number) => void
  handleCashKey: (key: string) => void
  paymentOrder: Order | null
  hasPaymentRoute: boolean
  isLoadingOrder: boolean
  isRefreshingOrder: boolean
  orderError: string | null
  canReadOrders: boolean
  canConfirmPayment: boolean
  isCheckoutPending: boolean
  isConfirmPending: boolean
  attempt: CheckoutAttempt | null
  storageError: string | null
  checkoutError: string | null
  confirmError: string | null
  confirmQrPayment: boolean
  onConfirmQrPayment: (checked: boolean) => void
  onBack: () => void
  onCheckout: () => void
  onRetryCheckout: () => void
  onRefreshOrder: () => void
  onConfirmPayment: () => void
  onShowPendingReceipt: () => void
}

export function PosPayment({
  cart,
  previewTotal,
  outletName,
  paymentMethod,
  setPaymentMethod,
  amountTendered,
  setTenderedValue,
  addCashAmount,
  handleCashKey,
  paymentOrder,
  hasPaymentRoute,
  isLoadingOrder,
  isRefreshingOrder,
  orderError,
  canReadOrders,
  canConfirmPayment,
  isCheckoutPending,
  isConfirmPending,
  attempt,
  storageError,
  checkoutError,
  confirmError,
  confirmQrPayment,
  onConfirmQrPayment,
  onBack,
  onCheckout,
  onRetryCheckout,
  onRefreshOrder,
  onConfirmPayment,
  onShowPendingReceipt,
}: Props) {
  const payment = paymentOrder?.payment
  const qrPayload = payment?.qr_code_payload?.trim() ?? ''
  const total = paymentOrder?.total_amount ?? previewTotal
  const isPending = payment?.status === 'PENDING'
  const canSubmitCash =
    Number.isSafeInteger(Number(amountTendered)) &&
    Number(amountTendered) >= total &&
    Number(amountTendered) <= 4294967295
  const summaryItems = paymentOrder
    ? paymentOrder.items.map(({ id, product_name, product_price, quantity, total: amount }) => ({
        id,
        product_name,
        product_price,
        quantity,
        amount,
      }))
    : cart.map(({ product_id, product_name, product_price, quantity }) => ({
        id: product_id,
        product_name,
        product_price,
        quantity,
        amount: product_price * quantity,
      }))

  if (isLoadingOrder && !paymentOrder) {
    return <LoadingState label="Memuat pembayaran..." />
  }

  if (hasPaymentRoute && !canReadOrders && !paymentOrder) {
    return (
      <section role="alert" className="m-auto max-w-lg rounded-lg border p-6 text-center">
        Izin `orders.read` diperlukan untuk memuat ulang transaksi ini.
      </section>
    )
  }

  if (orderError && !paymentOrder) {
    return (
      <section className="grid min-h-0 flex-1 place-items-center p-6">
        <ErrorState message={orderError} onRetry={onRefreshOrder} />
      </section>
    )
  }

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto p-3 landscape:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,0.9fr)] landscape:overflow-y-auto xl:grid-cols-3">
      <section
        aria-labelledby="pos-payment-summary"
        className="flex min-h-0 flex-col rounded-lg border bg-card p-4"
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <h1 id="pos-payment-summary" className="text-section-title">
              Ringkasan
            </h1>
            <p className="text-xs text-muted-foreground">{outletName}</p>
          </div>
          {!paymentOrder && !attempt && (
            <Button type="button" variant="outline" className="min-h-11" onClick={onBack}>
              Kembali
            </Button>
          )}
        </div>
        <ul className="min-h-0 flex-1 divide-y overflow-y-auto">
          {summaryItems.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span className="min-w-0">
                <span className="block line-clamp-1 font-medium">{item.product_name}</span>
                <span className="text-xs text-muted-foreground">
                  {item.quantity} × {formatRupiah(item.product_price)}
                </span>
              </span>
              <span className="shrink-0 font-semibold tabular-nums">
                {formatRupiah(item.amount)}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t pt-3">
          <span className="text-sm text-muted-foreground">
            {paymentOrder ? 'Total final' : 'Estimasi'}
          </span>
          <span className="text-xl font-bold tabular-nums">{formatRupiah(total)}</span>
        </div>
        {!paymentOrder && (
          <p className="mt-1 text-xs text-muted-foreground">Total final dihitung oleh server.</p>
        )}
      </section>

      <section
        aria-labelledby="pos-payment-method"
        className="flex min-h-0 flex-col rounded-lg border bg-card p-4"
      >
        <h2 id="pos-payment-method" className="text-section-title">
          Pembayaran
        </h2>
        <fieldset
          disabled={Boolean(paymentOrder || attempt)}
          className="mt-3 grid grid-cols-2 gap-2"
        >
          <legend className="sr-only">Pilih metode pembayaran</legend>
          {PAYMENT_METHODS.map((method) => (
            <label
              key={method.value}
              className={`flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium ${
                paymentMethod === method.value
                  ? 'border-dagana-primary bg-dagana-primary-soft text-dagana-primary'
                  : 'bg-background hover:bg-muted'
              }`}
            >
              <input
                type="radio"
                name="pos-payment-method"
                value={method.value}
                checked={paymentMethod === method.value}
                onChange={() => setPaymentMethod(method.value)}
                className="accent-dagana-primary"
              />
              {method.label}
            </label>
          ))}
        </fieldset>

        {!paymentOrder && paymentMethod === 'cash' && (
          <div className="mt-4 space-y-3">
            <label htmlFor="pos-amount-tendered" className="block text-sm font-medium">
              Jumlah dibayar
            </label>
            <div className="flex min-h-14 items-center rounded-md border bg-background px-3 focus-within:ring-[3px] focus-within:ring-ring/50">
              <span className="mr-2 text-sm text-muted-foreground">Rp</span>
              {/* Digit polos agar DOM value selalu integer string; format tampilan rupiah
                  hanya pada ringkasan/receipt, bukan pada input yang dikirim ke server. */}
              <input
                id="pos-amount-tendered"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={amountTendered}
                disabled={Boolean(attempt)}
                onChange={(event) => setTenderedValue(event.target.value)}
                className="min-w-0 flex-1 bg-transparent py-2 text-right text-xl font-bold tabular-nums outline-none"
              />
            </div>
            <div className="rounded-md bg-muted/50 p-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">
                  {Number(amountTendered) >= total ? 'Perkiraan kembalian' : 'Kurang bayar'}
                </span>
                <span
                  className={`font-semibold tabular-nums ${Number(amountTendered) < total ? 'text-destructive' : ''}`}
                >
                  {Number(amountTendered) < total ? '-' : ''}
                  {formatRupiah(Math.abs(Number(amountTendered) - total))}
                </span>
              </div>
            </div>
          </div>
        )}

        {!paymentOrder && paymentMethod === 'qr_payment' && (
          <p className="mt-4 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
            QRIS diminta dari server saat checkout. Pembayaran akan berstatus menunggu sampai
            diverifikasi.
          </p>
        )}

        {attempt && (
          <p role="status" className="mt-4 rounded-md bg-dagana-warning-container p-3 text-sm">
            Hasil checkout belum pasti. Retry menggunakan nominal, key, dan item yang sama.
          </p>
        )}
        {(storageError || checkoutError || confirmError || orderError) && (
          <p role="alert" className="mt-3 rounded-md bg-destructive/5 p-3 text-sm text-destructive">
            {storageError ?? checkoutError ?? confirmError ?? orderError}
          </p>
        )}

        {isPending && (
          <div className="mt-4 space-y-3">
            <p role="status" className="rounded-md bg-dagana-warning-container p-3 text-sm">
              Pembayaran masih menunggu konfirmasi server.
            </p>
            {qrPayload ? (
              <>
                <label className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={confirmQrPayment}
                    onChange={(event) => onConfirmQrPayment(event.target.checked)}
                    disabled={!canConfirmPayment || isConfirmPending}
                    className="mt-1 size-4 accent-dagana-primary"
                  />
                  <span>
                    Saya sudah memverifikasi pembayaran pada kanal merchant.
                    {!canConfirmPayment && (
                      <span className="mt-1 block text-xs text-muted-foreground">
                        Izin `payments.create` diperlukan untuk konfirmasi.
                      </span>
                    )}
                  </span>
                </label>
                <Button
                  type="button"
                  className="min-h-12 w-full"
                  disabled={!confirmQrPayment || !canConfirmPayment || isConfirmPending}
                  onClick={onConfirmPayment}
                >
                  {isConfirmPending ? 'Memverifikasi...' : 'Konfirmasi pembayaran'}
                </Button>
              </>
            ) : (
              <p className="rounded-md border border-dagana-warning/20 p-3 text-sm text-muted-foreground">
                QRIS belum tersedia dari server. Tidak ada QR yang dibuat di perangkat ini.
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                disabled={isRefreshingOrder || !canReadOrders}
                onClick={onRefreshOrder}
              >
                {isRefreshingOrder ? 'Memuat...' : 'Muat status'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                onClick={onShowPendingReceipt}
              >
                Buka receipt
              </Button>
            </div>
          </div>
        )}

        {!paymentOrder && (
          <Button
            type="button"
            className="mt-auto min-h-12 w-full"
            disabled={
              !cart.length ||
              isCheckoutPending ||
              Boolean(storageError) ||
              (paymentMethod === 'cash' && !canSubmitCash)
            }
            onClick={attempt ? onRetryCheckout : onCheckout}
          >
            {isCheckoutPending
              ? 'Memproses transaksi...'
              : attempt
                ? 'Retry checkout yang sama'
                : 'Konfirmasi dan bayar'}
          </Button>
        )}
      </section>

      {paymentMethod === 'cash' && !paymentOrder ? (
        <section
          aria-labelledby="pos-cash-keypad"
          className="flex min-h-0 flex-col rounded-lg border bg-card p-4"
        >
          <h2 id="pos-cash-keypad" className="text-section-title">
            <Banknote aria-hidden="true" className="mr-2 inline size-5" />
            Nominal tunai
          </h2>
          <div className="mt-3 grid grid-cols-3 grid-rows-2 gap-2">
            {QUICK_CASH_AMOUNTS.map((amount) =>
              amount === 0 ? (
                <Button
                  key={amount}
                  type="button"
                  variant="outline"
                  className="min-h-7 rounded-3xl text-sm tabular-nums"
                  disabled={Boolean(attempt)}
                  onClick={() => addCashAmount(Math.abs(Number(amountTendered) - total))}
                >
                  Uang Pas
                </Button>
              ) : (
                <Button
                  key={amount}
                  type="button"
                  variant="outline"
                  className="min-h-7 rounded-3xl text-sm tabular-nums"
                  aria-label={`+Rp${formatNumber(amount)}`}
                  disabled={Boolean(attempt)}
                  onClick={() => addCashAmount(amount)}
                >
                  {formatNumber(amount)}
                </Button>
              ),
            )}
          </div>
          <div className="mt-auto grid grid-cols-3 gap-2 pt-3">
            {CASH_KEYS.map((key) => (
              <Button
                key={key}
                type="button"
                variant="outline"
                className={`min-h-12 text-base tabular-nums ${key === 'clear' ? 'row-span-2 text-destructive' : ''}`}
                aria-label={
                  key === 'backspace'
                    ? 'Hapus digit terakhir'
                    : key === 'clear'
                      ? 'Bersihkan jumlah dibayar'
                      : `Nominal ${key}`
                }
                disabled={Boolean(attempt)}
                onClick={() => handleCashKey(key)}
              >
                {key === 'backspace' ? (
                  <Delete aria-hidden="true" className="size-4" />
                ) : key === 'clear' ? (
                  'C'
                ) : (
                  key
                )}
              </Button>
            ))}
          </div>
        </section>
      ) : (
        <section
          aria-labelledby="pos-qris-heading"
          className="flex min-h-0 flex-col items-center rounded-lg border bg-card p-4 text-center"
        >
          <h2 id="pos-qris-heading" className="text-section-title">
            <QrCode aria-hidden="true" className="mr-2 inline size-5" />
            QRIS
          </h2>
          {qrPayload ? (
            <>
              <div className="my-auto rounded-lg bg-white p-3">
                <QRCodeSVG value={qrPayload} size={192} level="M" includeMargin />
              </div>
              <p className="text-sm font-medium">Pindai untuk membayar</p>
              {payment && (
                <Badge className={`mt-2 ${paymentStatusClass(payment.status)}`}>
                  {paymentStatusLabel(payment.status)}
                </Badge>
              )}
            </>
          ) : (
            <div
              role="status"
              className="my-auto flex min-h-44 w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-5 text-sm text-muted-foreground"
            >
              <QrCode aria-hidden="true" className="size-8" />
              <p>
                {paymentOrder
                  ? 'QRIS belum tersedia dari server.'
                  : 'Kode QR akan ditampilkan jika server menyediakan payload.'}
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
