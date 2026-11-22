import { Badge } from '@/components/ui/badge'
import type { Product } from '@/types'

export function StockCell({ item }: { item: Product }) {
  if (item.stock_quantity == null) {
    return <span className="text-muted-foreground">—</span>
  }

  if (item.stock_quantity === 0) {
    return <Badge variant="destructive">Habis</Badge>
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 tabular-nums">
      {item.stock_quantity}
      {item.low_stock ? (
        <Badge variant="outline" className="border-dagana-warning/40 text-dagana-warning">
          Menipis
        </Badge>
      ) : null}
    </span>
  )
}
