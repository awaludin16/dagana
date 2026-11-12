import { ArrowDown, ArrowUp, Search } from 'lucide-react'

import { ErrorState, LoadingState } from '@/components/PageFeedback'
import { Button } from '@/components/ui/button'
import { formatRupiah } from '@/lib/order-format'
import type { Category, CatalogPage, Outlet, Product } from '@/types'

type Props = {
  outlets: Pick<Outlet, 'id' | 'name'>[]
  outletId: number
  onOutletChange: (id: number) => void
  attempt: boolean
  searchInput: string
  search: string
  onSearchChange: (value: string) => void
  categoryId: number | null
  categories: Category[]
  onCategoryChange: (id: number | null) => void
  products: CatalogPage<Product> | undefined
  isLoading: boolean
  error: string | null
  onRetry: () => void
  page: number
  onPageChange: (page: number) => void
  checkoutError: string | null
  storageError: string | null
  onAddProduct: (product: Product) => void
}

export function PosCatalog({
  outlets,
  outletId,
  onOutletChange,
  attempt,
  searchInput,
  search,
  onSearchChange,
  categoryId,
  categories,
  onCategoryChange,
  products,
  isLoading,
  error,
  onRetry,
  page,
  onPageChange,
  checkoutError,
  storageError,
  onAddProduct,
}: Props) {
  const outletName = outlets.find((outlet) => outlet.id === outletId)?.name

  return (
    <section
      aria-labelledby="pos-menu-heading"
      className="flex min-h-0 min-w-0 flex-col bg-card border-b landscape:border-r landscape:border-b-0 md:border-r md:border-b-0"
    >
      <div className="space-y-3 border-b px-4 py-3 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <h1 id="pos-menu-heading" className="text-section-title">
            Pilih menu
          </h1>
          {outlets.length > 1 ? (
            <label className="flex items-center gap-2 text-sm">
              <span className="sr-only">Outlet transaksi</span>
              <select
                aria-label="Outlet transaksi"
                value={outletId}
                disabled={attempt}
                onChange={(event) => onOutletChange(Number(event.target.value))}
                className="min-h-11 max-w-48 rounded-md border bg-background px-3 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-70"
              >
                {outlets.map((outlet) => (
                  <option key={outlet.id} value={outlet.id}>
                    {outlet.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <span className="max-w-40 truncate text-xs text-muted-foreground">{outletName}</span>
          )}
        </div>
        <div role="search" className="relative">
          <label htmlFor="pos-product-search" className="sr-only">
            Cari menu
          </label>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            id="pos-product-search"
            type="search"
            value={searchInput}
            disabled={attempt}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Cari nama menu..."
            className="min-h-11 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-70"
          />
        </div>
        <div role="group" aria-label="Filter kategori" className="flex gap-2 overflow-x-auto pb-1">
          <Button
            type="button"
            variant={categoryId === null ? 'default' : 'outline'}
            className="rounded-full min-h-10 shrink-0"
            aria-pressed={categoryId === null}
            disabled={attempt}
            onClick={() => onCategoryChange(null)}
          >
            Semua
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              type="button"
              variant={categoryId === category.id ? 'default' : 'outline'}
              className="rounded-full min-h-10 shrink-0"
              aria-pressed={categoryId === category.id}
              disabled={attempt}
              onClick={() => onCategoryChange(category.id)}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
        {attempt && (
          <div
            className="mb-3 rounded-lg border border-dagana-warning/20 bg-dagana-warning-container p-3 text-sm text-dagana-warning"
            role="status"
          >
            Checkout sebelumnya belum memiliki hasil yang pasti. Retry akan memakai key dan isi
            transaksi yang sama; jangan membuat order baru.
          </div>
        )}
        {storageError && (
          <div
            className="mb-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
            role="alert"
          >
            {storageError}
          </div>
        )}
        {checkoutError && (
          <div
            className="mb-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
            role="alert"
          >
            {checkoutError}
          </div>
        )}
        {isLoading ? (
          <LoadingState label="Memuat menu yang tersedia..." />
        ) : error ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : products?.data.length ? (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
            {products.data.map((product) => (
              <li key={product.id}>
                <button
                  type="button"
                  disabled={attempt}
                  onClick={() => onAddProduct(product)}
                  className="flex min-h-20 w-full flex-col items-start justify-between gap-2 rounded-lg border bg-card p-3 text-left transition hover:border-dagana-primary/50 hover:bg-dagana-primary-soft/40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-24"
                >
                  <span className="line-clamp-2 text-sm font-semibold">{product.name}</span>
                  <span className="text-sm font-medium tabular-nums text-muted-foreground">
                    {formatRupiah(product.price)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div
            className="rounded-lg border bg-card p-5 text-sm text-muted-foreground"
            role="status"
          >
            {search
              ? 'Tidak ada menu yang cocok dengan pencarian.'
              : 'Belum ada menu aktif dan tersedia.'}
          </div>
        )}
        {products && products.meta.last_page > 1 && (
          <nav
            aria-label="Halaman daftar menu"
            className="mt-4 flex items-center justify-between gap-2"
          >
            <Button
              type="button"
              variant="outline"
              disabled={page <= 1 || attempt}
              onClick={() => onPageChange(page - 1)}
            >
              <ArrowUp aria-hidden="true" className="size-4" /> Sebelumnya
            </Button>
            <span className="text-xs text-muted-foreground">
              {products.meta.current_page} / {products.meta.last_page}
            </span>
            <Button
              type="button"
              variant="outline"
              disabled={page >= products.meta.last_page || attempt}
              onClick={() => onPageChange(page + 1)}
            >
              Berikutnya <ArrowDown aria-hidden="true" className="size-4" />
            </Button>
          </nav>
        )}
      </div>
    </section>
  )
}
