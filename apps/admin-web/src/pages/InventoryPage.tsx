// Halaman Inventori (Phase 2) — kartu stok per variant, badge stok (design system §10.1),
// tabel stock movement, dialog adjustment/receiving/opname.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowDownToLine,
  ClipboardCheck,
  Loader2,
  PackageOpen,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '../lib/api'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select } from '../components/ui/select'
import { Skeleton } from '../components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import { Textarea } from '../components/ui/textarea'
import { getActiveOutlet, setActiveOutlet } from '../lib/auth'
import { listProducts, type Product } from '../lib/catalog'
import { formatDateTime, formatNumber, normalizeDecimalInput } from '../lib/format'
import {
  addOpnameAdjustment,
  completeOpname,
  createAdjustment,
  createOpname,
  createReceiving,
  getActiveOpname,
  listStockMovements,
  listStocks,
  type MovementType,
  type Opname,
  type StockEntry,
  type StockMovement,
  type StockStatus,
} from '../lib/inventory'
import { useMe } from '../lib/me'
import { usePermissions } from '../lib/permissions'
import { cn } from '../lib/utils'

type Tab = 'stock' | 'movement'

const REASONS = [
  { value: 'CORRECTION', label: 'Koreksi' },
  { value: 'DAMAGED', label: 'Rusak / pecah' },
  { value: 'EXPIRED', label: 'Kedaluwarsa' },
  { value: 'LOST', label: 'Hilang' },
  { value: 'OTHER', label: 'Lainnya' },
]

const STOCK_STATUS: Record<StockStatus, { label: string; variant: 'success' | 'warning' | 'destructive' }> = {
  in_stock: { label: 'Aman', variant: 'success' },
  low_stock: { label: 'Menipis', variant: 'warning' },
  out_of_stock: { label: 'Habis', variant: 'destructive' },
}

const MOVEMENT_LABEL: Record<MovementType, string> = {
  ADJUSTMENT: 'Adjustment',
  OPNAME: 'Opname',
  RECEIVING: 'Barang masuk',
  SALE: 'Penjualan',
}

function StockBadge({ status }: { status: StockStatus }) {
  const meta = STOCK_STATUS[status]
  return (
    <Badge variant={meta.variant} dot>
      {meta.label}
    </Badge>
  )
}

function MovementBadge({ type }: { type: MovementType }) {
  const variant =
    type === 'RECEIVING' ? 'success' : type === 'OPNAME' ? 'info' : type === 'ADJUSTMENT' ? 'secondary' : 'default'
  return <Badge variant={variant}>{MOVEMENT_LABEL[type] ?? type}</Badge>
}

function SignedQuantity({ quantity }: { quantity: string }) {
  const value = Number(quantity)
  return (
    <span className={cn('tabular-nums', value > 0 ? 'text-success' : value < 0 ? 'text-destructive' : '')}>
      {value > 0 ? '+' : ''}
      {formatNumber(value)}
    </span>
  )
}

function FieldError({ text }: { text?: string }) {
  if (!text) return null
  return <p className="text-xs text-destructive">{text}</p>
}

function Pagination({
  page,
  lastPage,
  onPage,
}: {
  page: number
  lastPage: number
  onPage: (page: number) => void
}) {
  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>
        Halaman {page} dari {Math.max(lastPage, 1)}
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Sebelumnya
        </Button>
        <Button variant="outline" size="sm" disabled={page >= lastPage} onClick={() => onPage(page + 1)}>
          Berikutnya
        </Button>
      </div>
    </div>
  )
}

