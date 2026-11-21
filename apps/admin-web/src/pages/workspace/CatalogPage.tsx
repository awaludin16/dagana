import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  EllipsisVertical,
  PackageCheck,
  PackageX,
  Pencil,
  RotateCcw,
  Search,
  Tags,
  Trash2,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FormField } from '@/components/FormField'
import { CatalogFormDialog } from '@/pages/workspace/CatalogFormDialog'
import { api } from '@/lib/api'
import { apiErrorMessage } from '@/lib/form-errors'
import { formatRupiah } from '@/lib/order-format'
import type { Category, CategoryInput, Product, ProductInput } from '@/types'

type CatalogSection = 'products' | 'categories'
type DialogState =
  { kind: 'product'; item?: Product } | { kind: 'category'; item?: Category } | null
type ArchiveTarget =
  { kind: 'product'; item: Product } | { kind: 'category'; item: Category } | null

const PER_PAGE = 20
const CATEGORY_OPTIONS_LIMIT = 100

function activeFilter(value: string): boolean | undefined {
  if (value === 'active') return true
  if (value === 'inactive') return false
  return undefined
}

export function CatalogPage() {
  const access = useAccess()
  const queryClient = useQueryClient()
  const [section, setSection] = useState<CatalogSection>('products')
  const [productPage, setProductPage] = useState(1)
  const [categoryPage, setCategoryPage] = useState(1)
  const [productSearch, setProductSearch] = useState('')
  const [productQuery, setProductQuery] = useState('')
  const [categorySearch, setCategorySearch] = useState('')
  const [categoryQuery, setCategoryQuery] = useState('')
  const [productActive, setProductActive] = useState('all')
  const [productAvailable, setProductAvailable] = useState('all')
  const [productCategory, setProductCategory] = useState('all')
  const [productOutlet, setProductOutlet] = useState<string | null>(null)
  const [categoryActive, setCategoryActive] = useState('all')
  const [dialog, setDialog] = useState<DialogState>(null)
  const [archiveTarget, setArchiveTarget] = useState<ArchiveTarget>(null)
  const [stockTarget, setStockTarget] = useState<Product | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const canReadCategories = access.can('categories.read')
  const canReadProducts = access.can('products.read')
  const canToggleAvailability = access.can('products.update_availability')
  const canUpdateStock = access.can('products.update_stock')
  const outlets = access.membership?.outlets ?? []
  // Default ke outlet pertama agar status & aksi ketersediaan per outlet selalu terjangkau (D-35).
  // "Semua outlet" tidak ditawarkan bila Business hanya punya satu outlet.
  const outletValue =
    productOutlet && (productOutlet !== 'all' || outlets.length > 1)
      ? productOutlet
      : outlets[0]
        ? String(outlets[0].id)
        : 'all'
  const selectedOutletId = outletValue === 'all' ? undefined : Number(outletValue)
  const selectedOutletName = outlets.find((outlet) => outlet.id === selectedOutletId)?.name
  const activeSection: CatalogSection =
    canReadProducts || !canReadCategories ? section : 'categories'

  const categories = useQuery({
    queryKey: ['categories', 'list', categoryPage, categoryQuery, categoryActive],
    queryFn: () =>
      api.categories({
        page: categoryPage,
        per_page: PER_PAGE,
        q: categoryQuery,
        is_active: activeFilter(categoryActive),
      }),
    enabled: canReadCategories && activeSection === 'categories',
  })

  const categoryOptions = useQuery({
    queryKey: ['categories', 'options'],
    queryFn: () => api.categories({ per_page: CATEGORY_OPTIONS_LIMIT }),
    enabled: canReadCategories,
  })

  const products = useQuery({
    queryKey: [
      'products',
      'list',
      productPage,
      productQuery,
      productActive,
      productAvailable,
      productCategory,
      outletValue,
    ],
    queryFn: () =>
      api.products({
        page: productPage,
        per_page: PER_PAGE,
        q: productQuery,
        is_active: activeFilter(productActive),
        is_available: activeFilter(productAvailable),
        category_id: productCategory === 'all' ? undefined : Number(productCategory),
        outlet_id: selectedOutletId,
      }),
    enabled: canReadProducts && activeSection === 'products',
  })

  const saveCategory = useMutation({
    mutationFn: ({ item, input }: { item?: Category; input: CategoryInput }) =>
      item ? api.updateCategory(item.id, input) : api.createCategory(input),
    onSuccess: async (_, { item }) => {
      await queryClient.invalidateQueries({ queryKey: ['categories'] })
      if (item) setNotice('Kategori berhasil diperbarui.')
      else setNotice('Kategori berhasil ditambahkan.')
      setDialog(null)
    },
  })

  const saveProduct = useMutation({
    mutationFn: ({ item, input }: { item?: Product; input: ProductInput }) =>
      item ? api.updateProduct(item.id, input) : api.createProduct(input),
    onSuccess: async (_, { item }) => {
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      if (item) setNotice('Menu berhasil diperbarui.')
      else setNotice('Menu berhasil ditambahkan.')
      setDialog(null)
    },
  })

  const setAvailability = useMutation({
    mutationFn: ({ item, isAvailable }: { item: Product; isAvailable: boolean }) =>
      api.updateProductAvailability(item.id, {
        outlet_id: selectedOutletId ?? 0,
        is_available: isAvailable,
      }),
    onSuccess: async (product) => {
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      setNotice(
        product.is_available_at_outlet
          ? `Menu tersedia kembali di ${selectedOutletName ?? 'outlet terpilih'}.`
          : `Menu ditandai habis di ${selectedOutletName ?? 'outlet terpilih'}. Outlet lain tidak berubah.`,
      )
    },
  })

  const setStock = useMutation({
    mutationFn: ({
      item,
      quantity,
      reason,
    }: {
      item: Product
      quantity: number | null
      reason?: string
    }) =>
      api.updateProductStock(item.id, {
        outlet_id: selectedOutletId ?? 0,
        quantity,
        reason,
      }),
    onSuccess: async (product, { quantity }) => {
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      setNotice(
        quantity === null
          ? `Stok ${product.name} tidak lagi dipantau di ${selectedOutletName ?? 'outlet terpilih'}.`
          : `Stok ${product.name} di ${selectedOutletName ?? 'outlet terpilih'} diperbarui menjadi ${quantity}.`,
      )
      setStockTarget(null)
    },
  })

  const deactivate = useMutation({
    mutationFn: (target: Exclude<ArchiveTarget, null>) =>
      target.kind === 'category'
        ? api.updateCategory(target.item.id, { is_active: false })
        : api.updateProduct(target.item.id, { is_active: false }),
    onSuccess: async (_, target) => {
      await queryClient.invalidateQueries({
        queryKey: [target.kind === 'category' ? 'categories' : 'products'],
      })
      setNotice(
        target.kind === 'category'
          ? 'Kategori berhasil dinonaktifkan. Menu dan histori tidak dihapus.'
          : 'Menu berhasil dinonaktifkan. Histori transaksi tidak dihapus.',
      )
      setArchiveTarget(null)
    },
  })

  const activate = useMutation({
    mutationFn: (target: Exclude<ArchiveTarget, null>) =>
      target.kind === 'category'
        ? api.updateCategory(target.item.id, { is_active: true })
        : api.updateProduct(target.item.id, { is_active: true }),
    onSuccess: async (_, target) => {
      await queryClient.invalidateQueries({
        queryKey: [target.kind === 'category' ? 'categories' : 'products'],
      })
      setNotice(
        target.kind === 'category'
          ? 'Kategori berhasil diaktifkan kembali.'
          : 'Menu berhasil diaktifkan kembali.',
      )
    },
  })

  if (access.isPending) return <LoadingState label="Memeriksa akses katalog..." />
  if (access.isError) {
    return (
      <ErrorState
        message="Hak akses katalog belum dapat diperiksa. Periksa koneksi lalu coba lagi."
        onRetry={() => void access.refetch()}
      />
    )
  }

  if (!canReadCategories && !canReadProducts) {
    return (
      <section
        className="mx-auto max-w-2xl rounded-xl border border-destructive/30 bg-destructive/5 p-5"
        role="alert"
      >
        Anda tidak memiliki izin untuk membaca kategori maupun menu. Hubungi Owner bisnis untuk
        meminta akses katalog.
      </section>
    )
  }

  const categoryData = categories.data
  const productData = products.data
  const currentQuery = activeSection === 'products' ? products : categories

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (activeSection === 'products') {
      setProductPage(1)
      setProductQuery(productSearch.trim())
    } else {
      setCategoryPage(1)
      setCategoryQuery(categorySearch.trim())
    }
  }

  function resetProductFilters() {
    setProductPage(1)
    setProductSearch('')
    setProductQuery('')
    setProductActive('all')
    setProductAvailable('all')
    setProductCategory('all')
    setProductOutlet(null)
  }

  function resetCategoryFilters() {
    setCategoryPage(1)
    setCategorySearch('')
    setCategoryQuery('')
    setCategoryActive('all')
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-col justify-between gap-5 border-b pb-6 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">Business</p>
          <h1 className="text-page-title tracking-tight">Katalog</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Kelola kategori, menu, dan harga. Harga berlaku sama untuk semua outlet; ketersediaan
            menu dapat diatur per outlet lewat pengaturan outlet di bawah.
          </p>
        </div>
        {activeSection === 'products' && access.can('products.create') ? (
          <Button
            type="button"
            className="min-h-11 gap-2 px-5"
            onClick={() => setDialog({ kind: 'product' })}
          >
            <CirclePlus aria-hidden="true" className="size-4" />
            Tambah menu
          </Button>
        ) : null}
        {activeSection === 'categories' && access.can('categories.create') ? (
          <Button
            type="button"
            className="min-h-11 gap-2 px-5"
            onClick={() => setDialog({ kind: 'category' })}
          >
            <CirclePlus aria-hidden="true" className="size-4" />
            Tambah kategori
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

      <div className="flex flex-wrap gap-2" aria-label="Bagian katalog">
        {canReadProducts ? (
          <Button
            type="button"
            variant={activeSection === 'products' ? 'default' : 'outline'}
            aria-pressed={activeSection === 'products'}
            onClick={() => setSection('products')}
          >
            Menu
          </Button>
        ) : null}
        {canReadCategories ? (
          <Button
            type="button"
            variant={activeSection === 'categories' ? 'default' : 'outline'}
            aria-pressed={activeSection === 'categories'}
            onClick={() => setSection('categories')}
          >
            Kategori
          </Button>
        ) : null}
      </div>

      <section className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
        <form className="flex flex-col gap-3 sm:flex-row" onSubmit={submitSearch}>
          <FormField
            id="catalog-search"
            label={activeSection === 'products' ? 'Cari menu' : 'Cari kategori'}
            className="h-11"
            containerClassName="flex-1"
            placeholder="Ketik nama..."
            value={activeSection === 'products' ? productSearch : categorySearch}
            onChange={(event) =>
              activeSection === 'products'
                ? setProductSearch(event.target.value)
                : setCategorySearch(event.target.value)
            }
          />
          <Button type="submit" variant="outline" className="mt-auto min-h-11 gap-2">
            <Search aria-hidden="true" className="size-4" />
            Cari
          </Button>
        </form>

        {activeSection === 'products' ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-1.5 text-sm font-medium">
              Status menu
              <select
                className="h-11 w-full rounded-lg border border-input bg-background px-3 font-normal outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                value={productActive}
                onChange={(event) => {
                  setProductPage(1)
                  setProductActive(event.target.value)
                }}
              >
                <option value="all">Semua</option>
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              Ketersediaan
              <select
                className="h-11 w-full rounded-lg border border-input bg-background px-3 font-normal outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                value={productAvailable}
                onChange={(event) => {
                  setProductPage(1)
                  setProductAvailable(event.target.value)
                }}
              >
                <option value="all">Semua</option>
                <option value="active">Tersedia</option>
                <option value="inactive">Habis</option>
              </select>
            </label>
            {outlets.length ? (
              <label className="space-y-1.5 text-sm font-medium">
                Outlet
                <select
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 font-normal outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                  value={outletValue}
                  onChange={(event) => {
                    setProductPage(1)
                    setProductOutlet(event.target.value)
                  }}
                >
                  {outlets.length > 1 ? <option value="all">Semua outlet</option> : null}
                  {outlets.map((outlet) => (
                    <option key={outlet.id} value={outlet.id}>
                      {outlet.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {canReadCategories ? (
              <label className="space-y-1.5 text-sm font-medium">
                Kategori
                <select
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 font-normal outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                  value={productCategory}
                  onChange={(event) => {
                    setProductPage(1)
                    setProductCategory(event.target.value)
                  }}
                >
                  <option value="all">Semua kategori</option>
                  {categoryOptions.data?.data.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
        ) : (
          <label className="block max-w-sm space-y-1.5 text-sm font-medium">
            Status kategori
            <select
              className="h-11 w-full rounded-lg border border-input bg-background px-3 font-normal outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
              value={categoryActive}
              onChange={(event) => {
                setCategoryPage(1)
                setCategoryActive(event.target.value)
              }}
            >
              <option value="all">Semua</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </label>
        )}

        {activeSection === 'products' && canReadCategories && categoryOptions.isError ? (
          <ErrorState
            message="Daftar kategori belum dapat dimuat. Anda masih dapat membuat menu tanpa kategori atau mencoba lagi."
            onRetry={() => void categoryOptions.refetch()}
          />
        ) : null}

        {currentQuery.isPending ? (
          <LoadingState
            label={activeSection === 'products' ? 'Memuat menu...' : 'Memuat kategori...'}
          />
        ) : currentQuery.isError ? (
          <ErrorState
            message={apiErrorMessage(
              currentQuery.error,
              activeSection === 'products'
                ? 'Menu belum dapat dimuat. Periksa koneksi lalu coba lagi.'
                : 'Kategori belum dapat dimuat. Periksa koneksi lalu coba lagi.',
            )}
            onRetry={() => void currentQuery.refetch()}
          />
        ) : activeSection === 'products' ? (
          productData?.data.length ? (
            <ProductList
              items={productData.data}
              canUpdate={access.can('products.update')}
              canDelete={access.can('products.delete')}
              outletId={selectedOutletId}
              canToggleAvailability={canToggleAvailability}
              canUpdateStock={canUpdateStock}
              onEditStock={(item) => setStockTarget(item)}
              onToggleAvailability={(item) =>
                setAvailability.mutate({
                  item,
                  isAvailable: !(item.is_available_at_outlet ?? item.is_available),
                })
              }
              onEdit={(item) => setDialog({ kind: 'product', item })}
              onDeactivate={(item) => setArchiveTarget({ kind: 'product', item })}
              onActivate={(item) => activate.mutate({ kind: 'product', item })}
            />
          ) : (
            <EmptyState
              label={
                productQuery ||
                productActive !== 'all' ||
                productAvailable !== 'all' ||
                productCategory !== 'all' ||
                productOutlet !== null
                  ? 'Tidak ada menu yang cocok dengan pencarian atau filter.'
                  : 'Belum ada menu. Tambahkan menu pertama untuk memulai katalog.'
              }
              onReset={resetProductFilters}
              canReset={Boolean(
                productQuery ||
                productActive !== 'all' ||
                productAvailable !== 'all' ||
                productCategory !== 'all' ||
                productOutlet !== null,
              )}
            />
          )
        ) : categoryData?.data.length ? (
          <CategoryList
            items={categoryData.data}
            canUpdate={access.can('categories.update')}
            canDelete={access.can('categories.delete')}
            onEdit={(item) => setDialog({ kind: 'category', item })}
            onDeactivate={(item) => setArchiveTarget({ kind: 'category', item })}
            onActivate={(item) => activate.mutate({ kind: 'category', item })}
          />
        ) : (
          <EmptyState
            label={
              categoryQuery || categoryActive !== 'all'
                ? 'Tidak ada kategori yang cocok dengan pencarian atau filter.'
                : 'Belum ada kategori. Menu tetap dapat dibuat tanpa kategori.'
            }
            onReset={resetCategoryFilters}
            canReset={Boolean(categoryQuery || categoryActive !== 'all')}
          />
        )}

        {!currentQuery.isPending && !currentQuery.isError && currentQuery.data ? (
          <Pagination
            currentPage={currentQuery.data.meta.current_page}
            lastPage={currentQuery.data.meta.last_page}
            total={currentQuery.data.meta.total}
            onChange={(page) =>
              activeSection === 'products' ? setProductPage(page) : setCategoryPage(page)
            }
          />
        ) : null}
      </section>

      {dialog?.kind === 'product' ? (
        <CatalogFormDialog
          key={`product-${dialog.item?.id ?? 'new'}`}
          kind="product"
          item={dialog.item}
          categories={categoryOptions.data?.data ?? []}
          outletId={selectedOutletId}
          isSaving={saveProduct.isPending}
          onClose={() => setDialog(null)}
          onSubmit={async (input) => {
            const item = dialog.item
            if (!item || selectedOutletId === undefined) {
              await saveProduct.mutateAsync({ item, input })
              return
            }

            // Edit dengan outlet terpilih: checkbox mengatur override outlet ini (D-35).
            const previous = item.is_available_at_outlet ?? item.is_available
            const enableGlobal = input.is_available && !item.is_available
            const { is_available, ...productInput } = input
            if (is_available !== previous || enableGlobal) {
              await api.updateProductAvailability(item.id, {
                outlet_id: selectedOutletId,
                is_available,
              })
            }
            await saveProduct.mutateAsync({
              item,
              input: enableGlobal ? input : { ...productInput, is_available: item.is_available },
            })
          }}
        />
      ) : null}
      {stockTarget ? (
        <StockDialog
          item={stockTarget}
          outletName={selectedOutletName ?? 'outlet terpilih'}
          isSaving={setStock.isPending}
          onClose={() => setStockTarget(null)}
          onSubmit={async (quantity, reason) => {
            await setStock.mutateAsync({ item: stockTarget, quantity, reason })
          }}
        />
      ) : null}
      {dialog?.kind === 'category' ? (
        <CatalogFormDialog
          key={`category-${dialog.item?.id ?? 'new'}`}
          kind="category"
          item={dialog.item}
          isSaving={saveCategory.isPending}
          onClose={() => setDialog(null)}
          onSubmit={async (input) => {
            await saveCategory.mutateAsync({ item: dialog.item, input })
          }}
        />
      ) : null}

      <AlertDialog
        open={Boolean(archiveTarget)}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogTitle>
            Nonaktifkan {archiveTarget?.kind === 'category' ? 'kategori' : 'menu'}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {archiveTarget?.kind === 'category'
              ? 'Kategori akan disembunyikan dari daftar aktif. Menu dan histori transaksi tidak dihapus.'
              : 'Menu tidak akan ditawarkan untuk transaksi baru. Tindakan ini mengarsipkan/nonaktifkan data, bukan menghapus histori transaksi.'}
          </AlertDialogDescription>
          {deactivate.isError ? (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {apiErrorMessage(deactivate.error, 'Data belum dapat dinonaktifkan. Coba lagi.')}
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

function EmptyState({
  label,
  onReset,
  canReset,
}: {
  label: string
  onReset: () => void
  canReset: boolean
}) {
  return (
    <div className="rounded-lg border border-dashed px-5 py-12 text-center">
      <Tags aria-hidden="true" className="mx-auto size-8 text-muted-foreground" />
      <p className="mt-3 text-sm text-muted-foreground">{label}</p>
      {canReset ? (
        <Button type="button" variant="outline" className="mt-4" onClick={onReset}>
          Hapus filter
        </Button>
      ) : null}
    </div>
  )
}

function Pagination({
  currentPage,
  lastPage,
  total,
  onChange,
}: {
  currentPage: number
  lastPage: number
  total: number
  onChange: (page: number) => void
}) {
  return (
    <nav
      aria-label="Pagination katalog"
      className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-muted-foreground">
        Halaman {currentPage} dari {lastPage} · {total} data
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          disabled={currentPage <= 1}
          onClick={() => onChange(currentPage - 1)}
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
          Sebelumnya
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          disabled={currentPage >= lastPage}
          onClick={() => onChange(currentPage + 1)}
        >
          Berikutnya
          <ChevronRight aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </nav>
  )
}

function ProductList({
  items,
  canUpdate,
  canDelete,
  outletId,
  canToggleAvailability,
  canUpdateStock,
  onEditStock,
  onToggleAvailability,
  onEdit,
  onDeactivate,
  onActivate,
}: {
  items: Product[]
  canUpdate: boolean
  canDelete: boolean
  outletId?: number
  canToggleAvailability: boolean
  canUpdateStock: boolean
  onEditStock: (item: Product) => void
  onToggleAvailability: (item: Product) => void
  onEdit: (item: Product) => void
  onDeactivate: (item: Product) => void
  onActivate: (item: Product) => void
}) {
  const toggle = (item: Product) =>
    outletId && canToggleAvailability ? (
      <Button
        type="button"
        variant="original"
        size="icon"
        className="text-muted-foreground hover:text-foreground"
        aria-label={item.is_available_at_outlet ? 'Tandai habis' : 'Tandai tersedia'}
        onClick={() => onToggleAvailability(item)}
      >
        {item.is_available_at_outlet ? (
          <PackageX aria-hidden="true" />
        ) : (
          <PackageCheck aria-hidden="true" />
        )}
      </Button>
    ) : null

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

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="p-4">Menu</TableHead>
              <TableHead className="p-4">Kategori</TableHead>
              <TableHead className="p-4">Harga</TableHead>
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
                <TableCell className="p-4">
                  <ProductStatus item={item} outletSelected={outletId !== undefined} />
                </TableCell>
                <TableCell className="p-4">
                  <div className="flex flex-wrap max-w-48 justify-between items-center gap-2">
                    {toggle(item)}
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
              <span className="font-semibold tabular-nums">{formatRupiah(item.price)}</span>
              <div className="flex flex-wrap items-center gap-2">
                {toggle(item)}
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

function ProductStatus({ item, outletSelected }: { item: Product; outletSelected: boolean }) {
  const available = outletSelected
    ? (item.is_available_at_outlet ?? item.is_available)
    : item.is_available

  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge
        variant={item.is_active ? 'default' : 'outline'}
        className={!item.is_active ? 'bg-destructive/10 border-destructive text-destructive' : ''}
      >
        {item.is_active ? 'Aktif' : 'Nonaktif'}
      </Badge>
      <Badge variant={available ? 'secondary' : 'destructive'}>
        {available ? 'Tersedia' : 'Habis'}
        {outletSelected ? ' di outlet ini' : ''}
      </Badge>
      {outletSelected ? (
        <span
          className={`w-full text-xs ${item.stock_quantity === 0 ? 'text-destructive' : 'text-muted-foreground'}`}
        >
          Stok: {item.stock_quantity == null ? 'tanpa batas' : item.stock_quantity}
        </span>
      ) : null}
    </div>
  )
}

function StockDialog({
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
  onSubmit: (quantity: number | null, reason?: string) => Promise<void>
}) {
  const [quantity, setQuantity] = useState(
    item.stock_quantity == null ? '' : String(item.stock_quantity),
  )
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = quantity.trim()
    const parsed = value === '' ? null : Number(value)

    if (parsed !== null && (!Number.isInteger(parsed) || parsed < 0)) {
      setError('Stok harus berupa bilangan bulat mulai dari 0.')
      return
    }

    setError(null)
    try {
      await onSubmit(parsed, reason.trim() || undefined)
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

function CategoryList({
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

function ItemActions({
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
