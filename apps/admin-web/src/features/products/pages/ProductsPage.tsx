import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MagnifyingGlass, Package, Plus } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { PaginationBar } from '@/components/ui/pagination-bar'
import { api } from '@/lib/api'
import { apiErrorMessage } from '@/lib/api-errors'
import { useBusiness } from '@/providers/business-provider'
import type {
  CatalogCategory,
  CatalogMenu,
  PaginatedResponse,
} from '@/types/catalog.types'
import { ProductTable } from '../components/ProductTable'

interface MenuForm {
  name: string
  price: string
  categoryId: string
  isAvailable: boolean
}

export function ProductsPage() {
  const { activeBusiness, can } = useBusiness()
  const queryClient = useQueryClient()
  const businessId = activeBusiness?.id
  const canReadCategories = can('categories.read')
  const [page, setPage] = useState(1)
  const [categoryPage, setCategoryPage] = useState(1)
  const [search, setSearch] = useState('')
  const [showMenuForm, setShowMenuForm] = useState(false)
  const [editingMenu, setEditingMenu] = useState<CatalogMenu | null>(null)
  const [menuForm, setMenuForm] = useState<MenuForm>({
    name: '',
    price: '',
    categoryId: '',
    isAvailable: true,
  })
  const [categoryName, setCategoryName] = useState('')
  const [editingCategory, setEditingCategory] = useState<CatalogCategory | null>(null)

  const menusQuery = useQuery({
    queryKey: ['catalog-menus', businessId, page, search],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<CatalogMenu>>(
        `/businesses/${businessId}/menus`,
        { params: { status: 'all', per_page: 20, page, search: search || undefined } },
      )
      return response.data
    },
    enabled: !!businessId && can('products.read'),
  })

  const categoriesQuery = useQuery({
    queryKey: ['catalog-categories', businessId, categoryPage],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<CatalogCategory>>(
        `/businesses/${businessId}/categories`,
        { params: { status: 'all', per_page: 100, page: categoryPage } },
      )
      return response.data
    },
    enabled: !!businessId && canReadCategories,
  })

  const saveMenu = useMutation({
    mutationFn: async (form: MenuForm) => {
      const payload: {
        name: string
        price: number
        is_available: boolean
        category_id?: number | null
      } = {
        name: form.name,
        price: Number(form.price),
        is_available: form.isAvailable,
      }
      const originalCategoryId = editingMenu?.category_id ?? null
      const nextCategoryId = form.categoryId ? Number(form.categoryId) : null
      if (!editingMenu || originalCategoryId !== nextCategoryId) {
        payload.category_id = nextCategoryId
      }

      return editingMenu
        ? api.patch(`/businesses/${businessId}/menus/${editingMenu.id}`, payload)
        : api.post(`/businesses/${businessId}/menus`, payload)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['catalog-menus', businessId] })
      toast.success(editingMenu ? 'Menu berhasil diperbarui' : 'Menu berhasil dibuat')
      setEditingMenu(null)
      setShowMenuForm(false)
      setMenuForm({ name: '', price: '', categoryId: '', isAvailable: true })
    },
  })

  const changeMenu = useMutation({
    mutationFn: async ({
      menu,
      action,
      value,
    }: {
      menu: CatalogMenu
      action: 'disable' | 'enable' | 'availability'
      value?: boolean
    }) => {
      if (action === 'availability') {
        return api.patch(`/businesses/${businessId}/menus/${menu.id}`, {
          is_available: value,
        })
      }
      return api.post(`/businesses/${businessId}/menus/${menu.id}/${action}`)
    },
    onSuccess: (_response, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['catalog-menus', businessId] })
      toast.success(
        variables.action === 'availability'
          ? variables.value ? 'Ketersediaan menu diperbarui' : 'Menu ditandai tidak tersedia'
          : variables.action === 'disable' ? 'Menu dinonaktifkan' : 'Menu diaktifkan kembali',
      )
    },
  })

  const saveCategory = useMutation({
    mutationFn: (name: string) =>
      editingCategory
        ? api.patch(`/businesses/${businessId}/categories/${editingCategory.id}`, { name })
        : api.post(`/businesses/${businessId}/categories`, { name }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['catalog-categories', businessId] })
      toast.success(editingCategory ? 'Kategori berhasil diperbarui' : 'Kategori berhasil dibuat')
      setEditingCategory(null)
      setCategoryName('')
    },
  })

  const changeCategory = useMutation({
    mutationFn: ({
      category,
      action,
    }: {
      category: CatalogCategory
      action: 'disable' | 'enable'
    }) =>
      api.post<{ data: CatalogCategory }>(
        `/businesses/${businessId}/categories/${category.id}/${action}`,
      ),
    onMutate: ({ category, action }) => {
      const queryKey = ['catalog-categories', businessId]
      void queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueriesData<PaginatedResponse<CatalogCategory>>({
        queryKey,
      })

      queryClient.setQueriesData<PaginatedResponse<CatalogCategory>>({ queryKey }, (current) => {
        if (!current) return current

        return {
          ...current,
          data: current.data.map((item) =>
            item.id === category.id
              ? { ...item, status: action === 'disable' ? 'disabled' : 'active' }
              : item,
          ),
        }
      })

      return { previous }
    },
    onError: (error, _variables, context) => {
      context?.previous.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
      toast.error(apiErrorMessage(error, 'Status kategori belum dapat diperbarui. Coba lagi.'))
    },
    onSuccess: (response, { category }) => {
      const updatedCategory = response.data.data
      queryClient.setQueriesData<PaginatedResponse<CatalogCategory>>(
        { queryKey: ['catalog-categories', businessId] },
        (current) => current && ({
          ...current,
          data: current.data.map((item) =>
            item.id === category.id ? updatedCategory : item,
          ),
        }),
      )
      void queryClient.invalidateQueries({ queryKey: ['pos-categories'] })
      toast.success(
        updatedCategory.status === 'disabled'
          ? 'Kategori dinonaktifkan'
          : 'Kategori diaktifkan kembali',
      )
    },
  })

  const startEditingMenu = (menu: CatalogMenu) => {
    setEditingMenu(menu)
    setMenuForm({
      name: menu.name,
      price: String(menu.price),
      categoryId: menu.category_id ? String(menu.category_id) : '',
      isAvailable: menu.is_available,
    })
    setShowMenuForm(true)
  }

  const submitMenu = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    saveMenu.mutate(menuForm)
  }

  const submitCategory = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    saveCategory.mutate(categoryName.trim())
  }

  if (menusQuery.isPending) {
    return (
      <div className="space-y-6" aria-label="Memuat katalog" aria-busy="true">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-52" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
          <Skeleton className="h-11 w-36" />
        </div>
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-10 w-full max-w-xs" />
          </div>
          <div className="rounded-lg border">
            <div className="flex items-center gap-3 border-b p-3">
              {[0, 1, 2, 3].map((col) => (
                <Skeleton key={col} className="h-5 flex-1" />
              ))}
            </div>
            {[0, 1, 2].map((row) => (
              <div key={row} className="flex items-center gap-3 p-3">
                {[0, 1, 2, 3].map((col) => (
                  <Skeleton key={col} className="h-5 flex-1" />
                ))}
              </div>
            ))}
          </div>
        </section>
      </div>
    )
  }

  if (menusQuery.isError) {
    return (
      <ErrorState
        title="Katalog tidak dapat dimuat"
        description={apiErrorMessage(menusQuery.error, 'Permintaan katalog gagal. Periksa koneksi lalu coba lagi.')}
        action={<Button onClick={() => void menusQuery.refetch()}>Coba lagi</Button>}
      />
    )
  }

  const menus = menusQuery.data.data
  const categories = categoriesQuery.data?.data ?? []

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="app-page-title">Produk dan kategori</h1>
          <p className="text-sm text-muted-foreground">
            Kelola menu, harga, dan ketersediaan untuk seluruh outlet bisnis Anda.
          </p>
        </div>
        {can('products.create') && (
          <Button
            type="button"
            className="min-h-11 gap-2"
            onClick={() => {
              setEditingMenu(null)
              setMenuForm({ name: '', price: '', categoryId: '', isAvailable: true })
              setShowMenuForm((open) => !open)
            }}
          >
            <Plus className="size-4" />
            Tambah menu
          </Button>
        )}
      </header>

      {showMenuForm && (
        <form onSubmit={submitMenu} className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-2">
          <h2 className="text-base font-semibold sm:col-span-2">
            {editingMenu ? 'Ubah menu' : 'Menu baru'}
          </h2>
          <label className="space-y-1 text-sm">
            <span>Nama menu</span>
            <Input
              required
              className="min-h-11"
              maxLength={150}
              value={menuForm.name}
              onChange={(event) => setMenuForm({ ...menuForm, name: event.target.value })}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span>Harga (rupiah)</span>
            <Input
              required
              type="number"
              min={1}
              className="min-h-11"
              step={1}
              value={menuForm.price}
              onChange={(event) => setMenuForm({ ...menuForm, price: event.target.value })}
            />
          </label>
          {canReadCategories && (
            <label className="space-y-1 text-sm">
              <span>Kategori (opsional)</span>
              <select
                className="min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={menuForm.categoryId}
                onChange={(event) => setMenuForm({ ...menuForm, categoryId: event.target.value })}
              >
                <option value="">Tanpa kategori</option>
                {editingMenu?.category_id
                  && !categories.some((category) => category.id === editingMenu.category_id)
                  && (
                    <option value={editingMenu.category_id}>
                      {editingMenu.category?.name ?? 'Kategori saat ini'}
                    </option>
                  )}
                {categories
                  .filter((category) => category.status === 'active')
                  .map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
              </select>
            </label>
          )}
          <label className="flex min-h-9 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={menuForm.isAvailable}
              onChange={(event) => setMenuForm({ ...menuForm, isAvailable: event.target.checked })}
            />
            Tersedia untuk dijual
          </label>
          {saveMenu.isError && (
            <p className="text-sm text-destructive sm:col-span-2" role="alert">
              {apiErrorMessage(saveMenu.error, 'Menu belum dapat disimpan. Periksa kembali data lalu coba lagi.')}
            </p>
          )}
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={saveMenu.isPending}>
              {saveMenu.isPending ? 'Menyimpan…' : 'Simpan'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={() => {
                setShowMenuForm(false)
                setEditingMenu(null)
              }}
            >
              Batal
            </Button>
          </div>
        </form>
      )}

      <section className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold">Menu</h2>
          <div className="relative w-full sm:max-w-xs">
            <MagnifyingGlass className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              type="search"
              maxLength={100}
              placeholder="Cari menu…"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              className="pl-8"
            />
          </div>
        </div>
        {menus.length === 0 ? (
          <EmptyState
            title={search ? 'Menu tidak ditemukan' : 'Belum ada menu'}
            description={search ? 'Coba kata pencarian lain.' : 'Tambahkan menu pertama untuk mulai berjualan.'}
            icon={<Package className="size-10" weight="duotone" />}
            action={!search && can('products.create')
              ? <Button onClick={() => setShowMenuForm(true)}>Tambah menu</Button>
              : undefined}
          />
        ) : (
          <ProductTable
            products={menus}
            canUpdate={can('products.update')}
            canArchive={can('products.archive')}
            onEdit={startEditingMenu}
            onToggleAvailability={(menu) => changeMenu.mutate({
              menu,
              action: 'availability',
              value: !menu.is_available,
            })}
            onToggleStatus={(menu) => {
              const action = menu.status === 'active' ? 'disable' : 'enable'
              if (
                action === 'disable'
                && !window.confirm('Menu akan disembunyikan dari transaksi baru. Nonaktifkan menu ini?')
              ) return
              changeMenu.mutate({ menu, action })
            }}
          />
        )}
        {changeMenu.isError && (
          <p className="text-sm text-destructive" role="alert">
            {apiErrorMessage(changeMenu.error, 'Status menu belum dapat diperbarui. Coba lagi.')}
          </p>
        )}
        <PaginationBar
          page={menusQuery.data.meta.current_page}
          lastPage={menusQuery.data.meta.last_page}
          total={menusQuery.data.meta.total}
          perPage={menusQuery.data.meta.per_page}
          noun="menu"
          onPageChange={setPage}
        />
      </section>

      {canReadCategories && (
        <section className="space-y-3 pt-5">
          <div>
            <h2 className="text-base font-semibold">Kategori</h2>
            <p className="text-sm text-muted-foreground">Kategori bersifat opsional untuk setiap menu.</p>
          </div>
          {can('categories.create') || editingCategory ? (
            <form onSubmit={submitCategory} className="flex flex-col gap-2 sm:flex-row">
              <Input
                required
                className="min-h-11"
                maxLength={150}
                aria-label="Nama kategori"
                placeholder="Nama kategori"
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
              />
              <Button type="submit" disabled={saveCategory.isPending}>
                {editingCategory ? 'Simpan perubahan' : 'Tambah kategori'}
              </Button>
              {editingCategory && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingCategory(null)
                    setCategoryName('')
                  }}
                >
                  Batal
                </Button>
              )}
            </form>
          ) : null}
          {saveCategory.isError && (
            <p className="text-sm text-destructive" role="alert">
              {apiErrorMessage(saveCategory.error, 'Kategori belum dapat disimpan. Periksa kembali data lalu coba lagi.')}
            </p>
          )}
          {categoriesQuery.isError ? (
            <ErrorState
              title="Kategori tidak dapat dimuat"
              description={apiErrorMessage(categoriesQuery.error, 'Permintaan kategori gagal. Periksa koneksi lalu coba lagi.')}
              action={<Button onClick={() => void categoriesQuery.refetch()}>Coba lagi</Button>}
            />
          ) : categoriesQuery.isPending ? (
            <div className="rounded-lg border">
              {[0, 1].map((row) => (
                <div
                  key={row}
                  className="flex items-center justify-between gap-2 border-b p-3 last:border-b-0"
                >
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada kategori.</p>
          ) : (
            <div className="divide-y rounded-lg border">
              {categories.map((category) => (
                <div key={category.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{category.name}</span>
                    <Badge variant={category.status === 'active' ? 'secondary' : 'outline'}>
                      {category.status === 'active' ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    {can('categories.update') && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="min-h-11 sm:min-h-0"
                        onClick={() => {
                          setEditingCategory(category)
                          setCategoryName(category.name)
                        }}
                      >
                        Ubah
                      </Button>
                    )}
                    {can('categories.archive') && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="min-h-11 sm:min-h-0"
                        disabled={changeCategory.isPending}
                        onClick={() => {
                          const action = category.status === 'active' ? 'disable' : 'enable'
                          if (
                            action === 'disable'
                            && !window.confirm(
                              'Kategori disembunyikan dari filter POS. Menu di dalamnya tetap aktif dan dapat dijual. Nonaktifkan kategori ini?',
                            )
                          ) return
                          changeCategory.mutate({ category, action })
                        }}
                      >
                        {changeCategory.isPending
                          && changeCategory.variables?.category.id === category.id
                          ? 'Menyimpan…'
                          : category.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {changeCategory.isError && (
            <p className="text-sm text-destructive" role="alert">
              {apiErrorMessage(changeCategory.error, 'Status kategori belum dapat diperbarui. Coba lagi.')}
            </p>
          )}
          {categoriesQuery.data && (
            <PaginationBar
              page={categoriesQuery.data.meta.current_page}
              lastPage={categoriesQuery.data.meta.last_page}
              total={categoriesQuery.data.meta.total}
              perPage={categoriesQuery.data.meta.per_page}
              noun="kategori"
              onPageChange={setCategoryPage}
            />
          )}
        </section>
      )}
    </div>
  )
}
