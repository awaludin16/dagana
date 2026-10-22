import { cn } from '@/lib/utils'
import type { CatalogMenu } from '@/types/catalog.types'

interface ProductCardProps {
  product: CatalogMenu
  onAdd: (product: CatalogMenu) => void
}

export function ProductCard({ product, onAdd }: ProductCardProps) {
  return (
    <button
      type="button"
      onClick={() => onAdd(product)}
      className={cn(
        'flex flex-col items-start justify-between rounded-lg border bg-card p-3 text-left transition-colors',
        'hover:border-primary/60 active:bg-accent/30',
        'min-h-24'
      )}
    >
      <div>
        <p className="text-sm font-medium leading-tight">{product.name}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {product.category?.name ?? 'Tanpa kategori'}
        </p>
      </div>
      <p className="mt-2 text-sm font-semibold">
        Rp {product.price.toLocaleString('id-ID')}
      </p>
    </button>
  )
}
