import { Pencil } from 'lucide-react'

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

import { ItemActions } from './ItemActions'
import { ProductStatus } from './ProductStatus'
import { StockCell } from './StockCell'

export function ProductList({
  items,
  canUpdate,
  canDelete,
  outletId,
  canUpdateStock,
  onEditStock,
  onEdit,
  onDeactivate,
  onActivate,
}: {
  items: Product[]
  canUpdate: boolean
  canDelete: boolean
  outletId?: number
  canUpdateStock: boolean
  onEditStock: (item: Product) => void
  onEdit: (item: Product) => void
  onDeactivate: (item: Product) => void
  onActivate: (item: Product) => void
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
                <TableCell className="p-4 font-medium">{item.name}</TableCell>
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
                  <ProductStatus item={item} outletSelected={outletId !== undefined} />
                </TableCell>
                <TableCell className="p-4">
                  <div className="flex flex-wrap max-w-48 justify-between items-center gap-2">
                    {editStock(item)}
                    <ItemActions
                      itemName={item.name}
                      canUpdate={canUpdate}
                      canDelete={canDelete}
                      canDeactivate={item.is_active}
                      canActivate={!item.is_active}
                      onEdit={() => onEdit(item)}
                      onDeactivate={() => onDeactivate(item)}
                      onActivate={() => onActivate(item)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ul className="space-y-3 md:hidden">
        {items.map((item) => (
          <li key={item.id} className="rounded-lg border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="break-words font-semibold">{item.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.category?.name ?? 'Tanpa kategori'}
                </p>
              </div>
              <ProductStatus item={item} outletSelected={outletId !== undefined} />
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-semibold tabular-nums">{formatRupiah(item.price)}</span>
                {hasTrackedStock ? <StockCell item={item} /> : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {editStock(item)}
                <ItemActions
                  itemName={item.name}
                  canUpdate={canUpdate}
                  canDelete={canDelete}
                  canDeactivate={item.is_active}
                  canActivate={!item.is_active}
                  onEdit={() => onEdit(item)}
                  onDeactivate={() => onDeactivate(item)}
                  onActivate={() => onActivate(item)}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
