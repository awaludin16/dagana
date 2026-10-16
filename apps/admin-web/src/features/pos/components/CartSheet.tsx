import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ShoppingCart } from '@phosphor-icons/react'
import { CartItem } from './CartItem'
import type { CartItem as CartItemType } from '../pages/PosPage'

interface CartSheetProps {
  items: CartItemType[]
  onInc: (id: string) => void
  onDec: (id: string) => void
  onRemove: (id: string) => void
  onCheckout: () => void
}

export function CartSheet({ items, onInc, onDec, onRemove, onCheckout }: CartSheetProps) {
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
        <div className="flex-1 overflow-auto py-4">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keranjang masih kosong.</p>
          ) : (
            <div className="divide-y">
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
                />
              ))}
            </div>
          )}
        </div>
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total</span>
            <span className="text-lg font-semibold tabular-nums">
              Rp {total.toLocaleString('id-ID')}
            </span>
          </div>
          <Button
            variant="accent"
            className="mt-4 w-full"
            disabled={items.length === 0}
            onClick={onCheckout}
          >
            Checkout
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
