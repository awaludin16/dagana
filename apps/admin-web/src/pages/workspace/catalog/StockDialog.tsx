import { useState, type FormEvent } from 'react'

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
import { apiErrorMessage } from '@/lib/form-errors'
import type { Product } from '@/types'

export function StockDialog({
  item,
  outletName,
  isSaving,
  onClose,
  onSubmit,
}: {
  item: Product
  outletName: string
  isSaving: boolean
  onClose: () => void
  onSubmit: (
    quantity: number | null,
    lowStockThreshold: number | null,
    reason?: string,
  ) => Promise<void>
}) {
  const [quantity, setQuantity] = useState(
    item.stock_quantity == null ? '' : String(item.stock_quantity),
  )
  const [threshold, setThreshold] = useState(
    item.low_stock_threshold == null ? '10' : String(item.low_stock_threshold),
  )
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = quantity.trim()
    const parsed = value === '' ? null : Number(value)
    const thresholdValue = threshold.trim() === '' ? 10 : Number(threshold)

    if (parsed !== null && (!Number.isInteger(parsed) || parsed < 0)) {
      setError('Stok harus berupa bilangan bulat mulai dari 0.')
      return
    }

    if (!Number.isInteger(thresholdValue) || thresholdValue < 0) {
      setError('Batas stok harus bilangan bulat mulai dari 0.')
      return
    }

    setError(null)
    try {
      await onSubmit(parsed, parsed === null ? null : thresholdValue, reason.trim() || undefined)
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Stok belum dapat disimpan. Coba lagi.'))
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !isSaving && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ubah stok menu</DialogTitle>
          <DialogDescription>
            {item.name} · {outletName}. Kosongkan stok untuk mengembalikan menu ke tanpa batas.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-5" onSubmit={save} noValidate>
          {error ? (
            <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <FormField
            id="stock-quantity"
            label="Stok tersedia"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            hint="Kosong = tanpa batas. Isi 0 untuk menandai habis."
          />
          <FormField
            id="stock-threshold"
            label="Peringatan stok menipis (opsional)"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={threshold}
            onChange={(event) => setThreshold(event.target.value)}
            hint="Default 10 porsi. Isi 0 untuk menonaktifkan peringatan."
          />
          <FormField
            id="stock-reason"
            label="Alasan (opsional)"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Misalnya: stok awal, stok rusak"
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Batal
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Menyimpan...' : 'Simpan stok'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
