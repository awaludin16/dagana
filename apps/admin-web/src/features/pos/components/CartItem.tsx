import { Button } from '@/components/ui/button'
import { Minus, Plus, Trash } from '@phosphor-icons/react'

interface CartItemProps {
  id: number
  name: string
  price: number
  qty: number
  onInc: (id: number) => void
  onDec: (id: number) => void
  onRemove: (id: number) => void
  disabled: boolean
}

export function CartItem({
  id,
  name,
  price,
  qty,
  onInc,
  onDec,
  onRemove,
  disabled,
}: CartItemProps) {
  const subtotal = price * qty

  return (
    <div className="flex items-center justify-between gap-2 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="text-xs text-muted-foreground">
          Rp {price.toLocaleString('id-ID')} × {qty}
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="icon"
          className="size-9"
          onClick={() => onDec(id)}
          disabled={disabled || qty <= 1}
          aria-label="Kurangi jumlah"
        >
          <Minus className="size-4" aria-hidden="true" />
        </Button>
        <span className="w-8 text-center text-sm tabular-nums" aria-live="polite">
          {qty}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="size-9"
          onClick={() => onInc(id)}
          disabled={disabled}
          aria-label="Tambah jumlah"
        >
          <Plus className="size-4" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 text-destructive"
          onClick={() => onRemove(id)}
          disabled={disabled}
          aria-label="Hapus dari keranjang"
        >
          <Trash className="size-4" aria-hidden="true" />
        </Button>
      </div>
      <p className="w-20 text-right text-sm font-semibold tabular-nums">
        Rp {subtotal.toLocaleString('id-ID')}
      </p>
    </div>
  )
}
