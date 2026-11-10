import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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
  permissions: ['orders.read'],
}
const order = {
  id: 501,
  business_id: 12,
  outlet_id: outlet.id,
  source: 'POS',
  status: 'PENDING',
  total_amount: 30000,
  notes: null,
  created_at: '2026-11-08T10:30:00+07:00',
  updated_at: '2026-11-08T10:30:00+07:00',
  items: [
    {
      id: 1,
      order_id: 501,
      product_id: 9,
      product_name: 'Es Kopi Susu versi transaksi',
      product_price: 15000,
      quantity: 2,
      total: 30000,
      created_at: '2026-11-08T10:30:00+07:00',
    },
  ],
  payment: {
    id: 701,
    order_id: 501,
    method: 'bank_transfer',
    status: 'PENDING',
    amount: 30000,
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

function pageResponse<T>(items: T[], currentPage = 1, lastPage = 1, total = items.length) {
  return {
    data: items,
    meta: {
      current_page: currentPage,
      last_page: lastPage,
      per_page: 20,
      total,
    },
  }
}

function renderOrders(path = '/orders') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const router = createMemoryRouter(routes, { initialEntries: [path] })

  return render(
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <RouterProvider router={router} />
      </SessionProvider>
    </QueryClientProvider>,
  )
}

function mockApi(handler: (url: URL) => Promise<Response | null>) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input))
    if (url.pathname.endsWith('/sanctum/csrf-cookie')) return new Response(null, { status: 204 })
    const response = await handler(url)
    if (response) return response
    throw new Error(`Unexpected request: ${url.pathname}${url.search}`)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('riwayat transaksi (Phase 4)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('menampilkan status server dan receipt dari snapshot saat dibuka', async () => {
    const fetchMock = mockApi(async (url) => {
      if (url.pathname.endsWith('/me')) {
        return jsonResponse({ data: { ...user, membership } })
      }
      if (url.pathname.endsWith('/orders/501')) return jsonResponse({ data: order })
      if (url.pathname.endsWith('/orders')) return jsonResponse(pageResponse([order]))
      return null
    })

    renderOrders()

    expect(await screen.findByRole('heading', { name: 'Riwayat transaksi' })).toBeVisible()
    expect(await screen.findByText('Menunggu pembayaran')).toBeVisible()
    expect(screen.getByText('Transfer bank · Menunggu konfirmasi')).toBeVisible()
    expect(screen.getByText(/30\.000/)).toBeVisible()

    fireEvent.click(screen.getByRole('link', { name: /Lihat receipt transaksi/ }))

    expect(await screen.findByRole('heading', { name: 'Receipt transaksi' })).toBeVisible()
    expect(screen.getByText(/Outlet Utama/)).toBeVisible()
    expect(screen.getByText('Es Kopi Susu versi transaksi')).toBeVisible()
    expect(screen.getByText('Belum dikonfirmasi')).toBeVisible()
    expect(screen.queryByRole('button', { name: /konfirmasi pembayaran/i })).not.toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([input]) => String(input).endsWith('/orders/501'))).toBe(true)
  })

  it('memuat ulang receipt dari server, bukan hanya state halaman', async () => {
    let detailRequests = 0
    mockApi(async (url) => {
      if (url.pathname.endsWith('/me')) {
        return jsonResponse({ data: { ...user, membership } })
      }
      if (url.pathname.endsWith('/orders/501')) {
        detailRequests += 1
        return jsonResponse({ data: order })
      }
      return null
    })

    renderOrders('/orders/501')

    expect(await screen.findByRole('heading', { name: 'Receipt transaksi' })).toBeVisible()
    await waitFor(() => expect(detailRequests).toBe(1))

    fireEvent.click(screen.getByRole('button', { name: 'Muat ulang receipt' }))

    await waitFor(() => expect(detailRequests).toBe(2))
  })

  it('meminta halaman riwayat berikutnya dari endpoint terpaginate', async () => {
    const fetchMock = mockApi(async (url) => {
      if (url.pathname.endsWith('/me')) {
        return jsonResponse({ data: { ...user, membership } })
      }
      if (url.pathname.endsWith('/orders')) {
        const page = Number(url.searchParams.get('page') ?? 1)
        return jsonResponse(pageResponse([order], page, 2, 2))
      }
      return null
    })

    renderOrders()

    await screen.findByRole('heading', { name: 'Riwayat transaksi' })
    fireEvent.click(await screen.findByRole('button', { name: 'Berikutnya' }))

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          ([input]) => new URL(String(input)).searchParams.get('page') === '2',
        ),
      ).toBe(true)
    })
    expect(await screen.findByText(/Halaman 2 dari 2/)).toBeVisible()
  })

  it('menangani kegagalan pemuatan riwayat dan menyediakan retry', async () => {
    let requests = 0
    mockApi(async (url) => {
      if (url.pathname.endsWith('/me')) {
        return jsonResponse({ data: { ...user, membership } })
      }
      if (url.pathname.endsWith('/orders')) {
        requests += 1
        return requests === 1
          ? jsonResponse({ message: 'Unavailable' }, 503)
          : jsonResponse(pageResponse([order]))
      }
      return null
    })

    renderOrders()

    const alert = await screen.findByRole('alert')
    expect(within(alert).getByText(/Layanan sedang mengalami gangguan/)).toBeVisible()
    fireEvent.click(within(alert).getByRole('button', { name: 'Coba lagi' }))

    expect(await screen.findByText('Menunggu pembayaran')).toBeVisible()
  })

  it('menolak tampilan histori ketika permission orders.read tidak tersedia', async () => {
    mockApi(async (url) => {
      if (url.pathname.endsWith('/me')) {
        return jsonResponse({
          data: { ...user, membership: { ...membership, permissions: [] } },
        })
      }
      return null
    })

    renderOrders()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Anda tidak memiliki izin untuk membuka halaman ini.',
    )
  })
})
