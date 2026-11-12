import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { FormField } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { apiErrorMessage, applyApiErrors, getFieldError } from '@/lib/form-errors'
import { inventoryItemSchema, type InventoryItemFormValues } from '@/lib/validation'
import type { InventoryItem } from '@/types'

type Props = {
  item?: InventoryItem
  outlets: { id: number; name: string }[]
  defaultOutletId?: number
  isSaving: boolean
  onClose: () => void
  onSubmit: (values: InventoryItemFormValues) => Promise<void>
}

export function InventoryItemFormDialog({
  item,
  outlets,
  defaultOutletId,
  isSaving,
  onClose,
  onSubmit,
}: Props) {
  const form = useForm<InventoryItemFormValues>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: {
      outlet_id: item?.outlet_id ?? defaultOutletId ?? outlets[0]?.id ?? 0,
      name: item?.name ?? '',
      unit: item?.unit ?? '',
      low_stock_threshold: item?.low_stock_threshold ?? null,
      is_active: item?.is_active ?? true,
    },
  })

  async function save(values: InventoryItemFormValues) {
    try {
      await onSubmit(values)
    } catch (error) {
      if (!applyApiErrors(error, form.setError)) {
        form.setError('root.server', {
          message: apiErrorMessage(error, 'Item inventory belum dapat disimpan. Coba lagi.'),
        })
      }
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !isSaving && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? 'Ubah item inventory' : 'Tambah item inventory'}</DialogTitle>
          <DialogDescription>
            Saldo tidak diisi manual. Setiap perubahan stok dicatat sebagai stock movement oleh
            server.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-5" onSubmit={form.handleSubmit(save)} noValidate>
          {form.formState.errors.root?.server ? (
            <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {form.formState.errors.root.server.message}
            </p>
          ) : null}
          <div className="space-y-1.5">
            <label htmlFor="inventory-item-outlet" className="text-sm font-medium">
              Outlet
            </label>
            <select
              id="inventory-item-outlet"
              disabled={Boolean(item)}
              className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:bg-muted/50 disabled:text-muted-foreground"
              {...form.register('outlet_id', { valueAsNumber: true })}
              aria-invalid={Boolean(form.formState.errors.outlet_id)}
              aria-describedby={
                form.formState.errors.outlet_id ? 'inventory-item-outlet-error' : undefined
              }
            >
              <option value={0}>Pilih outlet</option>
              {outlets.map((outlet) => (
                <option key={outlet.id} value={outlet.id}>
                  {outlet.name}
                </option>
              ))}
            </select>
            {form.formState.errors.outlet_id ? (
              <p id="inventory-item-outlet-error" role="alert" className="text-sm text-destructive">
                Pilih outlet terlebih dahulu.
              </p>
            ) : item ? (
              <p className="text-sm text-muted-foreground">
                Outlet tidak dapat dipindahkan setelah item dibuat.
              </p>
            ) : null}
          </div>
          <FormField
            id="inventory-item-name"
            label="Nama item"
            autoComplete="off"
            {...form.register('name')}
            error={getFieldError(form.formState.errors, 'name')}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="inventory-item-unit"
              label="Satuan dasar"
              autoComplete="off"
              placeholder="contoh: g, ml, pcs"
              maxLength={20}
              {...form.register('unit')}
              error={getFieldError(form.formState.errors, 'unit')}
              hint="Tidak ada konversi satuan pada fase ini."
            />
            <FormField
              id="inventory-item-threshold"
              label="Ambang low stock"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              placeholder="Kosongkan bila tidak dipantau"
              {...form.register('low_stock_threshold', {
                setValueAs: (value) => (value === '' ? null : Number(value)),
              })}
              error={getFieldError(form.formState.errors, 'low_stock_threshold')}
              hint="Dalam satuan item. Low stock bila saldo ≤ ambang."
            />
          </div>
          <label
            htmlFor="inventory-item-is-active"
            className="flex min-h-11 items-center gap-3 text-sm"
          >
            <input
              id="inventory-item-is-active"
              type="checkbox"
              className="size-4 accent-primary focus-visible:ring-2 focus-visible:ring-ring"
              {...form.register('is_active')}
            />
            Item aktif dan dapat menerima adjustment
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Batal
            </Button>
            <Button type="submit" disabled={isSaving} className="min-h-11">
              {isSaving ? 'Menyimpan...' : 'Simpan item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
