import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CirclePlus, Search } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { useAccess } from '@/auth/useAccess'
import { FormField } from '@/components/FormField'
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
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { apiErrorMessage } from '@/lib/form-errors'
import type { Category, CategoryInput, Product, ProductInput } from '@/types'

import { CatalogFormDialog } from './CatalogFormDialog'
import { CategoryList } from './CategoryList'
import { EmptyState } from './EmptyState'
import { Pagination } from './Pagination'
import { ProductList } from './ProductList'
import { StockDialog } from './StockDialog'

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
  const canUpdateStock = access.can('products.update_stock')
  const outlets = access.membership?.outlets ?? []
  // Default ke outlet pertama agar status & stok per outlet selalu terjangkau (D-39).
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

  const setStock = useMutation({
    mutationFn: ({
      item,
      quantity,
      lowStockThreshold,
      reason,
    }: {
      item: Product
      quantity: number | null
      lowStockThreshold: number | null
      reason?: string
    }) =>
      api.updateProductStock(item.id, {
        outlet_id: selectedOutletId ?? 0,
        quantity,
        low_stock_threshold: lowStockThreshold,
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
              canUpdateStock={canUpdateStock}
              onEditStock={(item) => setStockTarget(item)}
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
          initialStockOutletId={outlets.length === 1 ? outlets[0].id : undefined}
          isSaving={saveProduct.isPending}
          onClose={() => setDialog(null)}
          onSubmit={async (input) => {
            await saveProduct.mutateAsync({ item: dialog.item, input })
          }}
        />
      ) : null}
      {stockTarget ? (
        <StockDialog
          item={stockTarget}
          outletName={selectedOutletName ?? 'outlet terpilih'}
          isSaving={setStock.isPending}
          onClose={() => setStockTarget(null)}
          onSubmit={async (quantity, lowStockThreshold, reason) => {
            await setStock.mutateAsync({
              item: stockTarget,
              quantity,
              lowStockThreshold,
              reason,
            })
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
