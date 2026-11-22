import { Archive, EllipsisVertical, Pencil, RotateCcw, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ItemActions({
  itemName,
  canUpdate,
  canDeactivate,
  canActivate = false,
  canDelete = false,
  onEdit,
  onDeactivate,
  onActivate,
}: {
  itemName: string
  canUpdate: boolean
  canDeactivate: boolean
  canActivate?: boolean
  canDelete?: boolean
  onEdit: () => void
  onDeactivate: () => void
  onActivate?: () => void
}) {
  if (!canUpdate) return null

  return (
    <div className="flex justify-start gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="original"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            aria-label={`Aksi lain untuk ${itemName}`}
          >
            <EllipsisVertical aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onEdit}>
            <Pencil aria-hidden="true" />
            Edit
          </DropdownMenuItem>
          {canDeactivate ? (
            <DropdownMenuItem onSelect={onDeactivate}>
              <Archive aria-hidden="true" />
              Nonaktifkan
            </DropdownMenuItem>
          ) : null}
          {canActivate ? (
            <DropdownMenuItem onSelect={onActivate}>
              <RotateCcw aria-hidden="true" />
              Aktifkan kembali
            </DropdownMenuItem>
          ) : null}
          {canDelete ? (
            <>
              <DropdownMenuSeparator />
              {/* visual only: kebijakan katalog masih deaktivasi, belum hapus permanen */}
              <DropdownMenuItem
                disabled
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <Trash2 aria-hidden="true" />
                Hapus permanen
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
