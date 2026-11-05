import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Archive, ChevronLeft, ChevronRight, CirclePlus, Pencil, Search, Tags } from 'lucide-react'
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
import { CatalogFormDialog } from '@/pages/workspace/CatalogFormDialog'
import { api } from '@/lib/api'
import { apiErrorMessage } from '@/lib/form-errors'
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

function rupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)
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
  const [categoryActive, setCategoryActive] = useState('all')
  const [dialog, setDialog] = useState<DialogState>(null)
  const [archiveTarget, setArchiveTarget] = useState<ArchiveTarget>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const canReadCategories = access.can('categories.read')
  const canReadProducts = access.can('products.read')
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
    ],
    queryFn: () =>
      api.products({
        page: productPage,
        per_page: PER_PAGE,
        q: productQuery,
        is_active: activeFilter(productActive),
        is_available: activeFilter(productAvailable),
        category_id: productCategory === 'all' ? undefined : Number(productCategory),
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
            Kelola kategori, menu, harga, dan ketersediaan. Harga dan status tersedia berlaku sama
            untuk semua outlet dalam Business ini.
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
          <div className="grid gap-3 sm:grid-cols-3">
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
              onEdit={(item) => setDialog({ kind: 'product', item })}
              onDeactivate={(item) => setArchiveTarget({ kind: 'product', item })}
            />
          ) : (
            <EmptyState
              label={
                productQuery || productActive !== 'all' || productAvailable !== 'all'
                  ? 'Tidak ada menu yang cocok dengan pencarian atau filter.'
                  : 'Belum ada menu. Tambahkan menu pertama untuk memulai katalog.'
              }
              onReset={resetProductFilters}
              canReset={Boolean(
                productQuery ||
                productActive !== 'all' ||
                productAvailable !== 'all' ||
                productCategory !== 'all',
              )}
            />
          )
        ) : categoryData?.data.length ? (
          <CategoryList
            items={categoryData.data}
            canUpdate={access.can('categories.update')}
            onEdit={(item) => setDialog({ kind: 'category', item })}
            onDeactivate={(item) => setArchiveTarget({ kind: 'category', item })}
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
          isSaving={saveProduct.isPending}
          onClose={() => setDialog(null)}
          onSubmit={async (input) => {
            await saveProduct.mutateAsync({ item: dialog.item, input })
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
  onEdit,
  onDeactivate,
}: {
  items: Product[]
  canUpdate: boolean
  onEdit: (item: Product) => void
  onDeactivate: (item: Product) => void
}) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[52rem] text-left text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-muted-foreground">
              <th className="p-3 font-medium">Menu</th>
              <th className="p-3 font-medium">Kategori</th>
              <th className="p-3 text-right font-medium">Harga</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 text-right font-medium">Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b last:border-0">
                <td className="p-3 font-medium">{item.name}</td>
                <td className="p-3 text-muted-foreground">
                  {item.category?.name ?? 'Tanpa kategori'}
                </td>
                <td className="p-3 text-right tabular-nums">{rupiah(item.price)}</td>
                <td className="p-3">
                  <ProductStatus item={item} />
                </td>
                <td className="p-3">
                  <ItemActions
                    itemName={item.name}
                    canUpdate={canUpdate}
                    canDeactivate={item.is_active}
                    onEdit={() => onEdit(item)}
                    onDeactivate={() => onDeactivate(item)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
              <ProductStatus item={item} />
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="font-semibold tabular-nums">{rupiah(item.price)}</span>
              <ItemActions
                itemName={item.name}
                canUpdate={canUpdate}
                canDeactivate={item.is_active}
                onEdit={() => onEdit(item)}
                onDeactivate={() => onDeactivate(item)}
              />
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}

function ProductStatus({ item }: { item: Product }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge variant={item.is_active ? 'default' : 'outline'}>
        {item.is_active ? 'Aktif' : 'Nonaktif'}
      </Badge>
      <Badge variant={item.is_available ? 'secondary' : 'destructive'}>
        {item.is_available ? 'Tersedia' : 'Habis'}
      </Badge>
    </div>
  )
}

function CategoryList({
  items,
  canUpdate,
  onEdit,
  onDeactivate,
}: {
  items: Category[]
  canUpdate: boolean
  onEdit: (item: Category) => void
  onDeactivate: (item: Category) => void
}) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-muted-foreground">
              <th className="p-3 font-medium">Kategori</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 text-right font-medium">Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b last:border-0">
                <td className="p-3 font-medium">{item.name}</td>
                <td className="p-3">
                  <Badge variant={item.is_active ? 'default' : 'outline'}>
                    {item.is_active ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </td>
                <td className="p-3">
                  <ItemActions
                    itemName={item.name}
                    canUpdate={canUpdate}
                    canDeactivate={item.is_active}
                    onEdit={() => onEdit(item)}
                    onDeactivate={() => onDeactivate(item)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
              canDeactivate={item.is_active}
              onEdit={() => onEdit(item)}
              onDeactivate={() => onDeactivate(item)}
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
  onEdit,
  onDeactivate,
}: {
  itemName: string
  canUpdate: boolean
  canDeactivate: boolean
  onEdit: () => void
  onDeactivate: () => void
}) {
  if (!canUpdate) return null

  return (
    <div className="flex justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-11"
        aria-label={`Ubah ${itemName}`}
        onClick={onEdit}
      >
        <Pencil aria-hidden="true" className="size-4" />
      </Button>
      {canDeactivate ? (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11"
          aria-label={`Nonaktifkan ${itemName}`}
          onClick={onDeactivate}
        >
          <Archive aria-hidden="true" className="size-4" />
        </Button>
      ) : null}
    </div>
  )
}
