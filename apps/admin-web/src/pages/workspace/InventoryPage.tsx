import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Archive,
  Boxes,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  ClipboardList,
  Pencil,
  Search,
} from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { useAccess } from '@/auth/useAccess'
import { ErrorState, LoadingState } from '@/components/PageFeedback'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/FormField'
import { InventoryItemFormDialog } from '@/pages/workspace/InventoryItemFormDialog'
import { formatQuantity, InventoryStockDialog } from '@/pages/workspace/InventoryStockDialog'
import { api } from '@/lib/api'
import { apiErrorMessage } from '@/lib/form-errors'
import { formatNumber } from '@/lib/order-format'
import type { InventoryItem, InventoryItemInput } from '@/types'
import type { InventoryItemFormValues } from '@/lib/validation'

const PER_PAGE = 20

type DialogState = { item?: InventoryItem } | null

function activeFilter(value: string): boolean | undefined {
  if (value === 'active') return true
  if (value === 'inactive') return false
  return undefined
}

export function InventoryPage() {
  const access = useAccess()
  const queryClient = useQueryClient()
  const outlets = access.membership?.outlets ?? []

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [active, setActive] = useState('all')
  const [lowOnly, setLowOnly] = useState(false)
  const [outletFilter, setOutletFilter] = useState('')
  const [dialog, setDialog] = useState<DialogState>(null)
  const [archiveTarget, setArchiveTarget] = useState<InventoryItem | null>(null)
  const [stockTarget, setStockTarget] = useState<InventoryItem | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const items = useQuery({
    queryKey: ['inventory', 'list', page, query, active, lowOnly, outletFilter],
    queryFn: () =>
      api.inventoryItems({
        page,
        per_page: PER_PAGE,
        q: query,
        is_active: activeFilter(active),
        low_stock: lowOnly || undefined,
        outlet_id: outletFilter ? Number(outletFilter) : undefined,
      }),
  })

  const saveItem = useMutation({
    mutationFn: ({ item, values }: { item?: InventoryItem; values: InventoryItemFormValues }) => {
      const input: InventoryItemInput = {
        name: values.name.trim(),
        unit: values.unit.trim(),
        low_stock_threshold: values.low_stock_threshold,
        is_active: values.is_active,
      }
      return item
        ? api.updateInventoryItem(item.id, input)
        : api.createInventoryItem({ ...input, outlet_id: values.outlet_id })
    },
    onSuccess: async (_, { item }) => {
      await queryClient.invalidateQueries({ queryKey: ['inventory'] })
      setNotice(item ? 'Item inventory berhasil diperbarui.' : 'Item inventory berhasil dibuat.')
      setDialog(null)
    },
  })

  const deactivate = useMutation({
    mutationFn: (item: InventoryItem) => api.updateInventoryItem(item.id, { is_active: false }),
    onSuccess: async (_, item) => {
      await queryClient.invalidateQueries({ queryKey: ['inventory'] })
      setNotice(
        `Item ${item.name} dinonaktifkan. Histori stock movement tetap tersimpan dan item masih dapat dibaca.`,
      )
      setArchiveTarget(null)
    },
  })

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPage(1)
    setQuery(search.trim())
  }

  function resetFilters() {
    setPage(1)
    setSearch('')
    setQuery('')
    setActive('all')
    setLowOnly(false)
    setOutletFilter('')
  }

  const hasFilters = Boolean(query || active !== 'all' || lowOnly || outletFilter)

  return (
    <section className="space-y-6">
      <header className="flex flex-col justify-between gap-5 border-b pb-6 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">Operasional</p>
          <h1 className="text-page-title tracking-tight">Inventory</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Kelola item dan saldo stok dasar. Saldo dihitung server dari stock movement; inventory
            bersifat opsional dan tidak diperlukan untuk berjualan.
          </p>
        </div>
        {access.can('inventory.create') ? (
          <Button type="button" className="min-h-11 gap-2 px-5" onClick={() => setDialog({})}>
            <CirclePlus aria-hidden="true" className="size-4" />
            Tambah item
          </Button>
        ) : null}
      </header>

      {notice ? (
        <p
          role="status"
          className="rounded-lg border border-dagana-success/20 bg-dagana-success-container px-4 py-3 text-sm text-dagana-success"
        >
          {notice}
        </p>
      ) : null}

      <section className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
        <form className="flex flex-col gap-3 sm:flex-row" onSubmit={submitSearch}>
          <FormField
            id="inventory-search"
            label="Cari item"
            className="h-11"
            containerClassName="flex-1"
            placeholder="Ketik nama item..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Button type="submit" variant="outline" className="mt-auto min-h-11 gap-2">
            <Search aria-hidden="true" className="size-4" />
            Cari
          </Button>
        </form>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {outlets.length > 1 ? (
            <label className="space-y-1.5 text-sm font-medium">
              Filter outlet
              <select
                className="h-11 w-full rounded-lg border border-input bg-background px-3 font-normal outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                value={outletFilter}
                onChange={(event) => {
                  setPage(1)
                  setOutletFilter(event.target.value)
                }}
              >
                <option value="">Semua outlet</option>
                {outlets.map((outlet) => (
                  <option key={outlet.id} value={outlet.id}>
                    {outlet.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="space-y-1.5 text-sm font-medium">
            Status item
            <select
              className="h-11 w-full rounded-lg border border-input bg-background px-3 font-normal outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
              value={active}
              onChange={(event) => {
                setPage(1)
                setActive(event.target.value)
              }}
            >
              <option value="all">Semua</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </label>
          <label
            htmlFor="inventory-low-only"
            className="flex min-h-11 items-center gap-3 self-end text-sm"
          >
            <input
              id="inventory-low-only"
              type="checkbox"
              className="size-4 accent-primary focus-visible:ring-2 focus-visible:ring-ring"
              checked={lowOnly}
              onChange={(event) => {
                setPage(1)
                setLowOnly(event.target.checked)
              }}
            />
            Hanya stok rendah
          </label>
        </div>

        {items.isPending ? (
          <LoadingState label="Memuat item inventory..." />
        ) : items.isError ? (
          <ErrorState
            message={apiErrorMessage(
              items.error,
              'Item inventory belum dapat dimuat. Periksa koneksi lalu coba lagi.',
            )}
            onRetry={() => void items.refetch()}
          />
        ) : items.data.data.length === 0 ? (
          <div className="rounded-lg border border-dashed px-5 py-12 text-center">
            <Boxes aria-hidden="true" className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              {hasFilters
                ? 'Tidak ada item yang cocok dengan pencarian atau filter.'
                : 'Belum ada item inventory. Inventory opsional; tambahkan item bila ingin memantau stok.'}
            </p>
            {hasFilters ? (
              <Button type="button" variant="outline" className="mt-4" onClick={resetFilters}>
                Hapus filter
              </Button>
            ) : null}
          </div>
        ) : (
          <InventoryList
            items={items.data.data}
            outlets={outlets}
            canUpdate={access.can('inventory.update')}
            onEdit={(item) => setDialog({ item })}
            onDeactivate={(item) => setArchiveTarget(item)}
            onOpenStock={(item) => setStockTarget(item)}
          />
        )}

        {!items.isPending && !items.isError && items.data ? (
          <nav
            aria-label="Pagination inventory"
            className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-sm text-muted-foreground">
              Halaman {items.data.meta.current_page} dari {items.data.meta.last_page} ·{' '}
              {items.data.meta.total} item
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                disabled={items.data.meta.current_page <= 1}
                onClick={() => setPage((value) => value - 1)}
              >
                <ChevronLeft aria-hidden="true" className="size-4" />
                Sebelumnya
              </Button>
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                disabled={items.data.meta.current_page >= items.data.meta.last_page}
                onClick={() => setPage((value) => value + 1)}
              >
                Berikutnya
                <ChevronRight aria-hidden="true" className="size-4" />
              </Button>
            </div>
          </nav>
        ) : null}
      </section>

      {dialog ? (
        <InventoryItemFormDialog
          key={dialog.item ? `item-${dialog.item.id}` : 'new'}
          item={dialog.item}
          outlets={outlets}
          defaultOutletId={outletFilter ? Number(outletFilter) : outlets[0]?.id}
          isSaving={saveItem.isPending}
          onClose={() => setDialog(null)}
          onSubmit={async (values) => {
            await saveItem.mutateAsync({ item: dialog.item, values })
          }}
        />
      ) : null}

      {stockTarget ? (
        <InventoryStockDialog
          key={`stock-${stockTarget.id}`}
          item={stockTarget}
          onClose={() => setStockTarget(null)}
        />
      ) : null}

      <AlertDialog
        open={Boolean(archiveTarget)}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Nonaktifkan {archiveTarget?.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Item tidak akan menerima stock adjustment baru, tetapi saldo dan histori movement tetap
            dapat dibaca. Data tidak dihapus permanen.
          </AlertDialogDescription>
          {deactivate.isError ? (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {apiErrorMessage(deactivate.error, 'Item belum dapat dinonaktifkan. Coba lagi.')}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button type="button" variant="outline" disabled={deactivate.isPending}>
                Batal
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                variant="destructive"
                disabled={deactivate.isPending}
                onClick={(event) => {
                  event.preventDefault()
                  if (archiveTarget) deactivate.mutate(archiveTarget)
                }}
              >
                {deactivate.isPending ? 'Menonaktifkan...' : 'Nonaktifkan'}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}

function InventoryList({
  items,
  outlets,
  canUpdate,
  onEdit,
  onDeactivate,
  onOpenStock,
}: {
  items: InventoryItem[]
  outlets: { id: number; name: string }[]
  canUpdate: boolean
  onEdit: (item: InventoryItem) => void
  onDeactivate: (item: InventoryItem) => void
  onOpenStock: (item: InventoryItem) => void
}) {
  const outletName = (id: number) => outlets.find((outlet) => outlet.id === id)?.name ?? `#${id}`

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[56rem] text-left text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-muted-foreground">
              <th className="p-3 font-medium">Item</th>
              <th className="p-3 font-medium">Outlet</th>
              <th className="p-3 text-right font-medium">Saldo</th>
              <th className="p-3 text-right font-medium">Ambang low stock</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 text-right font-medium">Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b last:border-0">
                <td className="p-3 font-medium">{item.name}</td>
                <td className="p-3 text-muted-foreground">{outletName(item.outlet_id)}</td>
                <td className="p-3 text-right tabular-nums">
                  <span className="font-semibold">
                    {formatQuantity(item.current_stock, item.unit)}
                  </span>
                  <StockBadges item={item} />
                </td>
                <td className="p-3 text-right tabular-nums text-muted-foreground">
                  {item.low_stock_threshold === null
                    ? 'Tidak dipantau'
                    : formatQuantity(item.low_stock_threshold, item.unit)}
                </td>
                <td className="p-3">
                  <Badge variant={item.is_active ? 'default' : 'outline'}>
                    {item.is_active ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </td>
                <td className="p-3">
                  <ItemActions
                    item={item}
                    canUpdate={canUpdate}
                    onEdit={() => onEdit(item)}
                    onDeactivate={() => onDeactivate(item)}
                    onOpenStock={() => onOpenStock(item)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="space-y-3 md:hidden">
        {items.map((item) => (
          <li key={item.id} className="space-y-3 rounded-lg border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="break-words font-semibold">{item.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{outletName(item.outlet_id)}</p>
              </div>
              <Badge variant={item.is_active ? 'default' : 'outline'}>
                {item.is_active ? 'Aktif' : 'Nonaktif'}
              </Badge>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Saldo</p>
                <p className="font-semibold tabular-nums">
                  {formatQuantity(item.current_stock, item.unit)}
                </p>
                <StockBadges item={item} />
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Ambang low stock</p>
                <p className="text-sm tabular-nums">
                  {item.low_stock_threshold === null
                    ? 'Tidak dipantau'
                    : formatNumber(item.low_stock_threshold)}
                </p>
              </div>
            </div>
            <ItemActions
              item={item}
              canUpdate={canUpdate}
              onEdit={() => onEdit(item)}
              onDeactivate={() => onDeactivate(item)}
              onOpenStock={() => onOpenStock(item)}
            />
          </li>
        ))}
      </ul>
    </>
  )
}

function StockBadges({ item }: { item: InventoryItem }) {
  if (item.current_stock === 0) {
    return (
      <span className="mt-1 block">
        <Badge variant="destructive">Stok habis</Badge>
      </span>
    )
  }

  if (item.is_low_stock) {
    return (
      <span className="mt-1 block">
        <Badge variant="destructive">Stok rendah</Badge>
      </span>
    )
  }

  return null
}

function ItemActions({
  item,
  canUpdate,
  onEdit,
  onDeactivate,
  onOpenStock,
}: {
  item: InventoryItem
  canUpdate: boolean
  onEdit: () => void
  onDeactivate: () => void
  onOpenStock: () => void
}) {
  return (
    <div className="flex justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-11"
        aria-label={`Kelola stok ${item.name}`}
        onClick={onOpenStock}
      >
        <ClipboardList aria-hidden="true" className="size-4" />
      </Button>
      {canUpdate ? (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11"
          aria-label={`Ubah ${item.name}`}
          onClick={onEdit}
        >
          <Pencil aria-hidden="true" className="size-4" />
        </Button>
      ) : null}
      {canUpdate && item.is_active ? (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11"
          aria-label={`Nonaktifkan ${item.name}`}
          onClick={onDeactivate}
        >
          <Archive aria-hidden="true" className="size-4" />
        </Button>
      ) : null}
    </div>
  )
}
