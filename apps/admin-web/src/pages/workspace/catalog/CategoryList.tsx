import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Category } from '@/types'

import { ItemActions } from './ItemActions'

export function CategoryList({
  items,
  canUpdate,
  canDelete,
  onEdit,
  onDeactivate,
  onActivate,
}: {
  items: Category[]
  canUpdate: boolean
  canDelete: boolean
  onEdit: (item: Category) => void
  onDeactivate: (item: Category) => void
  onActivate: (item: Category) => void
}) {
  return (
    <>
      <div className="hidden md:block">
        <Table className="min-w-[32rem]">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Kategori</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Tindakan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>
                  <Badge variant={item.is_active ? 'default' : 'outline'}>
                    {item.is_active ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </TableCell>
                <TableCell>
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ul className="space-y-3 md:hidden">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-lg border p-4"
          >
            <div className="min-w-0">
              <h2 className="break-words font-semibold">{item.name}</h2>
              <Badge variant={item.is_active ? 'default' : 'outline'} className="mt-2">
                {item.is_active ? 'Aktif' : 'Nonaktif'}
              </Badge>
            </div>
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
          </li>
        ))}
      </ul>
    </>
  )
}
