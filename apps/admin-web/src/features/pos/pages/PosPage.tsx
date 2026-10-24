import { useRef, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Storefront } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PaginationBar } from '@/components/ui/pagination-bar'
import { api } from '@/lib/api'
import { apiErrorMessage } from '@/lib/api-errors'
import { useBusiness } from '@/providers/business-provider'
import type { Outlet } from '@/types/auth.types'
import type {
  CatalogCategory,
  CatalogMenu,
  PaginatedResponse,
} from '@/types/catalog.types'
import type { Order, PaymentMethod } from '@/types/order.types'
import { ProductCard } from '../components/ProductCard'
import { CartSheet } from '../components/CartSheet'

export interface CartItem extends CatalogMenu {
  qty: number
}

const paymentMethodLabel: Record<PaymentMethod, string> = {
  cash: 'Tunai',
  qr_payment: 'QR payment',
  bank_transfer: 'Transfer bank',
  debit: 'Debit',
  credit: 'Kredit',
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
  const canCheckout = can('orders.create') && can('payments.create')
  const [categoriesPage, setCategoriesPage] = useState(1)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [cart, setCart] = useState<CartItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [checkoutBlocked, setCheckoutBlocked] = useState(false)
  const idempotencyKey = useRef<string | null>(null)

  const checkoutMutation = useMutation({
    mutationFn: async ({
      items,
      method,
      key,
    }: {
      items: Array<{ menu_id: number; quantity: number }>
      method: PaymentMethod
      key: string
    }) => {
      const response = await api.post<{ data: Order }>(
        `/outlets/${outletId}/orders`,
        { items, payment_method: method },
        { headers: { 'Idempotency-Key': key } },
      )
      return response.data.data
    },
    onSuccess: (order) => {
      setCart([])
      idempotencyKey.current = null
      setCheckoutBlocked(false)
      toast.success(
        order.status === 'PAID'
          ? `Transaksi ${order.number} selesai`
          : `Order ${order.number} menunggu konfirmasi pembayaran`,
      )
    },
    onError: (error) => {
      toast.error(
        apiErrorMessage(error, 'Checkout gagal. Periksa data, lalu coba lagi.'),
      )
      const status = isAxiosError(error) ? error.response?.status : undefined
      if (status !== undefined && status < 500 && status !== 409) {
        idempotencyKey.current = null
        setCheckoutBlocked(false)
      } else {
        setCheckoutBlocked(true)
      }
    },
  })

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
    idempotencyKey.current = null
    setCheckoutBlocked(false)
    checkoutMutation.reset()
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
    idempotencyKey.current = null
    setCheckoutBlocked(false)
    checkoutMutation.reset()
    setCart((previous) =>
      previous.map((item) => (item.id === id ? { ...item, qty: item.qty + 1 } : item)),
    )
  }

  const dec = (id: number) => {
    idempotencyKey.current = null
    setCheckoutBlocked(false)
    checkoutMutation.reset()
    setCart((previous) =>
      previous
        .map((item) => (item.id === id ? { ...item, qty: item.qty - 1 } : item))
        .filter((item) => item.qty > 0),
    )
  }

  const remove = (id: number) => {
    idempotencyKey.current = null
    setCheckoutBlocked(false)
    checkoutMutation.reset()
    setCart((previous) => previous.filter((item) => item.id !== id))
  }

  const checkout = (method: PaymentMethod) => {
    const key = idempotencyKey.current ?? crypto.randomUUID()
    idempotencyKey.current = key
    checkoutMutation.mutate({
      method,
      key,
      items: cart.map((item) => ({ menu_id: item.id, quantity: item.qty })),
    })
  }

  const checkoutError = checkoutMutation.error
    ? apiErrorMessage(checkoutMutation.error, 'Checkout gagal. Coba lagi.')
    : null
  const isCheckoutLocked = checkoutMutation.isPending || checkoutBlocked

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0)
  const count = cart.reduce((sum, item) => sum + item.qty, 0)

  if (menusQuery.isPending || (canReadCategories && categoriesQuery.isPending)) {
    return (
      <div
        className="flex flex-col gap-4"
        aria-busy="true"
        aria-label="Memuat katalog POS"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Skeleton className="h-7 w-40" />
            <Skeleton className="mt-2 h-4 w-64 max-w-full" />
          </div>
          <Skeleton className="h-11 w-40" />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Skeleton className="h-11 sm:max-w-xs sm:flex-1 w-full" />
          <div className="flex gap-2">
            {['Semua', 'Kopi', 'Non-Kopi'].map((chip) => (
              <Skeleton key={chip} className="h-11 w-24 rounded-md" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 9 }, (_, index) => (
            <Skeleton key={index} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (menusQuery.isError || (canReadCategories && categoriesQuery.isError)) {
    return (
      <ErrorState
        title="Katalog POS tidak dapat dimuat"
        description={
          apiErrorMessage(
            menusQuery.error ?? categoriesQuery.error,
            'Periksa akses outlet atau koneksi, lalu coba lagi.',
          )
        }
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
          <h1 className="app-page-title">POS</h1>
          <p className="text-sm text-muted-foreground">
            Menu aktif dan tersedia · {outlet.name}
          </p>
        </div>
        <CartSheet
          items={cart}
          onInc={inc}
          onDec={dec}
          onRemove={remove}
          onCheckout={checkout}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={(method) => {
            idempotencyKey.current = null
            setCheckoutBlocked(false)
            checkoutMutation.reset()
            setPaymentMethod(method)
          }}
          canCheckout={canCheckout}
          isCheckingOut={checkoutMutation.isPending}
          isCheckoutLocked={isCheckoutLocked}
          checkoutError={checkoutError}
        />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          className="min-h-11 sm:max-w-xs"
          type="search"
          maxLength={100}
          placeholder="Cari menu…"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(1)
          }}
        />
        {categories.length > 0 && (
          <div className="flex-1 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
              <Button
                type="button"
                variant={activeCategory === null ? 'default' : 'outline'}
                size="sm"
                className="min-h-11 shrink-0"
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
                  className="min-h-11 shrink-0"
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
        )}
      </div>
      {categoriesQuery.data && categoriesQuery.data.meta.last_page > 1 && (
        <PaginationBar
          page={categoriesQuery.data.meta.current_page}
          lastPage={categoriesQuery.data.meta.last_page}
          total={categoriesQuery.data.meta.total}
          noun="kategori"
          onPageChange={(next) => {
            setCategoriesPage(next)
            setActiveCategory(null)
            setPage(1)
          }}
        />
      )}
      {menus.length === 0 ? (
        <EmptyState
          title={search || activeCategory ? 'Tidak ada menu yang cocok' : 'Belum ada menu aktif'}
          description={
            search || activeCategory
              ? 'Coba kata pencarian lain atau pilih kategori "Semua".'
              : 'Tambahkan menu di katalog agar dapat mulai berjualan.'
          }
          icon={<Storefront className="size-10" weight="duotone" />}
          action={
            !search && !activeCategory && can('products.create') ? (
              <Button asChild>
                <Link to="/products">Kelola katalog</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-2 pb-24 sm:grid-cols-3 md:grid-cols-4 lg:pb-0 lg:grid-cols-5 xl:grid-cols-6">
          {menus.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAdd={addToCart}
              disabled={isCheckoutLocked}
            />
          ))}
        </div>
      )}
      <PaginationBar
        page={menusQuery.data.meta.current_page}
        lastPage={menusQuery.data.meta.last_page}
        total={menusQuery.data.meta.total}
        noun="menu"
        onPageChange={setPage}
        className={menus.length === 0 ? 'sr-only' : undefined}
      />
      <div className="sticky bottom-16 mt-auto rounded-lg border bg-card p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{count} item · {paymentMethodLabel[paymentMethod]}</p>
            <p className="text-sm font-semibold tabular-nums">
              Total Rp {total.toLocaleString('id-ID')}
            </p>
          </div>
          <CartSheet
            items={cart}
            onInc={inc}
            onDec={dec}
            onRemove={remove}
            onCheckout={checkout}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={(method) => {
              idempotencyKey.current = null
              setCheckoutBlocked(false)
              checkoutMutation.reset()
              setPaymentMethod(method)
            }}
            canCheckout={canCheckout}
            isCheckingOut={checkoutMutation.isPending}
            isCheckoutLocked={isCheckoutLocked}
            checkoutError={checkoutError}
          />
        </div>
      </div>
    </div>
  )
}
