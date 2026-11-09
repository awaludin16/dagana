import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SessionProvider } from '@/auth/SessionProvider'
import { routes } from '@/router'

const user = { id: 8, name: 'Ayu', email: 'ayu@example.com', email_verified_at: null }
const outlet = { id: 23, name: 'Outlet Utama' }
const membership = {
  id: 1,
  role: 'OWNER',
  status: 'ACTIVE',
  business: { id: 12, name: 'Kedai Pagi' },
  outlets: [outlet],
  permissions: ['orders.create', 'orders.read', 'products.read'],
}
const product = {
  id: 9,
  business_id: 12,
  category_id: null,
  category: null,
  name: 'Es Kopi Susu',
  price: 15000,
  is_active: true,
  is_available: true,
}
const order = {
  id: 501,
  business_id: 12,
  outlet_id: outlet.id,
  source: 'POS',
  status: 'PENDING',
  total_amount: 45000,
  notes: null,
  created_at: '2026-11-08T10:30:00+07:00',
  updated_at: '2026-11-08T10:30:00+07:00',
  items: [
    {
      id: 1,
      order_id: 501,
      product_id: 9,
      product_name: 'Es Kopi Susu',
      product_price: 15000,
      quantity: 3,
      total: 45000,
      created_at: '2026-11-08T10:30:00+07:00',
    },
  ],
  payment: {
    id: 701,
    order_id: 501,
    method: 'qr_payment',
    status: 'PENDING',
    amount: 45000,
    amount_tendered: null,
    change_amount: null,
    qr_code_payload: null,
    reference: null,
    paid_at: null,
    created_at: '2026-11-08T10:30:00+07:00',
  },
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function pageResponse<T>(items: T[]) {
  return {
    data: items,
    meta: { current_page: 1, last_page: 1, per_page: 100, total: items.length },
  }
}

function renderPos() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const router = createMemoryRouter(routes, { initialEntries: ['/pos'] })

  return render(
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <RouterProvider router={router} />
      </SessionProvider>
    </QueryClientProvider>,
  )
}

function startPayment(method: 'Tunai' | 'QRIS' = 'QRIS', amount = 45000) {
  fireEvent.click(screen.getByRole('button', { name: 'Lanjut ke pembayaran' }))
  if (method === 'QRIS') {
    fireEvent.click(screen.getByRole('radio', { name: 'QRIS' }))
  } else {
    fireEvent.change(screen.getByLabelText('Jumlah dibayar'), {
      target: { value: String(amount) },
    })
  }
}

function submitPayment() {
  fireEvent.click(screen.getByRole('button', { name: 'Konfirmasi dan bayar' }))
}