// ─── Dialog: Adjustment cepat (+/−) untuk satu varian ─────────────────────────
function AdjustDialog({
  entry,
  onClose,
}: {
  entry: StockEntry | null
  onClose: () => void
}) {
  const qc = useQueryClient()
  const [direction, setDirection] = useState<'in' | 'out'>('in')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState(REASONS[0].value)
  const [note, setNote] = useState('')
  const [fieldError, setFieldError] = useState<string>()

  useEffect(() => {
    setDirection('in')
    setQuantity('')
    setReason(REASONS[0].value)
    setNote('')
    setFieldError(undefined)
  }, [entry?.id])

  const mutation = useMutation({
    mutationFn: () =>
      createAdjustment({
        product_variant_id: entry!.variant.id,
        quantity: direction === 'out' ? -Number(quantity) : Number(quantity),
        reason,
        note: note.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Stok diperbarui.')
      qc.invalidateQueries({ queryKey: ['inventory-stocks'] })
      qc.invalidateQueries({ queryKey: ['inventory-movements'] })
      onClose()
    },
    onError: (error) => {
      toast.error(errorMessage(error))
      setFieldError(undefined)
    },
  })

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const value = Number(quantity)
    if (!quantity || Number.isNaN(value) || value <= 0) {
      setFieldError('Jumlah harus lebih dari 0.')
      return
    }
    setFieldError(undefined)
    mutation.mutate()
  }

  const open = entry !== null

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjustmen Stok</DialogTitle>
          <DialogDescription>
            {entry ? (
              <>
                {entry.variant.product.name} · SKU {entry.variant.sku}
                <span className="ml-2 text-muted-foreground">
                  Stok saat ini: {formatNumber(entry.quantity)} {entry.variant.unit}
                </span>
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="direction">Jenis</Label>
            <Select id="direction" value={direction} onChange={(e) => setDirection(e.target.value as 'in' | 'out')}>
              <option value="in">Stok masuk (+)</option>
              <option value="out">Stok keluar (−)</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="adj-qty">Jumlah</Label>
            <Input
              id="adj-qty"
              type="number"
              min="0"
              step="1"
              inputMode="decimal"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="cth. 5"
              aria-invalid={Boolean(fieldError)}
            />
            <FieldError text={fieldError} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="adj-reason">Alasan</Label>
            <Select id="adj-reason" value={reason} onChange={(e) => setReason(e.target.value)}>
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="adj-note">Catatan (opsional)</Label>
            <Textarea
              id="adj-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="cth. botol pecah saat bongkar muat"
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Dialog: Terima Barang (batch) ────────────────────────────────────────────
interface ReceivingRow {
  product_variant_id: string
  quantity: string
  cost_price: string
}

function ReceivingDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const [note, setNote] = useState('')
  const [receivedAt, setReceivedAt] = useState('')
  const [rows, setRows] = useState<ReceivingRow[]>([{ product_variant_id: '', quantity: '', cost_price: '' }])
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const { data: products } = useQuery({
    queryKey: ['products', { per_page: 200 }],
    queryFn: () => listProducts({ per_page: 200 }),
  })

  const variantOptions = useMemo(() => {
    return (products?.data ?? []).flatMap((product: Product) =>
      product.variants.map((v) => ({
        value: v.id,
        label: `${product.name} — ${v.sku}`,
      })),
    )
  }, [products])

  useEffect(() => {
    if (!open) return
    setNote('')
    setReceivedAt('')
    setRows([{ product_variant_id: '', quantity: '', cost_price: '' }])
    setFieldErrors({})
  }, [open])

  function updateRow(index: number, patch: Partial<ReceivingRow>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  const mutation = useMutation({
    mutationFn: () =>
      createReceiving({
        note: note.trim() || undefined,
        received_at: receivedAt || undefined,
        items: rows.map((row) => ({
          product_variant_id: row.product_variant_id,
          quantity: Number(row.quantity),
          cost_price: row.cost_price ? Number(row.cost_price) : undefined,
        })),
      }),
    onSuccess: () => {
      toast.success('Barang masuk dicatat.')
      qc.invalidateQueries({ queryKey: ['inventory-stocks'] })
      qc.invalidateQueries({ queryKey: ['inventory-movements'] })
      onClose()
    },
    onError: (error) => {
      toast.error(errorMessage(error))
    },
  })

  const canSubmit = rows.every((row) => row.product_variant_id && Number(row.quantity) > 0)

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const errors: Record<string, string> = {}
    rows.forEach((row, index) => {
      if (!row.product_variant_id) errors[`items.${index}.product_variant_id`] = 'Pilih varian.'
      if (!row.quantity || Number(row.quantity) <= 0) errors[`items.${index}.quantity`] = 'Jumlah > 0.'
    })
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return
    mutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Terima Barang</DialogTitle>
          <DialogDescription>Catat barang masuk dan stok otomatis bertambah.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rcv-date">Tanggal terima (opsional)</Label>
              <Input id="rcv-date" type="date" value={receivedAt} onChange={(e) => setReceivedAt(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rcv-note">Note (opsional)</Label>
              <Input id="rcv-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="cth. PO #102" />
            </div>
          </div>

          <div className="space-y-2">
            {rows.map((row, index) => (
              <div key={index} className="flex items-end gap-2">
                <div className="min-w-0 flex-1 space-y-1">
                  <Label htmlFor={`rcv-item-${index}`}>Varian</Label>
                  <Select
                    id={`rcv-item-${index}`}
                    value={row.product_variant_id}
                    onChange={(e) => updateRow(index, { product_variant_id: e.target.value })}
                    aria-invalid={Boolean(fieldErrors[`items.${index}.product_variant_id`])}
                  >
                    <option value="">— pilih varian —</option>
                    {variantOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                  <FieldError text={fieldErrors[`items.${index}.product_variant_id`]} />
                </div>
                <div className="w-24 space-y-1">
                  <Label htmlFor={`rcv-qty-${index}`}>Jml</Label>
                  <Input
                    id={`rcv-qty-${index}`}
                    type="number"
                    min="0"
                    step="1"
                    inputMode="decimal"
                    value={row.quantity}
                    onChange={(e) => updateRow(index, { quantity: e.target.value })}
                    placeholder="0"
                    aria-invalid={Boolean(fieldErrors[`items.${index}.quantity`])}
                  />
                  <FieldError text={fieldErrors[`items.${index}.quantity`]} />
                </div>
                <div className="w-28 space-y-1">
                  <Label htmlFor={`rcv-cost-${index}`}>Harga modal</Label>
                  <Input
                    id={`rcv-cost-${index}`}
                    type="number"
                    min="0"
                    step="100"
                    inputMode="decimal"
                    value={row.cost_price}
                    onChange={(e) => updateRow(index, { cost_price: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Hapus baris"
                  disabled={rows.length === 1}
                  onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))}
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRows((prev) => [...prev, { product_variant_id: '', quantity: '', cost_price: '' }])}
            >
              <Plus className="size-4" aria-hidden />
              Tambah baris
            </Button>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={mutation.isPending || !canSubmit}>
              {mutation.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              Simpan Penerimaan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Dialog: Stock Opname (mulai → input hitung fisik → selesaikan) ───────────
interface OpnameRow {
  variant_id: string
  label: string
  unit: string
  system: string
  counted: string
}

function OpnameDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const [stage, setStage] = useState<'checking' | 'start' | 'counting'>('checking')
  const [active, setActive] = useState<Opname | null>(null)
  const [rows, setRows] = useState<OpnameRow[]>([])
  const [loading, setLoading] = useState(false)

  // Muat opname berjalan + daftar stok (untuk nilai sistem) saat dialog dibuka.
  useEffect(() => {
    if (!open) return
    let cancelled = false
    setStage('checking')
    setActive(null)

    Promise.all([getActiveOpname(), listStocks({ per_page: 200 })])
      .then(([opname, stocks]) => {
        if (cancelled) return
        setActive(opname)
        setRows(
          stocks.data.map((stock) => ({
            variant_id: stock.variant.id,
            label: `${stock.variant.product.name} · ${stock.variant.sku}`,
            unit: stock.variant.unit,
            system: stock.quantity,
            counted: normalizeDecimalInput(stock.quantity),
          })),
        )
        setStage(opname ? 'counting' : 'start')
      })
      .catch(() => {
        if (!cancelled) setStage('start')
      })

    return () => {
      cancelled = true
    }
  }, [open])

  function updateCounted(index: number, value: string) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, counted: value } : row)))
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const opname = active ?? (await createOpname())
      const changed = rows.filter((row) => Number(row.counted) !== Number(row.system))
      for (const row of changed) {
        await addOpnameAdjustment(opname.id, {
          product_variant_id: row.variant_id,
          counted_qty: Number(row.counted),
        })
      }
      return completeOpname(opname.id)
    },
    onSuccess: (result) => {
      toast.success(
        result.movements_count > 0
          ? `Opname selesai — ${result.movements_count} perubahan diterapkan.`
          : 'Opname selesai — tidak ada selisih.',
      )
      qc.invalidateQueries({ queryKey: ['inventory-stocks'] })
      qc.invalidateQueries({ queryKey: ['inventory-movements'] })
      onClose()
    },
    onError: (error) => {
      toast.error(errorMessage(error))
    },
  })

  async function startOpname() {
    if (!active) {
      setLoading(true)
      try {
        setActive(await createOpname())
      } catch (error) {
        toast.error(errorMessage(error))
        setLoading(false)
        return
      }
      setLoading(false)
    }
    setStage('counting')
  }

  const allValid = rows.every((row) => Number.isFinite(Number(row.counted)) && Number(row.counted) >= 0)

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Stock Opname</DialogTitle>
          <DialogDescription>
            Hitung stok fisik tiap varian lalu simpan: selisih akan dicatat sebagai movement OPNAME.
          </DialogDescription>
        </DialogHeader>

        {stage === 'checking' && (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
            Memuat stok…
          </div>
        )}

        {stage === 'start' && (
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Belum ada opname berjalan di outlet ini. Mulai batch baru untuk menghitung stok fisik.
            </p>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Batal
              </Button>
              <Button type="button" onClick={startOpname} disabled={loading || rows.length === 0}>
                {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
                Mulai Opname
              </Button>
            </DialogFooter>
          </div>
        )}

        {stage === 'counting' && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!allValid) {
                toast.error('Isi jumlah hitung fisik dengan angka ≥ 0.')
                return
              }
              mutation.mutate()
            }}
            className="space-y-4"
          >
            {rows.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Belum ada stok tercatat di outlet ini.
              </p>
            ) : (
              <div className="space-y-2">
                {rows.map((row, index) => (
                  <div key={row.variant_id} className="flex items-center gap-3 rounded-lg border px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{row.label}</p>
                      <p className="text-xs text-muted-foreground">
                        Sistem: {formatNumber(row.system)} {row.unit}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        inputMode="decimal"
                        value={row.counted}
                        onChange={(e) => updateCounted(index, e.target.value)}
                        className="w-24 text-right"
                        aria-label={`Hasil hitung ${row.label}`}
                      />
                      <span className="w-12 text-xs text-muted-foreground">{row.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Batal
              </Button>
              <Button type="submit" disabled={mutation.isPending || rows.length === 0}>
                {mutation.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
                Simpan & Selesaikan
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Halaman utama ────────────────────────────────────────────────────────────
export default function InventoryPage() {
  const qc = useQueryClient()
  const { can } = usePermissions()
  const { data: me } = useMe()

  const outlets = useMemo(() => me?.outlets ?? [], [me])
  const [outletId, setOutletId] = useState<string>(() => getActiveOutlet() ?? '')
  const [tab, setTab] = useState<Tab>('stock')
  const [search, setSearch] = useState('')
  const [stockFilter, setStockFilter] = useState<'all' | 'low'>('all')
  const [stockPage, setStockPage] = useState(1)
  const [movementPage, setMovementPage] = useState(1)
  const [adjustEntry, setAdjustEntry] = useState<StockEntry | null>(null)
  const [receivingOpen, setReceivingOpen] = useState(false)
  const [opnameOpen, setOpnameOpen] = useState(false)

  // Default & sinkronisasi outlet aktif (dipakai header X-Outlet-Context).
  useEffect(() => {
    if (!getActiveOutlet() && outlets.length > 0) {
      setActiveOutlet(outlets[0].id)
    }
    setOutletId(getActiveOutlet() ?? '')
  }, [outlets])

  function selectOutlet(id: string) {
    setActiveOutlet(id)
    setOutletId(id)
    setStockPage(1)
    setMovementPage(1)
    qc.invalidateQueries({ queryKey: ['inventory-stocks'] })
    qc.invalidateQueries({ queryKey: ['inventory-movements'] })
  }

  const stocksQuery = useQuery({
    queryKey: ['inventory-stocks', { outletId, search, stockFilter, page: stockPage }],
    queryFn: () =>
      listStocks({
        search: search.trim() || undefined,
        low_stock: stockFilter === 'low' || undefined,
        page: stockPage,
      }),
  })

  const movementsQuery = useQuery({
    queryKey: ['inventory-movements', { outletId, page: movementPage }],
    queryFn: () => listStockMovements({ page: movementPage }),
  })

  const stocks = stocksQuery.data
  const movements = movementsQuery.data

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Inventori</h1>
          <div className="flex items-center gap-2">
            {can('inventory.receiving') && (
              <Button variant="outline" onClick={() => setReceivingOpen(true)} disabled={!outletId}>
                <ArrowDownToLine className="size-4" aria-hidden />
                Terima Barang
              </Button>
            )}
            {can('inventory.stock_opname') && (
              <Button onClick={() => setOpnameOpen(true)} disabled={!outletId}>
                <ClipboardCheck className="size-4" aria-hidden />
                Stock Opname
              </Button>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Pantau ketersediaan stok dan riwayat pergerakan per outlet.</p>
      </header>

      {outlets.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="outlet-filter">Outlet</Label>
            <Select
              id="outlet-filter"
              value={outletId}
              onChange={(e) => selectOutlet(e.target.value)}
              aria-label="Pilih outlet"
            >
              <option value="">Semua outlet</option>
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      )}

      {!outletId && (
        <p className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-foreground">
          Pilih outlet untuk mengaktifkan aksi « Terima Barang » dan « Stock Opname ».
        </p>
      )}

      {/* Tab: Stok / Riwayat Movement */}
      <div className="flex w-fit gap-1 rounded-lg border bg-card p-1">
        {(
          [
            { key: 'stock', label: 'Stok' },
            { key: 'movement', label: 'Riwayat Movement' },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              tab === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'stock' ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-56 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setStockPage(1)
                }}
                placeholder="Cari produk atau SKU…"
                className="pl-9"
                aria-label="Cari produk atau SKU"
              />
            </div>
            <Select
              value={stockFilter}
              onChange={(e) => {
                setStockFilter(e.target.value as 'all' | 'low')
                setStockPage(1)
              }}
              className="w-48"
              aria-label="Filter status stok"
            >
              <option value="all">Semua status stok</option>
              <option value="low">Stok menipis & habis</option>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {stocksQuery.isPending ? (
              Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
            ) : (stocks?.data.length ?? 0) === 0 ? (
              <div className="col-span-full rounded-xl border border-dashed p-10 text-center">
                <PackageOpen className="mx-auto mb-3 size-8 text-muted-foreground" aria-hidden />
                <p className="text-sm font-medium text-muted-foreground">Belum ada stok tercatat.</p>
                <p className="text-xs text-muted-foreground">
                  Gunakan « Terima Barang » atau aksi + pada varian untuk mencatat stok awal.
                </p>
              </div>
            ) : (
              stocks?.data.map((entry) => {
                return (
                  <div key={entry.id} className="rounded-xl border bg-card p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {entry.variant.product.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {entry.variant.sku} · {entry.variant.unit}
                        </p>
                      </div>
                      <StockBadge status={entry.stock_status} />
                    </div>
                    <div className="mt-3 flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-semibold tabular-nums tracking-tight">
                          {formatNumber(entry.quantity)}
                          <span className="ml-1 text-sm font-normal text-muted-foreground">{entry.variant.unit}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.outlet.name}
                          {entry.threshold !== null && <> · ambang {formatNumber(entry.threshold)}</>}
                        </p>
                      </div>
                      {can('inventory.adjust') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Adjustmen ${entry.variant.sku}`}
                          onClick={() => setAdjustEntry(entry)}
                        >
                          <Plus className="size-4" aria-hidden />
                          Stok
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {stocks && stocks.data.length > 0 && (
            <Pagination page={stockPage} lastPage={stocks.last_page} onPage={setStockPage} />
          )}
        </section>
      ) : (
        <section className="space-y-4">
          {movementsQuery.isPending ? (
            <Skeleton className="h-40 rounded-xl" />
          ) : (movements?.data.length ?? 0) === 0 ? (
            <div className="rounded-xl border border-dashed p-10 text-center">
              <PackageOpen className="mx-auto mb-3 size-8 text-muted-foreground" aria-hidden />
              <p className="text-sm font-medium text-muted-foreground">Belum ada movement.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Varian</TableHead>
                    <TableHead>Outlet</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead>Alasan / Catatan</TableHead>
                    <TableHead>Petugas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements?.data.map((movement: StockMovement) => (
                    <TableRow key={movement.id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDateTime(movement.created_at)}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{movement.variant.product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {movement.variant.sku} · {movement.variant.unit}
                        </p>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{movement.outlet.name}</TableCell>
                      <TableCell>
                        <MovementBadge type={movement.movement_type} />
                      </TableCell>
                      <TableCell className="text-right">
                        <SignedQuantity quantity={movement.quantity} />
                      </TableCell>
                      <TableCell className="max-w-56">
                        <p className="truncate text-sm">{movement.reason ?? '—'}</p>
                        {movement.note && <p className="truncate text-xs text-muted-foreground">{movement.note}</p>}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{movement.actor?.name ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {movements && movements.data.length > 0 && (
            <Pagination page={movementPage} lastPage={movements.last_page} onPage={setMovementPage} />
          )}
        </section>
      )}

      <AdjustDialog entry={adjustEntry} onClose={() => setAdjustEntry(null)} />
      <ReceivingDialog open={receivingOpen} onClose={() => setReceivingOpen(false)} />
      <OpnameDialog open={opnameOpen} onClose={() => setOpnameOpen(false)} />
    </div>
  )
}