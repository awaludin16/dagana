import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ShoppingCart } from '@phosphor-icons/react'
import { CartItem } from './CartItem'
import type { CartItem as CartItemType } from '../pages/PosPage'
import type { PaymentMethod } from '@/types/order.types'

interface CartSheetProps {
  items: CartItemType[]
  onInc: (id: number) => void
  onDec: (id: number) => void
  onRemove: (id: number) => void
  onCheckout: (method: PaymentMethod) => void
  paymentMethod: PaymentMethod
  onPaymentMethodChange: (method: PaymentMethod) => void
  canCheckout: boolean
  isCheckingOut: boolean
  isCheckoutLocked: boolean
  checkoutError: string | null
}

export function CartSheet({
  items,
  onInc,
  onDec,
  onRemove,
  onCheckout,
  paymentMethod,
  onPaymentMethodChange,
  canCheckout,
  isCheckingOut,
  isCheckoutLocked,
  checkoutError,
}: CartSheetProps) {
  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0)
  const count = items.reduce((sum, item) => sum + item.qty, 0)

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ShoppingCart className="size-4" />
          <span className="hidden sm:inline">Keranjang</span>
          <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground tabular-nums">
            {count}
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Keranjang ({count} item)</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-auto overscroll-contain py-4">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keranjang masih kosong.</p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <CartItem
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  price={item.price}
                  qty={item.qty}
                  onInc={onInc}
                  onDec={onDec}
                  onRemove={onRemove}
                  disabled={isCheckoutLocked}
                />
              ))}
            </div>
          )}
        </div>
        <div className="pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total</span>
            <span className="text-lg font-semibold tabular-nums">
              Rp {total.toLocaleString('id-ID')}
            </span>
          </div>
          <label className="mt-3 block space-y-1 text-sm">
            <span>Metode pembayaran</span>
            <select
              className="min-h-11 w-full rounded-md border border-input bg-background px-3"
              value={paymentMethod}
              onChange={(event) => onPaymentMethodChange(event.target.value as PaymentMethod)}
              disabled={isCheckoutLocked}
            >
              <option value="cash">Tunai</option>
              <option value="qr_payment">QR payment</option>
              <option value="bank_transfer">Transfer bank</option>
              <option value="debit">Debit</option>
              <option value="credit">Kredit</option>
            </select>
          </label>
          {checkoutError && <p className="mt-2 text-sm text-destructive" role="alert">{checkoutError}</p>}
          {!canCheckout && (
            <p className="mt-2 text-sm text-muted-foreground" role="status">
              Anda tidak memiliki izin untuk membuat transaksi.
            </p>
          )}
          <Button
            className="mt-4 w-full"
            disabled={items.length === 0 || !canCheckout || isCheckingOut}
            onClick={() => onCheckout(paymentMethod)}
          >
            {isCheckingOut ? 'Memproses…' : 'Checkout'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