function mockApi(handler: (url: URL, init?: RequestInit) => Promise<Response | null>) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input))
    if (url.pathname.endsWith('/sanctum/csrf-cookie')) return new Response(null, { status: 204 })
    const response = await handler(url, init)
    if (response) return response
    throw new Error(`Unexpected request: ${init?.method ?? 'GET'} ${url.pathname}${url.search}`)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('POS Mode (Phase 4)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    sessionStorage.clear()
    localStorage.clear()
    vi.stubGlobal('crypto', { randomUUID: () => 'f2c7d810-8ba3-4ee9-8c28-ec7501cae42a' })
  })

  it('menyajikan POS layar penuh dua panel tanpa navigasi workspace', async () => {
    mockApi(async (url) => {
      if (url.pathname.endsWith('/me')) {
        return jsonResponse({ data: { ...user, membership } })
      }
      if (url.pathname.endsWith('/products')) return jsonResponse(pageResponse([product]))
      return null
    })

    renderPos()

    const pos = await screen.findByRole('main')
    expect(pos).toHaveAttribute('data-pos-mode')
    expect(pos).toHaveClass('fixed', 'inset-0', 'h-dvh')
    expect(screen.getByRole('heading', { name: 'Pilih menu' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Cart' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Keluar dari POS Mode' })).toBeVisible()
    expect(screen.queryByRole('navigation', { name: 'Navigasi utama' })).not.toBeInTheDocument()

    fireEvent.click(await screen.findByRole('button', { name: /Es Kopi Susu/ }))
    expect(screen.getByText('Estimasi').parentElement).toHaveTextContent('Rp 15.000')
    expect(screen.getByRole('button', { name: 'Kurangi Es Kopi Susu' })).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: 'Hapus Es Kopi Susu dari cart' }))
    expect(screen.getByText('Pilih menu untuk mulai menambahkan item.')).toBeVisible()
  })

  it('memfilter kategori dan menunda pencarian realtime sekitar 300 ms', async () => {
    const category = { id: 5, business_id: 12, name: 'Kopi', is_active: true }
    const categorizedProduct = { ...product, category_id: category.id, category }
    const productQueries: URLSearchParams[] = []
    mockApi(async (url) => {
      if (url.pathname.endsWith('/me')) {
        return jsonResponse({
          data: {
            ...user,
            membership: {
              ...membership,
              permissions: [...membership.permissions, 'categories.read'],
            },
          },
        })
      }
      if (url.pathname.endsWith('/categories')) return jsonResponse(pageResponse([category]))
      if (url.pathname.endsWith('/products')) {
        productQueries.push(url.searchParams)
        return jsonResponse(pageResponse([categorizedProduct]))
      }
      return null
    })

    renderPos()
    await screen.findByRole('button', { name: /Es Kopi Susu.*15\.000/ })
    fireEvent.click(await screen.findByRole('button', { name: 'Kopi' }))
    await waitFor(() =>
      expect(productQueries.some((query) => query.get('category_id') === '5')).toBe(true),
    )

    fireEvent.change(screen.getByRole('searchbox', { name: 'Cari menu' }), {
      target: { value: 'susu' },
    })
    await new Promise((resolve) => setTimeout(resolve, 250))
    expect(productQueries.some((query) => query.get('q') === 'susu')).toBe(false)
    await waitFor(
      () =>
        expect(productQueries.map((query) => query.toString())).toEqual(
          expect.arrayContaining([expect.stringContaining('q=susu')]),
        ),
      { timeout: 1000 },
    )
  })

  it('mengirim checkout sekali, lalu menampilkan payment pending dari server', async () => {
    const fetchMock = mockApi(async (url, init) => {
      if (url.pathname.endsWith('/me')) {
        return jsonResponse({ data: { ...user, membership } })
      }
      if (url.pathname.endsWith('/products')) return jsonResponse(pageResponse([product]))
      if (url.pathname.endsWith('/orders') && init?.method === 'POST') {
        return jsonResponse({ data: order }, 201)
      }
      if (url.pathname.endsWith('/orders/501')) return jsonResponse({ data: order })
      return null
    })

    renderPos()

    const menuItem = await screen.findByRole('button', { name: /Es Kopi Susu.*15\.000/ })
    fireEvent.click(menuItem)
    fireEvent.click(menuItem)
    fireEvent.click(menuItem)
    startPayment()
    submitPayment()

    expect(await screen.findByRole('heading', { name: 'Pembayaran' })).toBeVisible()
    expect(await screen.findByText(/QRIS belum tersedia|Kode QR akan ditampilkan/)).toBeVisible()
    expect(screen.queryByRole('button', { name: /konfirmasi pembayaran/i })).not.toBeInTheDocument()

    const request = fetchMock.mock.calls.find(
      ([input, init]) =>
        new URL(String(input)).pathname.endsWith('/orders') && init?.method === 'POST',
    )
    expect(request).toBeDefined()
    const body = JSON.parse(String(request?.[1]?.body))
    expect(body).toMatchObject({
      outlet_id: outlet.id,
      idempotency_key: 'f2c7d810-8ba3-4ee9-8c28-ec7501cae42a',
      payment_method: 'qr_payment',
      items: [{ product_id: product.id, quantity: 3 }],
    })
    expect(body).not.toHaveProperty('total_amount')
    expect(body.items[0]).not.toHaveProperty('price')
  })

  it('menampilkan QR dari server dan memuat receipt dari order setelah pembayaran dikonfirmasi', async () => {
    const qrOrder = {
      ...order,
      payment: { ...order.payment, qr_code_payload: 'server-issued-qr-payload' },
    }
    const paidOrder = {
      ...qrOrder,
      status: 'PAID',
      payment: { ...qrOrder.payment, status: 'PAID' },
    }
    let paymentConfirmed = false
    const fetchMock = mockApi(async (url, init) => {
      if (url.pathname.endsWith('/me')) {
        return jsonResponse({
          data: {
            ...user,
            membership: {
              ...membership,
              permissions: [...membership.permissions, 'payments.create'],
            },
          },
        })
      }
      if (url.pathname.endsWith('/products')) return jsonResponse(pageResponse([product]))
      if (url.pathname.endsWith('/orders') && init?.method === 'POST') {
        return jsonResponse({ data: qrOrder }, 201)
      }
      if (url.pathname.endsWith('/payments/701/confirm') && init?.method === 'POST') {
        paymentConfirmed = true
        return jsonResponse({ data: { ...qrOrder.payment, status: 'PAID' } })
      }
      if (url.pathname.endsWith('/orders/501')) {
        return jsonResponse({ data: paymentConfirmed ? paidOrder : qrOrder })
      }
      return null
    })

    renderPos()
    fireEvent.click(await screen.findByRole('button', { name: /Es Kopi Susu.*15\.000/ }))
    startPayment()
    submitPayment()

    expect(await screen.findByText('Pindai untuk membayar')).toBeVisible()
    const confirmButton = screen.getByRole('button', { name: 'Konfirmasi pembayaran' })
    expect(confirmButton).toBeDisabled()
    fireEvent.click(screen.getByLabelText(/Saya sudah memverifikasi pembayaran/))
    fireEvent.click(screen.getByRole('button', { name: 'Konfirmasi pembayaran' }))

    expect(await screen.findByRole('heading', { name: 'Transaksi tercatat' })).toBeVisible()
    expect(
      fetchMock.mock.calls.some(
        ([input, init]) =>
          new URL(String(input)).pathname.endsWith('/payments/701/confirm') &&
          init?.method === 'POST',
      ),
    ).toBe(true)
    expect(
      fetchMock.mock.calls.some(([input]) =>
        new URL(String(input)).pathname.endsWith('/orders/501'),
      ),
    ).toBe(true)
  })

  it('menampilkan status pending dan mencegah checkout ganda selama request berlangsung', async () => {
    let resolveOrder: (response: Response) => void = () => {
      throw new Error('Checkout request was not started')
    }
    const fetchMock = mockApi(async (url, init) => {
      if (url.pathname.endsWith('/me')) {
        return jsonResponse({ data: { ...user, membership } })
      }
      if (url.pathname.endsWith('/products')) return jsonResponse(pageResponse([product]))
      if (url.pathname.endsWith('/orders') && init?.method === 'POST') {
        return new Promise<Response>((resolve) => {
          resolveOrder = resolve
        })
      }
      return null
    })

    renderPos()

    fireEvent.click(await screen.findByRole('button', { name: /Es Kopi Susu.*15\.000/ }))
    startPayment('Tunai', 15000)
    submitPayment()

    const pendingButton = await screen.findByRole('button', {
      name: 'Memproses transaksi...',
    })
    expect(pendingButton).toBeDisabled()
    await waitFor(() => {
      expect(
        fetchMock.mock.calls.filter(
          ([input, init]) =>
            new URL(String(input)).pathname.endsWith('/orders') && init?.method === 'POST',
        ),
      ).toHaveLength(1)
    })
    resolveOrder(jsonResponse({ data: order }, 201))
    expect(await screen.findByRole('heading', { name: 'Pembayaran' })).toBeVisible()
  })

  it('mengulang payload dan idempotency key yang sama setelah koneksi terputus', async () => {
    let orderRequests = 0
    const fetchMock = mockApi(async (url, init) => {
      if (url.pathname.endsWith('/me')) {
        return jsonResponse({ data: { ...user, membership } })
      }
      if (url.pathname.endsWith('/products')) return jsonResponse(pageResponse([product]))
      if (url.pathname.endsWith('/orders') && init?.method === 'POST') {
        orderRequests += 1
        if (orderRequests === 1) throw new TypeError('Failed to fetch')
        return jsonResponse({ data: order }, 201)
      }
      return null
    })

    renderPos()
    fireEvent.click(await screen.findByRole('button', { name: /Es Kopi Susu/ }))
    startPayment()
    submitPayment()

    expect(await screen.findByRole('alert')).toHaveTextContent(/Koneksi terputus/)
    const storedAttempt = JSON.parse(sessionStorage.getItem('dagana:pos-checkout:12:1') ?? '{}')
    expect(storedAttempt.input.idempotency_key).toBe('f2c7d810-8ba3-4ee9-8c28-ec7501cae42a')
    fireEvent.click(screen.getByRole('button', { name: 'Retry checkout yang sama' }))

    expect(await screen.findByRole('heading', { name: 'Pembayaran' })).toBeVisible()
    const bodies = fetchMock.mock.calls
      .filter(
        ([input, init]) =>
          new URL(String(input)).pathname.endsWith('/orders') && init?.method === 'POST',
      )
      .map(([, init]) => JSON.parse(String(init?.body)))
    expect(bodies).toHaveLength(2)
    expect(bodies[1]).toEqual(bodies[0])
    await waitFor(() => {
      expect(sessionStorage.getItem('dagana:pos-checkout:12:1')).toBeNull()
    })
  })

  it('menyimpan checkout untuk retry aman setelah server mengembalikan 500', async () => {
    let orderRequests = 0
    const fetchMock = mockApi(async (url, init) => {
      if (url.pathname.endsWith('/me')) {
        return jsonResponse({ data: { ...user, membership } })
      }
      if (url.pathname.endsWith('/products')) return jsonResponse(pageResponse([product]))
      if (url.pathname.endsWith('/orders') && init?.method === 'POST') {
        orderRequests += 1
        if (orderRequests === 1) return jsonResponse({ message: 'Internal error' }, 500)
        return jsonResponse({ data: order }, 201)
      }
      return null
    })

    renderPos()
    fireEvent.click(await screen.findByRole('button', { name: /Es Kopi Susu.*15\.000/ }))
    startPayment('Tunai', 15000)
    submitPayment()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'pastikan migration database terbaru sudah dijalankan',
    )
    expect(screen.getByRole('button', { name: 'Retry checkout yang sama' })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: 'Retry checkout yang sama' }))
    expect(await screen.findByRole('heading', { name: 'Pembayaran' })).toBeVisible()

    const payloads = fetchMock.mock.calls
      .filter(
        ([input, init]) =>
          new URL(String(input)).pathname.endsWith('/orders') && init?.method === 'POST',
      )
      .map(([, init]) => JSON.parse(String(init?.body)))
    expect(payloads).toHaveLength(2)
    expect(payloads[1]).toEqual(payloads[0])
  })

  it('menerima penolakan server tanpa mengunci cart agar dapat diperbaiki', async () => {
    mockApi(async (url, init) => {
      if (url.pathname.endsWith('/me')) {
        return jsonResponse({ data: { ...user, membership } })
      }
      if (url.pathname.endsWith('/products')) return jsonResponse(pageResponse([product]))
      if (url.pathname.endsWith('/orders') && init?.method === 'POST') {
        return jsonResponse({ message: 'Harga menu berubah. Periksa kembali cart.' }, 422)
      }
      return null
    })

    renderPos()

    const menuItem = await screen.findByRole('button', { name: /Es Kopi Susu.*15\.000/ })
    fireEvent.click(menuItem)
    startPayment()
    submitPayment()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Server menolak checkout. Periksa menu dan konteks outlet.',
    )
    expect(screen.getByRole('button', { name: 'Konfirmasi dan bayar' })).toBeEnabled()
    expect(sessionStorage.getItem('dagana:pos-checkout:12:1')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Kembali' }))
    fireEvent.click(await screen.findByRole('button', { name: /Es Kopi Susu.*15\.000/ }))
    expect(screen.getByText('Estimasi').parentElement).toHaveTextContent('Rp 30.000')
  })

  it('memulihkan checkout yang belum pasti setelah halaman dimuat ulang', async () => {
    const savedAttempt = {
      input: {
        outlet_id: outlet.id,
        idempotency_key: 'f2c7d810-8ba3-4ee9-8c28-ec7501cae42a',
        payment_method: 'cash',
        amount_tendered: 30000,
        items: [{ product_id: product.id, quantity: 2 }],
      },
      cart: [
        {
          product_id: product.id,
          product_name: product.name,
          product_price: product.price,
          quantity: 2,
        },
      ],
    }
    sessionStorage.setItem('dagana:pos-checkout:12:1', JSON.stringify(savedAttempt))
    const fetchMock = mockApi(async (url, init) => {
      if (url.pathname.endsWith('/me')) {
        return jsonResponse({ data: { ...user, membership } })
      }
      if (url.pathname.endsWith('/products')) return jsonResponse(pageResponse([product]))
      if (url.pathname.endsWith('/orders') && init?.method === 'POST') {
        return jsonResponse({ data: order }, 201)
      }
      return null
    })

    renderPos()

    expect(await screen.findByText(/Hasil checkout belum pasti/)).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Retry checkout yang sama' }))
    expect(await screen.findByRole('heading', { name: 'Pembayaran' })).toBeVisible()
    const request = fetchMock.mock.calls.find(
      ([input, init]) =>
        new URL(String(input)).pathname.endsWith('/orders') && init?.method === 'POST',
    )
    expect(JSON.parse(String(request?.[1]?.body))).toEqual(savedAttempt.input)
  })

  it('memuat ulang receipt dari server setelah hasil checkout', async () => {
    let receiptReads = 0
    const fetchMock = mockApi(async (url, init) => {
      if (url.pathname.endsWith('/me')) {
        return jsonResponse({ data: { ...user, membership } })
      }
      if (url.pathname.endsWith('/products')) return jsonResponse(pageResponse([product]))
      if (url.pathname.endsWith('/orders') && init?.method === 'POST') {
        const paidOrder = {
          ...order,
          status: 'PAID',
          payment: {
            ...order.payment,
            method: 'cash',
            status: 'PAID',
            amount_tendered: 45000,
            change_amount: 0,
          },
        }
        return jsonResponse({ data: paidOrder }, 201)
      }
      if (url.pathname.endsWith('/orders/501')) {
        receiptReads += 1
        return jsonResponse({
          data: { ...order, status: 'PAID', payment: { ...order.payment, status: 'PAID' } },
        })
      }
      return null
    })

    renderPos()
    fireEvent.click(await screen.findByRole('button', { name: /Es Kopi Susu/ }))
    startPayment('Tunai', 45000)
    submitPayment()
    expect(await screen.findByRole('heading', { name: 'Transaksi tercatat' })).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: 'Muat ulang receipt' }))

    await waitFor(() => expect(receiptReads).toBe(1))
    expect(await screen.findByText('Lunas')).toBeVisible()
    expect(screen.getByText('Terkonfirmasi')).toBeVisible()
    expect(
      fetchMock.mock.calls.some(([input]) =>
        new URL(String(input)).pathname.endsWith('/orders/501'),
      ),
    ).toBe(true)
  })

  it('memilih outlet yang diizinkan dan menampilkan pembayaran tunai PAID dari server', async () => {
    const secondOutlet = { id: 24, name: 'Outlet Kedua' }
    const paidOrder = {
      ...order,
      outlet_id: secondOutlet.id,
      status: 'PAID',
      payment: {
        ...order.payment,
        method: 'cash',
        status: 'PAID',
        paid_at: '2026-11-08T10:31:00+07:00',
      },
    }
    const fetchMock = mockApi(async (url, init) => {
      if (url.pathname.endsWith('/me')) {
        return jsonResponse({
          data: { ...user, membership: { ...membership, outlets: [outlet, secondOutlet] } },
        })
      }
      if (url.pathname.endsWith('/products')) return jsonResponse(pageResponse([product]))
      if (url.pathname.endsWith('/orders') && init?.method === 'POST') {
        return jsonResponse({ data: paidOrder }, 201)
      }
      return null
    })

    renderPos()

    await screen.findByRole('button', { name: /Es Kopi Susu/ })
    fireEvent.change(screen.getAllByLabelText('Outlet transaksi')[0], {
      target: { value: String(secondOutlet.id) },
    })
    fireEvent.click(await screen.findByRole('button', { name: /Es Kopi Susu/ }))
    startPayment('Tunai', 45000)
    submitPayment()

    expect(await screen.findByRole('heading', { name: 'Transaksi tercatat' })).toBeVisible()
    expect(screen.getByText('Lunas')).toBeVisible()
    expect(screen.getByText(/Dikonfirmasi/)).toBeVisible()

    const request = fetchMock.mock.calls.find(
      ([input, init]) =>
        new URL(String(input)).pathname.endsWith('/orders') && init?.method === 'POST',
    )
    expect(JSON.parse(String(request?.[1]?.body))).toMatchObject({
      outlet_id: secondOutlet.id,
      payment_method: 'cash',
      amount_tendered: 45000,
    })
  })

  it('meminta konfirmasi saat keluar dengan cart yang belum di-checkout', async () => {
    mockApi(async (url) => {
      if (url.pathname.endsWith('/me')) {
        return jsonResponse({ data: { ...user, membership } })
      }
      if (url.pathname.endsWith('/products')) return jsonResponse(pageResponse([product]))
      return null
    })

    renderPos()

    fireEvent.click(await screen.findByRole('button', { name: /Es Kopi Susu/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Keluar dari POS Mode' }))

    expect(await screen.findByRole('alertdialog')).toHaveTextContent('Keluar dari POS Mode?')
    fireEvent.click(screen.getByRole('button', { name: 'Lanjutkan transaksi' }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Cart' })).toBeVisible()
  })

  it('menambahkan nominal cepat dan memakai keypad untuk mengubah nominal tunai', async () => {
    const fetchMock = mockApi(async (url, init) => {
      if (url.pathname.endsWith('/me')) {
        return jsonResponse({ data: { ...user, membership } })
      }
      if (url.pathname.endsWith('/products')) return jsonResponse(pageResponse([product]))
      if (url.pathname.endsWith('/orders') && init?.method === 'POST') {
        return jsonResponse(
          {
            data: {
              ...order,
              status: 'PAID',
              payment: {
                ...order.payment,
                method: 'cash',
                status: 'PAID',
                amount_tendered: 15000,
                change_amount: 0,
              },
            },
          },
          201,
        )
      }
      return null
    })

    renderPos()
    fireEvent.click(await screen.findByRole('button', { name: /Es Kopi Susu/ }))
    startPayment('Tunai', 0)
    fireEvent.click(screen.getByRole('button', { name: /\+Rp.*100\.000/ }))
    fireEvent.click(screen.getByRole('button', { name: /\+Rp.*50\.000/ }))
    expect(screen.getByLabelText('Jumlah dibayar')).toHaveValue('150000')
    fireEvent.click(screen.getByRole('button', { name: 'Hapus digit terakhir' }))
    expect(screen.getByLabelText('Jumlah dibayar')).toHaveValue('15000')
    fireEvent.click(screen.getByRole('button', { name: 'Bersihkan jumlah dibayar' }))
    expect(screen.getByLabelText('Jumlah dibayar')).toHaveValue('0')
    fireEvent.click(screen.getByRole('button', { name: /\+Rp.*10\.000/ }))
    fireEvent.click(screen.getByRole('button', { name: /\+Rp.*5\.000/ }))
    expect(screen.getByLabelText('Jumlah dibayar')).toHaveValue('15000')
    submitPayment()

    expect(await screen.findByRole('heading', { name: 'Transaksi tercatat' })).toBeVisible()
    const request = fetchMock.mock.calls.find(
      ([input, init]) =>
        new URL(String(input)).pathname.endsWith('/orders') && init?.method === 'POST',
    )
    expect(JSON.parse(String(request?.[1]?.body))).toMatchObject({
      payment_method: 'cash',
      amount_tendered: 15000,
    })
  })

  it('menolak layar POS jika pengguna tidak mempunyai permission checkout', async () => {
    mockApi(async (url) => {
      if (url.pathname.endsWith('/me')) {
        return jsonResponse({
          data: { ...user, membership: { ...membership, permissions: ['products.read'] } },
        })
      }
      return null
    })

    renderPos()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Anda tidak memiliki izin untuk membuka halaman ini.',
    )
  })
})
