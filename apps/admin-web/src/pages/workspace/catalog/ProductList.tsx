import { Eye, Pencil } from 'lucide-react'

import { ProductStatus, ProductThumbnail } from '@/components/ProductPresentation'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatRupiah } from '@/lib/order-format'
import type { Product } from '@/types'

import { StockCell } from './StockCell'

export function ProductList({
  items,
  outletId,
  canUpdateStock,
  onEditStock,
  onView,
}: {
  items: Product[]
  outletId?: number
  canUpdateStock: boolean
  onEditStock: (item: Product) => void
  onView: (item: Product) => void
}) {
  const editStock = (item: Product) =>
    outletId && canUpdateStock ? (
      <Button
        type="button"
        variant="original"
        size="icon"
        className="text-muted-foreground hover:text-foreground"
        aria-label={`Ubah stok ${item.name}`}
        onClick={() => onEditStock(item)}
      >
        <Pencil aria-hidden="true" />
      </Button>
    ) : null

  const hasTrackedStock = items.some((item) => item.stock_quantity != null)
  const outletSelected = outletId !== undefined

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="p-4">Menu</TableHead>
              <TableHead className="p-4">Kategori</TableHead>
              <TableHead className="p-4">Harga</TableHead>
              {hasTrackedStock ? <TableHead className="p-4">Stok</TableHead> : null}
              <TableHead className="p-4">Status</TableHead>
              <TableHead className="p-4">Tindakan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="p-4">
                  <div className="flex items-center gap-3">
                    <ProductThumbnail item={item} />
                    <span className="font-medium">{item.name}</span>
                  </div>
                </TableCell>
                <TableCell className="p-4 text-muted-foreground">
                  {item.category?.name ?? 'Tanpa kategori'}
                </TableCell>
                <TableCell className="p-4 tabular-nums">{formatRupiah(item.price)}</TableCell>
                {hasTrackedStock ? (
                  <TableCell className="p-4">
                    <StockCell item={item} />
                  </TableCell>
                ) : null}
                <TableCell className="p-4">
                  <ProductStatus item={item} outletSelected={outletSelected} />
                </TableCell>
                <TableCell className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {editStock(item)}
                    <Button
                      type="button"
                      variant="original"
                      size="icon"
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={`Lihat detail ${item.name}`}
                      onClick={() => onView(item)}
                    >
                      <Eye aria-hidden="true" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ul className="space-y-3 md:hidden">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onView(item)}
              aria-label={`Lihat detail ${item.name}`}
              className="w-full space-y-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
            >
              <div className="flex items-center gap-3">
                <ProductThumbnail item={item} />
                <span className="min-w-0 flex-1 break-words font-semibold">{item.name}</span>
                <ProductStatus item={item} outletSelected={outletSelected} />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-semibold tabular-nums">{formatRupiah(item.price)}</span>
                {hasTrackedStock ? <StockCell item={item} /> : null}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}
