import { Button } from '@/components/ui/button'
import { Minus, Plus, Trash } from '@phosphor-icons/react'

interface CartItemProps {
  id: string
  name: string
  price: number
  qty: number
  onInc: (id: string) => void
  onDec: (id: string) => void
  onRemove: (id: string) => void
}

export function CartItem({ id, name, price, qty, onInc, onDec, onRemove }: CartItemProps) {
  const subtotal = price * qty

  return (
    <div className="flex items-center justify-between gap-2 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="text-xs text-muted-foreground">
          Rp {price.toLocaleString('id-ID')} × {qty}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="size-7" onClick={() => onDec(id)} disabled={qty <= 1}>
          <Minus className="size-3.5" />
        </Button>
        <span className="w-8 text-center text-sm tabular-nums">{qty}</span>
        <Button variant="outline" size="icon" className="size-7" onClick={() => onInc(id)}>
          <Plus className="size-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={() => onRemove(id)}>
          <Trash className="size-3.5" />
        </Button>
      </div>
      <p className="w-20 text-right text-sm font-semibold tabular-nums">
        Rp {subtotal.toLocaleString('id-ID')}
      </p>
    </div>
  )
}
