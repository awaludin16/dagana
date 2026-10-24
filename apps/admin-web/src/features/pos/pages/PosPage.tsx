import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Storefront } from '@phosphor-icons/react'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { useBusiness } from '@/providers/business-provider'
import type { Outlet } from '@/types/auth.types'
import type {
  CatalogCategory,
  CatalogMenu,
  PaginatedResponse,
} from '@/types/catalog.types'
import { ProductCard } from '../components/ProductCard'
import { CartSheet } from '../components/CartSheet'

export interface CartItem extends CatalogMenu {
  qty: number
}

export function PosPage() {
  const { activeOutlet } = useBusiness()
  if (!activeOutlet) {
    return (
      <EmptyState
        title="Outlet belum tersedia"
        description="Pilih atau aktifkan outlet yang dapat Anda akses untuk melihat katalog POS."
        icon={<Storefront className="size-10" weight="duotone" />}
      />
    )
  }

  return <PosCatalogPage key={String(activeOutlet.id)} outlet={activeOutlet} />
}

function PosCatalogPage({ outlet }: { outlet: Outlet }) {
  const { can } = useBusiness()
  const outletId = outlet.id
  const canReadCategories = can('categories.read')
  const [categoriesPage, setCategoriesPage] = useState(1)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [cart, setCart] = useState<CartItem[]>([])

  const categoriesQuery = useQuery({
    queryKey: ['pos-categories', outletId, categoriesPage],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<CatalogCategory>>(
        `/outlets/${outletId}/categories`,
        { params: { per_page: 100, page: categoriesPage } },
      )
      return response.data
    },
    enabled: !!outletId && canReadCategories,
  })

  const menusQuery = useQuery({
    queryKey: ['pos-menus', outletId, page, search, activeCategory],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<CatalogMenu>>(
        `/outlets/${outletId}/menus`,
        {
          params: {
            per_page: 20,
            page,
            search: search || undefined,
            category_id: activeCategory ?? undefined,
          },
        },
      )
      return response.data
    },
    enabled: !!outletId,
  })

  const addToCart = (product: CatalogMenu) => {
    setCart((previous) => {
      const existing = previous.find((item) => item.id === product.id)
      if (existing) {
        return previous.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item,
        )
      }
      return [...previous, { ...product, qty: 1 }]
    })
  }

  const inc = (id: number) => {
    setCart((previous) =>
      previous.map((item) => (item.id === id ? { ...item, qty: item.qty + 1 } : item)),
    )
  }

  const dec = (id: number) => {
    setCart((previous) =>
      previous
        .map((item) => (item.id === id ? { ...item, qty: item.qty - 1 } : item))
        .filter((item) => item.qty > 0),
    )
  }

  const remove = (id: number) => {
    setCart((previous) => previous.filter((item) => item.id !== id))
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0)
  const count = cart.reduce((sum, item) => sum + item.qty, 0)

  if (menusQuery.isPending || (canReadCategories && categoriesQuery.isPending)) {
    return <Skeleton className="h-72 w-full" />
  }

  if (menusQuery.isError || (canReadCategories && categoriesQuery.isError)) {
    return (
      <ErrorState
        title="Katalog POS tidak dapat dimuat"
        description="Periksa akses outlet atau koneksi, lalu coba lagi."
        action={
          <Button
            onClick={() => {
              void menusQuery.refetch()
              if (canReadCategories) void categoriesQuery.refetch()
            }}
          >
            Coba lagi
          </Button>
        }
      />
    )
  }

  const menus = menusQuery.data.data
  const categories = categoriesQuery.data?.data ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">POS</h1>
          <p className="text-sm text-muted-foreground">
            Menu aktif dan tersedia · {outlet.name}
          </p>
        </div>
        <CartSheet
          items={cart}
          onInc={inc}
          onDec={dec}
          onRemove={remove}
          onCheckout={() => setCart([])}
        />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          className="min-h-11 sm:max-w-xs"
          maxLength={100}
          placeholder="Cari menu..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(1)
          }}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={activeCategory === null ? 'default' : 'outline'}
            size="sm"
            className="min-h-11 sm:min-h-0"
            onClick={() => {
              setActiveCategory(null)
              setPage(1)
            }}
          >
            Semua
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              type="button"
              variant={activeCategory === category.id ? 'default' : 'outline'}
              size="sm"
              className="min-h-11 sm:min-h-0"
              onClick={() => {
                setActiveCategory(category.id)
                setPage(1)
              }}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>
      {categoriesQuery.data && categoriesQuery.data.meta.last_page > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span>
            Halaman kategori {categoriesQuery.data.meta.current_page} dari {categoriesQuery.data.meta.last_page}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={categoriesPage <= 1}
              onClick={() => {
                setCategoriesPage((current) => current - 1)
                setActiveCategory(null)
                setPage(1)
              }}
            >
              Kategori sebelumnya
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={categoriesPage >= categoriesQuery.data.meta.last_page}
              onClick={() => {
                setCategoriesPage((current) => current + 1)
                setActiveCategory(null)
                setPage(1)
              }}
            >
              Kategori berikutnya
            </Button>
          </div>
        </div>
      )}
      {menus.length === 0 ? (
        <p className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
          {search || activeCategory
            ? 'Tidak ada menu yang cocok.'
            : 'Belum ada menu yang aktif dan tersedia.'}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {menus.map((product) => (
            <ProductCard key={product.id} product={product} onAdd={addToCart} />
          ))}
        </div>
      )}
      {menusQuery.data.meta.last_page > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span>Halaman {menusQuery.data.meta.current_page} dari {menusQuery.data.meta.last_page}</span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
            >
              Sebelumnya
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={page >= menusQuery.data.meta.last_page}
              onClick={() => setPage((current) => current + 1)}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      )}
      <div className="sticky bottom-16 mt-auto rounded-lg border bg-card p-3 shadow-sm lg:hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{count} item</p>
            <p className="text-sm font-semibold tabular-nums">
              Rp {total.toLocaleString('id-ID')}
            </p>
          </div>
          <CartSheet
            items={cart}
            onInc={inc}
            onDec={dec}
            onRemove={remove}
            onCheckout={() => setCart([])}
          />
        </div>
      </div>
    </div>
  )
}
