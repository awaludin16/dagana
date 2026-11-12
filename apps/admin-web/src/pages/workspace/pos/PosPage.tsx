import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Expand, RotateCw, SquareArrowRightExit } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useBlocker, useLocation, useNavigate, useSearchParams } from 'react-router'

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
import { Button } from '@/components/ui/button'
import { api, ApiError } from '@/lib/api'
import { apiErrorMessage } from '@/lib/form-errors'
import { requestPosDisplayMode } from '@/lib/pos-mode'
import type { Order, OrderCreateInput, Product } from '@/types'

import { PosCart } from './PosCart'
import { PosCatalog } from './PosCatalog'
import { PosPayment } from './PosPayment'
import { PosResult } from './PosResult'
import {
  CATALOG_PAGE_SIZE,
  PAYMENT_METHODS,
  UUID_PATTERN,
  type CartLine,
  type CheckoutAttempt,
  type PaymentMethod,
} from '@/types/pos'

function isCartLine(value: unknown): value is CartLine {
  if (typeof value !== 'object' || value === null) return false
  const line = value as Record<string, unknown>
  return (
    Number.isSafeInteger(line.product_id) &&
    typeof line.product_name === 'string' &&
    Number.isSafeInteger(line.product_price) &&
    Number(line.product_price) >= 0 &&
    Number.isSafeInteger(line.quantity) &&
    Number(line.quantity) > 0
  )
}

function isCheckoutAttempt(value: unknown): value is CheckoutAttempt {
  if (typeof value !== 'object' || value === null) return false
  const attempt = value as Record<string, unknown>
  const input = attempt.input
  if (typeof input !== 'object' || input === null) return false
  const checkout = input as Record<string, unknown>
  return (
    typeof checkout.idempotency_key === 'string' &&
    UUID_PATTERN.test(checkout.idempotency_key) &&
    Number.isSafeInteger(checkout.outlet_id) &&
    PAYMENT_METHODS.some(({ value: method }) => method === checkout.payment_method) &&
    (checkout.payment_method !== 'cash' ||
      (Number.isSafeInteger(checkout.amount_tendered) &&
        Number(checkout.amount_tendered) >= 0 &&
        Number(checkout.amount_tendered) <= 4294967295)) &&
    Array.isArray(checkout.items) &&
    checkout.items.length > 0 &&
    checkout.items.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        Number.isSafeInteger((item as Record<string, unknown>).product_id) &&
        Number.isSafeInteger((item as Record<string, unknown>).quantity) &&
        Number((item as Record<string, unknown>).quantity) > 0,
    ) &&
    Array.isArray(attempt.cart) &&
    attempt.cart.length > 0 &&
    attempt.cart.every(isCartLine)
  )
}

function restoreCheckoutAttempt(key: string): {
  attempt: CheckoutAttempt | null
  error: string | null
} {
  try {
    const stored = sessionStorage.getItem(key)
    if (!stored) return { attempt: null, error: null }

    const parsed: unknown = JSON.parse(stored)
    if (!isCheckoutAttempt(parsed)) {
      return {
        attempt: null,
        error:
          'Checkout sebelumnya tersimpan tetapi tidak dapat dibaca. Jangan membuat transaksi baru sebelum memeriksa riwayat transaksi.',
      }
    }

    return { attempt: parsed, error: null }
  } catch {
    return {
      attempt: null,
      error:
        'Status checkout tidak dapat dibaca dari penyimpanan browser. Muat ulang halaman atau periksa riwayat transaksi sebelum membuat transaksi baru.',
    }
  }
}

function isOrder(value: unknown): value is Order {
  if (typeof value !== 'object' || value === null) return false
  const order = value as Record<string, unknown>
  return (
    Number.isSafeInteger(order.id) &&
    Number.isSafeInteger(order.outlet_id) &&
    typeof order.status === 'string' &&
    Number.isSafeInteger(order.total_amount) &&
    Array.isArray(order.items)
  )
}

function orderFromLocationState(state: unknown, key: 'receipt' | 'payment'): Order | null {
  if (typeof state !== 'object' || state === null || !(key in state)) return null
  const routeState = state as Record<string, unknown>
  return isOrder(routeState[key]) ? routeState[key] : null
}

