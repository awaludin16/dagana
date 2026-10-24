import { cn } from '@/lib/utils'
import type { CatalogMenu } from '@/types/catalog.types'

interface ProductCardProps {
  product: CatalogMenu
  onAdd: (product: CatalogMenu) => void
  disabled: boolean
}

export function ProductCard({ product, onAdd, disabled }: ProductCardProps) {
  return (
    <button
      type="button"
      onClick={() => onAdd(product)}
      disabled={disabled}
      className={cn(
        'flex min-h-24 flex-col items-start justify-between rounded-lg border bg-card p-3 text-left transition-colors duration-150 motion-reduce:transition-none',
        'hover:border-primary/60 hover:bg-soft-primary/40',
        'active:bg-soft-primary',
        'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
        'disabled:cursor-not-allowed disabled:border-border disabled:bg-card disabled:text-muted-foreground',
      )}
    >
      <div className="min-w-0">
        <p className="break-words text-sm font-medium leading-tight">{product.name}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {product.category?.name ?? 'Tanpa kategori'}
        </p>
      </div>
      <p className="mt-2 text-sm font-semibold tabular-nums">
        Rp {product.price.toLocaleString('id-ID')}
      </p>
    </button>
  )
}
