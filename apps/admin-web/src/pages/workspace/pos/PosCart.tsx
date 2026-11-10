import { Minus, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { formatRupiah } from '@/lib/order-format'

import type { CartLine } from '@/types/pos'

type Props = {
  cart: CartLine[]
  previewTotal: number
  hasReceipt: boolean
  hasOutlet: boolean
  hasAttempt: boolean
  hasStorageError: boolean
  onClear: () => void
  onChangeQuantity: (productId: number, amount: number) => void
  onRemove: (productId: number) => void
  onContinue: () => void
}

export function PosCart({
  cart,
  previewTotal,
  hasReceipt,
  hasOutlet,
  hasAttempt,
  hasStorageError,
  onClear,
  onChangeQuantity,
  onRemove,
  onContinue,
}: Props) {
  return (
    <section aria-labelledby="pos-cart-heading" className="flex min-h-0 min-w-0 flex-col bg-card">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3 sm:px-5">
        <h2 id="pos-cart-heading" className="text-section-title">
          Cart
        </h2>
        {cart.length > 0 && !hasAttempt && (
          <Button type="button" variant="ghost" className="text-muted-foreground" onClick={onClear}>
            <Trash2 aria-hidden="true" className="size-4" /> Kosongkan
          </Button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 sm:px-4">
        {cart.length === 0 ? (
          <div className="grid min-h-24 h-full place-items-center text-center text-sm text-muted-foreground">
            <p>Pilih menu untuk mulai menambahkan item.</p>
          </div>
        ) : (
          <ul className="divide-y">
            {cart.map((line) => (
              <li key={line.product_id} className="flex items-center justify-between gap-2 py-3">
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium">{line.product_name}</p>
                  <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                    {formatRupiah(line.product_price)} × {line.quantity}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={`Kurangi ${line.product_name}`}
                    disabled={hasAttempt}
                    onClick={() => onChangeQuantity(line.product_id, -1)}
                  >
                    <Minus aria-hidden="true" className="size-4" />
                  </Button>
                  <span
                    className="w-7 text-center text-sm font-semibold tabular-nums"
                    aria-label={`${line.quantity} buah`}
                  >
                    {line.quantity}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={`Tambah ${line.product_name}`}
                    disabled={hasAttempt}
                    onClick={() => onChangeQuantity(line.product_id, 1)}
                  >
                    <Plus aria-hidden="true" className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Hapus ${line.product_name} dari cart`}
                    disabled={hasAttempt}
                    onClick={() => onRemove(line.product_id)}
                  >
                    <Trash2 aria-hidden="true" className="size-4 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!hasReceipt && (
        <div className="shrink-0 space-y-3 border-t px-3 py-3 sm:px-4">
          <div className="flex items-center justify-between border-t pt-3">
            <span className="text-sm text-muted-foreground">Estimasi</span>
            <span className="text-lg font-bold tabular-nums">{formatRupiah(previewTotal)}</span>
          </div>
          <Button
            type="button"
            className="min-h-12 w-full"
            disabled={cart.length === 0 || !hasOutlet || hasStorageError || hasAttempt}
            onClick={onContinue}
          >
            Lanjut ke pembayaran
          </Button>
        </div>
      )}
    </section>
  )
}