function displayAmount(lines: CartLine[]): number {
  return lines.reduce((amount, line) => amount + line.product_price * line.quantity, 0)
}

function isPortraitMobile(): boolean {
  return (
    window.matchMedia?.('(max-width: 767px) and (orientation: portrait)').matches ??
    (window.innerWidth < 768 && window.innerHeight > window.innerWidth)
  )
}

export function PosPage() {
  const access = useAccess()

  if (access.isPending) return <LoadingState label="Memeriksa akses POS..." />
  if (access.isError) {
    return (
      <ErrorState
        message="Hak akses POS belum dapat diperiksa. Periksa koneksi lalu coba lagi."
        onRetry={() => void access.refetch()}
      />
    )
  }

  return <PosWorkspace access={access} />
}

function PosWorkspace({ access }: { access: ReturnType<typeof useAccess> }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const receiptParam = searchParams.get('receipt')
  const receiptId = receiptParam && /^\d+$/.test(receiptParam) ? Number(receiptParam) : null
  const receiptFromState = orderFromLocationState(location.state, 'receipt')
  const paymentFromState = orderFromLocationState(location.state, 'payment')
  const paymentParam = searchParams.get('payment')
  const paymentId = paymentParam && /^\d+$/.test(paymentParam) ? Number(paymentParam) : null
  const outlets = access.membership?.outlets ?? []
  const businessId = access.membership?.business.id
  const membershipId = access.membership?.id
  const storageKey = `dagana:pos-checkout:${businessId}:${membershipId}`
  const [restored] = useState(() => restoreCheckoutAttempt(storageKey))
  const [attempt, setAttempt] = useState<CheckoutAttempt | null>(restored.attempt)
  const attemptRef = useRef(restored.attempt)
  const [storageError, setStorageError] = useState<string | null>(restored.error)
  const [cart, setCart] = useState<CartLine[]>(restored.attempt?.cart ?? [])
  const [outletId, setOutletId] = useState(restored.attempt?.input.outlet_id ?? outlets[0]?.id ?? 0)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    restored.attempt?.input.payment_method === 'qr_payment' ? 'qr_payment' : 'cash',
  )
  const [paymentStage, setPaymentStage] = useState(Boolean(restored.attempt || paymentId))
  const [amountTendered, setAmountTendered] = useState(
    String(restored.attempt?.input.amount_tendered ?? 0),
  )
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [confirmQrPayment, setConfirmQrPayment] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [catalogPage, setCatalogPage] = useState(1)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [receiptRefreshError, setReceiptRefreshError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement))
  const [isPortrait, setIsPortrait] = useState(isPortraitMobile)
  const [displayError, setDisplayError] = useState<string | null>(null)
  const receiptHeading = useRef<HTMLHeadingElement>(null)
  const canReadProducts = access.can('products.read')
  const canReadOrders = access.can('orders.read')
  const canReadCategories = access.can('categories.read')
  const products = useQuery({
    queryKey: ['pos', 'products', catalogPage, search, categoryId],
    queryFn: () =>
      api.products({
        page: catalogPage,
        per_page: CATALOG_PAGE_SIZE,
        q: search,
        ...(categoryId ? { category_id: categoryId } : {}),
        is_active: true,
        is_available: true,
      }),
    enabled:
      canReadProducts && receiptId === null && paymentId === null && !paymentStage && !attempt,
  })
  const categories = useQuery({
    queryKey: ['pos', 'categories'],
    queryFn: () => api.categories({ per_page: CATALOG_PAGE_SIZE, is_active: true }),
    enabled: canReadCategories && receiptId === null && paymentId === null && !paymentStage,
  })
  const receiptQuery = useQuery({
    queryKey: ['orders', 'detail', receiptId],
    queryFn: () => api.order(receiptId!),
    enabled: receiptId !== null && canReadOrders && !receiptFromState,
    retry: false,
  })
  const paymentQuery = useQuery({
    queryKey: ['orders', 'detail', paymentId],
    queryFn: () => api.order(paymentId!),
    enabled: paymentId !== null && canReadOrders,
    initialData: paymentFromState ?? undefined,
    retry: false,
  })
  const checkout = useMutation({
    mutationFn: (current: CheckoutAttempt) => api.createOrder(current.input),
    onSuccess: async (order) => {
      try {
        sessionStorage.removeItem(storageKey)
      } catch {
        setStorageError(
          'Transaksi berhasil, tetapi status retry tidak dapat dibersihkan dari penyimpanan browser. Muat ulang receipt sebelum membuat transaksi berikutnya.',
        )
      }

      attemptRef.current = null
      setAttempt(null)
      setCheckoutError(null)
      setCart([])
      await queryClient.invalidateQueries({ queryKey: ['orders'] })
      if (order.payment?.method === 'cash' && order.payment.status === 'PAID') {
        setSearchParams({ receipt: String(order.id) }, { replace: true, state: { receipt: order } })
      } else {
        setSearchParams({ payment: String(order.id) }, { replace: true, state: { payment: order } })
        setConfirmQrPayment(false)
      }
    },
    onError: (error) => {
      const current = attemptRef.current
      if (error instanceof ApiError && [403, 422].includes(error.status) && current) {
        try {
          sessionStorage.removeItem(storageKey)
          attemptRef.current = null
          setAttempt(null)
        } catch {
          setStorageError(
            'Checkout ditolak server, tetapi status retry tidak dapat dibersihkan. Jangan mengubah transaksi sebelum memeriksa riwayat.',
          )
        }
      }

      setCheckoutError(
        error instanceof ApiError && error.status >= 500
          ? 'Server gagal memproses checkout. Status transaksi belum pasti; retry tetap memakai key yang sama. Periksa log API dan pastikan migration database terbaru sudah dijalankan.'
          : error instanceof ApiError
            ? apiErrorMessage(error, 'Server menolak checkout. Periksa menu dan konteks outlet.')
            : 'Koneksi terputus atau respons belum diterima. Coba lagi untuk mengirim ulang checkout yang sama dengan idempotency key yang sama.',
      )
    },
  })
  const confirmPayment = useMutation({
    mutationFn: (id: number) => api.confirmPayment(id),
    onSuccess: async (payment) => {
      const confirmedOrder = await api.order(payment.order_id)
      queryClient.setQueryData(['orders', 'detail', payment.order_id], confirmedOrder)
      await queryClient.invalidateQueries({ queryKey: ['orders'] })
      setSearchParams(
        { receipt: String(confirmedOrder.id) },
        { replace: true, state: { receipt: confirmedOrder } },
      )
    },
  })

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      (cart.length > 0 || paymentQuery.data?.payment?.status === 'PENDING') &&
      receiptId === null &&
      currentLocation.pathname !== nextLocation.pathname,
  )
  const receipt = receiptQuery.data ?? receiptFromState
  const paymentOrder = paymentQuery.data ?? paymentFromState
  const hasReceipt = receiptParam !== null
  const previewTotal = displayAmount(cart)

  useEffect(() => {
    const fullscreenChanged = () => setIsFullscreen(Boolean(document.fullscreenElement))
    const orientationChanged = () => setIsPortrait(isPortraitMobile())
    const displayModeChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ fullscreen: boolean; landscape: boolean }>).detail
      if (!detail.fullscreen) {
        setDisplayError('Browser membatasi layar penuh; POS tetap memenuhi area halaman.')
      } else {
        setDisplayError(null)
      }
      if (!detail.landscape) orientationChanged()
    }

    const previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('fullscreenchange', fullscreenChanged)
    window.addEventListener('resize', orientationChanged)
    window.addEventListener('orientationchange', orientationChanged)
    window.addEventListener('dagana:pos-display-mode', displayModeChanged)

    return () => {
      document.removeEventListener('fullscreenchange', fullscreenChanged)
      window.removeEventListener('resize', orientationChanged)
      window.removeEventListener('orientationchange', orientationChanged)
      window.removeEventListener('dagana:pos-display-mode', displayModeChanged)
      document.body.style.overflow = previousBodyOverflow
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCatalogPage(1)
      setSearch(searchInput.trim())
    }, 300)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    if (hasReceipt) receiptHeading.current?.focus()
  }, [hasReceipt])

  useEffect(() => {
    if (paymentId !== null && paymentOrder?.payment?.status === 'PAID') {
      setSearchParams(
        { receipt: String(paymentOrder.id) },
        { replace: true, state: { receipt: paymentOrder } },
      )
    }
  }, [paymentId, paymentOrder, setSearchParams])

  useEffect(() => {
    if ((cart.length === 0 && paymentOrder?.payment?.status !== 'PENDING') || hasReceipt) return
    const protectCart = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', protectCart)
    return () => window.removeEventListener('beforeunload', protectCart)
  }, [cart.length, hasReceipt, paymentOrder?.payment?.status])

  function addProduct(product: Product) {
    setCheckoutError(null)
    setCart((current) => {
      const existing = current.find((line) => line.product_id === product.id)
      if (existing) {
        return current.map((line) =>
          line.product_id === product.id ? { ...line, quantity: line.quantity + 1 } : line,
        )
      }
      return [
        ...current,
        {
          product_id: product.id,
          product_name: product.name,
          product_price: product.price,
          quantity: 1,
        },
      ]
    })
  }

  function changeQuantity(productId: number, amount: number) {
    setCart((current) =>
      current
        .map((line) =>
          line.product_id === productId
            ? { ...line, quantity: Math.max(0, line.quantity + amount) }
            : line,
        )
        .filter((line) => line.quantity > 0),
    )
  }

  function removeProduct(productId: number) {
    setCart((current) => current.filter((line) => line.product_id !== productId))
  }

  function setTenderedValue(value: string) {
    const digits = value.replace(/\D/g, '')
    const normalized = digits.replace(/^0+(?=\d)/, '')
    const next = normalized === '' ? '0' : normalized
    if (Number(next) <= 4294967295) {
      setAmountTendered(next)
      setCheckoutError(null)
    }
  }

  function addCashAmount(amount: number) {
    const next = Number(amountTendered) + amount
    if (Number.isSafeInteger(next) && next <= 4294967295) {
      setTenderedValue(String(next))
    }
  }

  function handleCashKey(key: string) {
    if (key === 'clear') {
      setTenderedValue('0')
    } else if (key === 'backspace') {
      setTenderedValue(amountTendered.length > 1 ? amountTendered.slice(0, -1) : '0')
    } else {
      setTenderedValue(`${amountTendered === '0' ? '' : amountTendered}${key}`)
    }
  }

  function startCheckout() {
    if (
      storageError ||
      !outletId ||
      cart.length === 0 ||
      attemptRef.current ||
      (paymentMethod === 'cash' && Number(amountTendered) < previewTotal)
    )
      return
    if (!window.crypto?.randomUUID) {
      setCheckoutError(
        'Browser ini tidak dapat membuat kunci checkout yang aman. Perbarui browser lalu coba lagi.',
      )
      return
    }

    const input: OrderCreateInput = {
      outlet_id: outletId,
      idempotency_key: window.crypto.randomUUID(),
      payment_method: paymentMethod,
      ...(paymentMethod === 'cash' ? { amount_tendered: Number(amountTendered) } : {}),
      items: cart.map(({ product_id, quantity }) => ({ product_id, quantity })),
    }
    const nextAttempt: CheckoutAttempt = {
      input,
      cart: cart.map((line) => ({ ...line })),
    }

    try {
      sessionStorage.setItem(storageKey, JSON.stringify(nextAttempt))
    } catch {
      setStorageError(
        'Browser tidak dapat menyimpan kunci checkout. Checkout dibatalkan agar retry tidak membuat order ganda.',
      )
      return
    }

    attemptRef.current = nextAttempt
    setAttempt(nextAttempt)
    setCheckoutError(null)
    checkout.mutate(nextAttempt)
  }

  function startPaymentStage() {
    if (cart.length > 0 && currentOutlet && !attempt) {
      setCheckoutError(null)
      setPaymentStage(true)
    }
  }

  function retryCheckout() {
    if (!attemptRef.current || checkout.isPending) return
    setCheckoutError(null)
    checkout.mutate(attemptRef.current)
  }

  function refreshReceipt() {
    setReceiptRefreshError(null)
    if (receiptId === null) {
      setReceiptRefreshError(
        'ID receipt tidak valid. Kembali ke transaksi baru atau buka receipt dari histori order.',
      )
      return
    }
    void receiptQuery.refetch().catch(() => {
      setReceiptRefreshError(
        'Receipt belum berhasil dimuat ulang. Data transaksi terakhir tetap ditampilkan.',
      )
    })
  }

  function startNewSale() {
    setCart([])
    setCheckoutError(null)
    setReceiptRefreshError(null)
    setSearch('')
    setSearchInput('')
    setCatalogPage(1)
    setCategoryId(null)
    setPaymentMethod('cash')
    setAmountTendered('0')
    setPaymentStage(false)
    setConfirmQrPayment(false)
    setSearchParams({}, { replace: true, state: null })
  }

  function exitPosMode() {
    navigate('/dashboard')
  }

  if (!canReadProducts && !attempt && receiptId === null && paymentId === null) {
    return (
      <section
        className="fixed inset-0 z-50 grid place-items-center bg-background p-6"
        role="alert"
      >
        Anda perlu izin `products.read` untuk melihat menu POS.
        <Button type="button" className="mt-4" onClick={exitPosMode}>
          Keluar dari POS Mode
        </Button>
      </section>
    )
  }

  const currentOutlet = outlets.find((outlet) => outlet.id === outletId)
  const productsResult = products.data
  const categoryOptions = categories.data?.data ?? [
    ...new Map(
      productsResult?.data.flatMap((product) =>
        product.category ? [[product.category.id, product.category] as const] : [],
      ) ?? [],
    ).values(),
  ]

  return (
    <main
      data-pos-mode
      className="fixed inset-0 z-50 flex h-dvh min-h-0 flex-col overflow-hidden bg-background text-foreground"
    >
      <div className="absolute left-2 top-2 z-20 rotate-180 bg-soft-primary flex items-center gap-1 rounded-lg bg-background/95 p-1 shadow-sm">
        {!isFullscreen && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11"
            aria-label="Aktifkan layar penuh"
            onClick={() =>
              void requestPosDisplayMode().then((result) => {
                if (!result.fullscreen) {
                  setDisplayError('Browser membatasi layar penuh; POS tetap memenuhi area halaman.')
                }
              })
            }
          >
            <Expand aria-hidden="true" className="size-5" />
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11"
          aria-label="Keluar dari POS Mode"
          title="Keluar dari POS Mode"
          onClick={exitPosMode}
        >
          <SquareArrowRightExit aria-hidden="true" className="size-5" />
        </Button>
      </div>

      {(displayError || isPortrait) && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-dagana-warning/20 bg-dagana-warning-container px-4 py-2 text-xs text-dagana-warning sm:text-sm">
          {isPortrait && <RotateCw aria-hidden="true" className="size-4 shrink-0" />}
          <p role="status" className="flex-1">
            {isPortrait
              ? 'Putar perangkat ke landscape untuk ruang kerja yang lebih nyaman. POS tetap dapat digunakan dalam layout responsif.'
              : displayError}
          </p>
        </div>
      )}

      {!currentOutlet && receiptId === null && paymentId === null && !attempt ? (
        <section className="grid min-h-0 flex-1 place-items-center p-6 text-center">
          <div className="max-w-md space-y-3">
            <h1 className="text-section-title">Belum ada outlet yang dapat digunakan</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Minta Owner memberikan akses outlet sebelum memulai transaksi.
            </p>
            <Button type="button" variant="outline" onClick={exitPosMode}>
              Keluar dari POS Mode
            </Button>
          </div>
        </section>
      ) : hasReceipt ? (
        <PosResult
          receipt={receipt}
          canReadOrders={canReadOrders}
          isLoading={receiptQuery.isPending}
          isRefreshing={receiptQuery.isFetching}
          error={
            receiptRefreshError ??
            (receiptQuery.isError
              ? apiErrorMessage(receiptQuery.error, 'Receipt belum dapat dimuat ulang.')
              : null)
          }
          onRefresh={refreshReceipt}
          onNewSale={startNewSale}
          headingRef={receiptHeading}
        />
      ) : paymentId !== null || paymentStage ? (
        <PosPayment
          cart={cart}
          previewTotal={previewTotal}
          outletName={currentOutlet?.name ?? ''}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          amountTendered={amountTendered}
          setTenderedValue={setTenderedValue}
          addCashAmount={addCashAmount}
          handleCashKey={handleCashKey}
          paymentOrder={paymentOrder}
          hasPaymentRoute={paymentId !== null}
          isLoadingOrder={paymentId !== null && paymentQuery.isPending}
          isRefreshingOrder={paymentQuery.isFetching}
          orderError={
            paymentQuery.isError
              ? apiErrorMessage(paymentQuery.error, 'Status pembayaran belum dapat dimuat.')
              : null
          }
          canReadOrders={canReadOrders}
          canConfirmPayment={access.can('payments.create')}
          isCheckoutPending={checkout.isPending}
          isConfirmPending={confirmPayment.isPending}
          attempt={attempt}
          storageError={storageError}
          checkoutError={checkoutError}
          confirmError={
            confirmPayment.isError
              ? apiErrorMessage(confirmPayment.error, 'Pembayaran belum dapat dikonfirmasi.')
              : null
          }
          confirmQrPayment={confirmQrPayment}
          onConfirmQrPayment={setConfirmQrPayment}
          onBack={() => setPaymentStage(false)}
          onCheckout={startCheckout}
          onRetryCheckout={retryCheckout}
          onRefreshOrder={() => void paymentQuery.refetch()}
          onConfirmPayment={() => {
            if (paymentOrder?.payment) confirmPayment.mutate(paymentOrder.payment.id)
          }}
          onShowPendingReceipt={() => {
            if (paymentOrder) {
              setSearchParams(
                { receipt: String(paymentOrder.id) },
                { replace: true, state: { receipt: paymentOrder } },
              )
            }
          }}
        />
      ) : (
        <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1.1fr)_minmax(14rem,0.9fr)] landscape:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)] landscape:grid-rows-1 md:grid-cols-[minmax(0,2fr)_minmax(17rem,1fr)] md:grid-rows-1">
          <PosCatalog
            outlets={outlets}
            outletId={outletId}
            onOutletChange={setOutletId}
            attempt={Boolean(attempt)}
            searchInput={searchInput}
            search={search}
            onSearchChange={(value) => {
              setSearchInput(value)
              setCatalogPage(1)
            }}
            categoryId={categoryId}
            categories={categoryOptions}
            onCategoryChange={(id) => {
              setCategoryId(id)
              setCatalogPage(1)
            }}
            products={productsResult}
            isLoading={products.isPending}
            error={
              products.isError
                ? apiErrorMessage(
                    products.error,
                    'Menu belum dapat dimuat. Periksa koneksi lalu coba lagi.',
                  )
                : null
            }
            onRetry={() => void products.refetch()}
            page={catalogPage}
            onPageChange={setCatalogPage}
            checkoutError={checkoutError}
            storageError={storageError}
            onAddProduct={addProduct}
          />
          <PosCart
            cart={cart}
            previewTotal={previewTotal}
            hasReceipt={hasReceipt}
            hasOutlet={Boolean(currentOutlet)}
            hasAttempt={Boolean(attempt)}
            hasStorageError={Boolean(storageError)}
            onClear={() => setCart([])}
            onChangeQuantity={changeQuantity}
            onRemove={removeProduct}
            onContinue={startPaymentStage}
          />
        </div>
      )}

      <AlertDialog
        open={blocker.state === 'blocked'}
        onOpenChange={(open) => {
          if (!open && blocker.state === 'blocked') blocker.reset()
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Keluar dari POS Mode?</AlertDialogTitle>
          <AlertDialogDescription>
            {paymentQuery.data?.payment?.status === 'PENDING' ||
            paymentFromState?.payment?.status === 'PENDING'
              ? 'Pembayaran masih menunggu konfirmasi. Keluar tidak mengubah status transaksi.'
              : `Cart berisi ${cart.reduce((count, line) => count + line.quantity, 0)} item. Jika keluar, cart yang belum di-checkout akan dihapus.`}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => blocker.state === 'blocked' && blocker.reset()}>
              Lanjutkan transaksi
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (blocker.state === 'blocked') blocker.proceed()
                else exitPosMode()
              }}
            >
              Keluar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
