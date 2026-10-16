import { cn } from '@/lib/utils'
import type { PosProduct } from '../mocks/products'

interface ProductCardProps {
  product: PosProduct
  onAdd: (product: PosProduct) => void
}

export function ProductCard({ product, onAdd }: ProductCardProps) {
  return (
    <button
      type="button"
      disabled={!product.available}
      onClick={() => product.available && onAdd(product)}
      className={cn(
        'flex flex-col items-start justify-between rounded-lg border bg-card p-3 text-left transition-colors',
        'hover:border-primary/60 active:bg-accent/30',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'min-h-24'
      )}
    >
      <div>
        <p className="text-sm font-medium leading-tight">{product.name}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {product.available ? 'Tersedia' : 'Tidak tersedia'}
        </p>
      </div>
      <p className="mt-2 text-sm font-semibold">
        Rp {product.price.toLocaleString('id-ID')}
      </p>
    </button>
  )
}
