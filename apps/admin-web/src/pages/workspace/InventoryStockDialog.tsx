import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'

import { useAccess } from '@/auth/useAccess'
import { FormField } from '@/components/FormField'
import { ErrorState, LoadingState } from '@/components/PageFeedback'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { api, ApiError } from '@/lib/api'
import { apiErrorMessage } from '@/lib/form-errors'
import { formatNumber, formatOrderDate } from '@/lib/order-format'
import type { InventoryItem, StockAdjustmentInput, StockMovement } from '@/types'

const MOVEMENT_PER_PAGE = 50

export function formatQuantity(value: number, unit: string): string {
  return `${formatNumber(value)} ${unit}`
}

function formatSignedQuantity(value: number, unit: string): string {
  return `${value > 0 ? '+' : ''}${formatNumber(value)} ${unit}`
}

export function InventoryStockDialog({
  item,
  onClose,
}: {
  item: InventoryItem
  onClose: () => void
}) {
  const access = useAccess()
  const queryClient = useQueryClient()
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID())
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const detail = useQuery({
    queryKey: ['inventory', 'item', item.id],
    queryFn: () => api.inventoryItem(item.id),
  })

  const movements = useQuery({
    queryKey: ['inventory', 'movements', item.id],
    queryFn: () => api.inventoryMovements(item.id, { per_page: MOVEMENT_PER_PAGE }),
  })

  const adjust = useMutation({
    mutationFn: (input: StockAdjustmentInput) => api.adjustInventoryStock(item.id, input),
    onSuccess: async () => {
      setQuantity('')
      setReason('')
      setFieldErrors({})
      setFormError(null)
      setNotice('Adjustment tersimpan. Saldo diperbarui dari server.')
      // Key baru untuk adjustment berikutnya; retry attempt yang gagal tetap memakai key lama.
      setIdempotencyKey(crypto.randomUUID())
      await queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
    onError: (error) => {
      setNotice(null)
      if (error instanceof ApiError) {
        const serverFields = Object.fromEntries(
          Object.entries(error.errors).map(([field, messages]) => [field, messages[0] ?? '']),
        )
        setFieldErrors(serverFields)
        setFormError(serverFields.item ?? null)
        return
      }
      setFormError(apiErrorMessage(error, 'Adjustment gagal disimpan. Coba lagi.'))
    },
  })

  const current = detail.data ?? item
  const stock = current.current_stock
  const parsedQuantity = quantity.trim() === '' ? null : Number(quantity)
  const previewStock =
    parsedQuantity !== null && Number.isInteger(parsedQuantity) ? stock + parsedQuantity : null

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    setNotice(null)
    setFieldErrors({})

    if (parsedQuantity === null || !Number.isInteger(parsedQuantity) || parsedQuantity === 0) {
      setFieldErrors({
        quantity_change: 'Masukkan jumlah bilangan bulat, positif masuk atau negatif keluar.',
      })
      return
    }

    if (!reason.trim()) {
      setFieldErrors({ reason: 'Alasan adjustment wajib diisi.' })
      return
    }

    adjust.mutate({
      quantity_change: parsedQuantity,
      reason: reason.trim(),
      idempotency_key: idempotencyKey,
    })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !adjust.isPending && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Stok {current.name}</DialogTitle>
          <DialogDescription>
            Saldo dihitung server dari ledger stock movement. Perubahan hanya tersimpan melalui API
            adjustment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <dl className="grid gap-3 rounded-lg border bg-muted/30 p-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Saldo saat ini (server)</dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums">
                {formatQuantity(stock, current.unit)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Ambang low stock</dt>
              <dd className="mt-1 font-semibold tabular-nums">
                {current.low_stock_threshold === null
                  ? 'Tidak dipantau'
                  : formatQuantity(current.low_stock_threshold, current.unit)}
              </dd>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:col-span-2">
              {stock === 0 ? <Badge variant="destructive">Stok habis</Badge> : null}
              {current.is_low_stock ? <Badge variant="destructive">Stok rendah</Badge> : null}
              <Badge variant={current.is_active ? 'default' : 'outline'}>
                {current.is_active ? 'Aktif' : 'Nonaktif'}
              </Badge>
            </div>
          </dl>

          <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
            {detail.isFetching ? 'Menyinkronkan saldo dari server...' : 'Tersinkron dengan server.'}
          </p>

          {notice ? (
            <p
              role="status"
              className="rounded-lg border border-dagana-success/20 bg-dagana-success-container px-3 py-2 text-sm text-dagana-success"
            >
              {notice}
            </p>
          ) : null}

          {formError ? (
            <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {formError}
            </p>
          ) : null}

          {!current.is_active ? (
            <p className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
              Item nonaktif. Aktifkan item melalui Ubah item sebelum mencatat adjustment baru.
            </p>
          ) : access.can('inventory.adjust') ? (
            <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-4" noValidate>
              <h3 className="text-sm font-semibold">Catat stock adjustment</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  id={`stock-adjust-quantity-${item.id}`}
                  label="Jumlah perubahan"
                  type="number"
                  step="1"
                  inputMode="numeric"
                  placeholder="contoh: 500 atau -3"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  error={fieldErrors.quantity_change}
                  hint="Positif menambah, negatif mengurangi stok."
                />
                <FormField
                  id={`stock-adjust-reason-${item.id}`}
                  label="Alasan"
                  placeholder="contoh: stok opname, bahan rusak"
                  maxLength={1000}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  error={fieldErrors.reason}
                />
              </div>
              {previewStock !== null && previewStock < 0 ? (
                <p role="alert" className="text-sm text-destructive">
                  Perkiraan saldo menjadi {formatQuantity(previewStock, current.unit)}. Server
                  menolak adjustment yang membuat saldo negatif.
                </p>
              ) : null}
              <Button type="submit" className="min-h-11" disabled={adjust.isPending}>
                {adjust.isPending ? 'Menyimpan adjustment...' : 'Catat adjustment'}
              </Button>
            </form>
          ) : null}

          <section className="space-y-2" aria-label="Histori stock movement">
            <h3 className="text-sm font-semibold">Histori movement (server)</h3>
            {movements.isPending ? (
              <LoadingState label="Memuat stock movement..." />
            ) : movements.isError ? (
              <ErrorState
                message={apiErrorMessage(movements.error, 'Stock movement belum dapat dimuat.')}
                onRetry={() => void movements.refetch()}
              />
            ) : movements.data.data.length === 0 ? (
              <p className="rounded-lg border bg-card p-3 text-sm text-muted-foreground">
                Belum ada movement. Saldo masih nol.
              </p>
            ) : (
              <ul className="divide-y rounded-lg border bg-card">
                {movements.data.data.map((movement: StockMovement) => (
                  <li
                    key={movement.id}
                    className="flex flex-col gap-1 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{movement.reason}</p>
                      <p className="text-muted-foreground">
                        {formatOrderDate(movement.created_at)} · Anggota #{movement.membership_id}
                      </p>
                    </div>
                    <p
                      className={
                        movement.quantity_change < 0
                          ? 'shrink-0 font-semibold tabular-nums text-dagana-danger'
                          : 'shrink-0 font-semibold tabular-nums text-dagana-success'
                      }
                    >
                      {formatSignedQuantity(movement.quantity_change, current.unit)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            {movements.data && movements.data.meta.total > movements.data.data.length ? (
              <p className="text-sm text-muted-foreground">
                Menampilkan {movements.data.data.length} dari {movements.data.meta.total} movement
                terbaru.
              </p>
            ) : null}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
