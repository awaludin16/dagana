import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MoreHorizontal, PackageOpen, Pencil, Plus, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'
import { Input } from '../components/ui/input'
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
import {
  deleteProduct,
  listCategories,
  listProducts,
  updateProduct,
  type Product,
  type ProductStatus,
} from '../lib/catalog'
import { formatRupiah } from '../lib/format'
import { usePermissions } from '../lib/permissions'

function StatusBadge({ status }: { status: ProductStatus }) {
  if (status === 'ACTIVE') {
    return (
      <Badge variant="success" dot>
        Aktif
      </Badge>
    )
  }
  return <Badge variant="secondary">Nonaktif</Badge>
}

function productPrice(product: Product): string {
  if (product.variants.length === 0) return '—'
  const prices = product.variants.map((v) => Number(v.price))
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  if (min === max) return formatRupiah(min)
  return `${formatRupiah(min)} – ${formatRupiah(max)}`
}

export default function ProductsPage() {
  const qc = useQueryClient()
  const { can } = usePermissions()

  const [searchInput, setSearchInput] = useState('')
  const [filters, setFilters] = useState({ search: '', category: '', status: '', page: 1 })
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((f) => (f.search === searchInput ? f : { ...f, search: searchInput, page: 1 }))
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['products', filters],
    queryFn: () =>
      listProducts({
        search: filters.search || undefined,
        category: filters.category || undefined,
        status: filters.status ? (filters.status as ProductStatus) : undefined,
        page: filters.page,
      }),
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: listCategories,
  })

  const deleteMutation = useMutation({
    mutationFn: (product: Product) => deleteProduct(product.id),
    onSuccess: (_data, product) => {
      toast.success(`“${product.name}” dinonaktifkan.`)
      qc.invalidateQueries({ queryKey: ['products'] })
      setPendingDelete(null)
    },
    onError: () => {
      toast.error('Gagal menonaktifkan produk. Coba lagi.')
      setPendingDelete(null)
    },
  })

  const reactivateMutation = useMutation({
    mutationFn: (product: Product) =>
      updateProduct(product.id, {
        name: product.name,
        category_id: product.category_id ?? undefined,
        description: product.description ?? undefined,
        image_url: product.image_url ?? undefined,
        status: 'ACTIVE',
        variants: product.variants.map((v) => ({
          sku: v.sku,
          barcode: v.barcode ?? undefined,
          unit: v.unit,
          price: Number(v.price),
          cost_price: Number(v.cost_price) || 0,
        })),
      }),
    onSuccess: (_data, product) => {
      toast.success(`“${product.name}” diaktifkan kembali.`)
      qc.invalidateQueries({ queryKey: ['products'] })
    },
    onError: () => {
      toast.error('Gagal mengaktifkan produk. Coba lagi.')
    },
  })

  const hasActiveFilters = Boolean(filters.search || filters.category || filters.status)

  function resetFilters() {
    setSearchInput('')
    setFilters({ search: '', category: '', status: '', page: 1 })
  }

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Produk</h1>
          <p className="text-sm text-muted-foreground">
            Atur produk, SKU, barcode, dan harga untuk tenant aktif.
          </p>
        </div>
        {can('products.create') && (
          <Button asChild>
            <Link to="/products/new">
              <Plus aria-hidden />
              Tambah Produk
            </Link>
          </Button>
        )}
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-64">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari produk…"
            className="pl-9"
          />
        </div>
        <Select
          value={filters.category}
          onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value, page: 1 }))}
          className="w-44"
          aria-label="Filter kategori"
        >
          <option value="">Semua kategori</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}
          className="w-40"
          aria-label="Filter status"
        >
          <option value="">Semua status</option>
          <option value="ACTIVE">Aktif</option>
          <option value="INACTIVE">Nonaktif</option>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-72 rounded-xl" />
      ) : isError ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <p className="text-sm text-destructive">Gagal memuat produk.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            Coba lagi
          </Button>
        </div>
      ) : !data || data.data.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-10 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
            <PackageOpen className="size-5" aria-hidden />
          </div>
          <h2 className="mt-4 text-base font-semibold text-foreground">
            {hasActiveFilters ? 'Tidak ada hasil' : 'Belum ada produk'}
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            {hasActiveFilters
              ? 'Tidak ada produk yang cocok dengan filter saat ini.'
              : 'Tambahkan produk pertama, lengkap dengan SKU, barcode, dan harga.'}
          </p>
          {hasActiveFilters ? (
            <Button variant="outline" size="sm" className="mt-4" onClick={resetFilters}>
              Reset filter
            </Button>
          ) : (
            can('products.create') && (
              <Button asChild size="sm" className="mt-4">
                <Link to="/products/new">Tambah Produk</Link>
              </Button>
            )
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Harga</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12 text-right" aria-label="Aksi" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((product) => {
                    const firstVariant = product.variants[0]
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="font-medium text-foreground">{product.name}</div>
                          {product.description && (
                            <div className="line-clamp-1 text-xs text-muted-foreground">
                              {product.description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {product.category?.name ?? '—'}
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-xs">{firstVariant?.sku ?? '—'}</div>
                          {product.variants.length > 1 && (
                            <div className="text-xs text-muted-foreground">
                              +{product.variants.length - 1} varian
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums text-foreground">
                          {productPrice(product)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={product.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label="Aksi produk">
                                <MoreHorizontal aria-hidden />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to={`/products/${product.id}/edit`}>
                                  <Pencil aria-hidden />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              {can('products.update') && product.status === 'INACTIVE' && (
                                <DropdownMenuItem onClick={() => reactivateMutation.mutate(product)}>
                                  Aktifkan kembali
                                </DropdownMenuItem>
                              )}
                              {can('products.delete') && (
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setPendingDelete(product)}
                                >
                                  Nonaktifkan
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                }
              </TableBody>
            </Table>
          </div>

          {data.last_page > 1 && (
            <div className="flex items-center justify-between gap-4 text-sm">
              <p className="text-muted-foreground">
                Menampilkan {data.data.length} dari {data.total} produk
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.current_page <= 1}
                  onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                >
                  Sebelumnya
                </Button>
                <span className="text-muted-foreground">
                  Hal {data.current_page} dari {data.last_page}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.current_page >= data.last_page}
                  onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                >
                  Berikutnya
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open: boolean) => {
          if (!open) setPendingDelete(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nonaktifkan produk?</DialogTitle>
            <DialogDescription>
              “{pendingDelete?.name}” akan dinonaktifkan dan keluar dari daftar aktif. Kamu bisa
              mengaktifkannya kembali kapan saja.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPendingDelete(null)}
              disabled={deleteMutation.isPending}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => pendingDelete && deleteMutation.mutate(pendingDelete)}
              disabled={deleteMutation.isPending}
            >
              Nonaktifkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}