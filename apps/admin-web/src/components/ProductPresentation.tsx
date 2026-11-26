import { ImageIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import type { Product } from '@/types'

export function ProductThumbnail({ item }: { item: Product }) {
  if (!item.image_url) {
    return (
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground"
      >
        <ImageIcon className="size-4" />
      </span>
    )
  }

  return (
    <img
      src={item.image_url}
      alt=""
      loading="lazy"
      className="size-10 shrink-0 rounded-md border object-cover"
    />
  )
}

export function ProductStatus({
  item,
  outletSelected,
}: {
  item: Product
  outletSelected: boolean
}) {
  const available = outletSelected
    ? (item.is_available_at_outlet ?? item.is_available)
    : item.is_available
  const availabilityLabel = !outletSelected
    ? available
      ? 'Tersedia'
      : 'Habis'
    : !item.is_available
      ? 'Habis di semua outlet'
      : item.stock_quantity === 0 || !available
        ? 'Habis di outlet ini'
        : 'Tersedia di outlet ini'

  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge
        variant={item.is_active ? 'default' : 'outline'}
        className={!item.is_active ? 'bg-destructive/10 border-destructive text-destructive' : ''}
      >
        {item.is_active ? 'Aktif' : 'Nonaktif'}
      </Badge>
      <Badge variant={available ? 'secondary' : 'destructive'}>{availabilityLabel}</Badge>
      {outletSelected && item.low_stock ? (
        <Badge variant="outline" className="border-dagana-warning/40 text-dagana-warning">
          Menipis
        </Badge>
      ) : null}
    </div>
  )
}
