import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SessionProvider } from '@/auth/SessionProvider'
import { routes } from '@/router'

const user = { id: 8, name: 'Ayu', email: 'ayu@example.com', email_verified_at: null }
const outletA = { id: 23, name: 'Outlet Kopi' }
const outletB = { id: 24, name: 'Outlet Roti' }

const ownerMembership = {
  id: 1,
  role: 'OWNER',
  status: 'ACTIVE',
  business: { id: 12, name: 'Kedai Pagi' },
  outlets: [outletA, outletB],
  permissions: ['reports.read', 'cash.read', 'inventory.read', 'orders.read', 'orders.create'],
}

// Fixture: rentang 1–7 Nov (7 hari). Kartu memakai hari terakhir rentang
// (fallback saat hari berjalan tidak ada di fixture) = 7 Nov.
const salesReport = {
  from: '2026-11-01',
  to: '2026-11-07',
  summary: { sales_total: 375000, transactions: 10 },
  days: [
    { date: '2026-11-01', sales_total: 100000, transactions: 2, average_order_value: 50000 },
    { date: '2026-11-02', sales_total: 50000, transactions: 1, average_order_value: 50000 },
    { date: '2026-11-03', sales_total: 0, transactions: 0, average_order_value: null },
    { date: '2026-11-04', sales_total: 75000, transactions: 2, average_order_value: 37500 },
    { date: '2026-11-05', sales_total: 75000, transactions: 3, average_order_value: 25000 },
    { date: '2026-11-06', sales_total: 0, transactions: 0, average_order_value: null },
    { date: '2026-11-07', sales_total: 75000, transactions: 2, average_order_value: 37500 },
  ],
}

const openSessions = [
  {
    id: 401,
    outlet_id: outletA.id,
    operator_membership_id: 1,
    status: 'OPEN',
    opening_cash: 500000,
    expected_cash: 640000,
    actual_cash: null,
    variance: null,
    variance_note: null,
    opened_at: '2026-11-07T08:00:00+07:00',
    closed_at: null,
    closed_by_membership_id: null,
    created_at: '2026-11-07T08:00:00+07:00',
  },
]

const lowStockItems = [
  {
    id: 9,
    business_id: 12,
    outlet_id: outletA.id,
    name: 'Susu UHT',
    unit: 'ml',
    low_stock_threshold: 2000,
    current_stock: 1500,
    is_low_stock: true,
    is_active: true,
    created_at: '2026-11-01T00:00:00+07:00',
    updated_at: '2026-11-01T00:00:00+07:00',
  },
  {
    id: 10,
    business_id: 12,
    outlet_id: outletA.id,
    name: 'Gula Pasir',
    unit: 'g',
    low_stock_threshold: 500,
    current_stock: 300,
    is_low_stock: true,
    is_active: true,
    created_at: '2026-11-01T00:00:00+07:00',
    updated_at: '2026-11-01T00:00:00+07:00',
  },
]

const recentOrders = [
  {
    id: 900,
    business_id: 12,
    outlet_id: outletA.id,
    source: 'POS',
    status: 'PAID',
    total_amount: 75000,
    notes: null,
    created_at: '2026-11-07T15:00:00+07:00',
    updated_at: '2026-11-07T15:00:00+07:00',
    items: [],
    payment: null,
  },
  {
    id: 901,
    business_id: 12,
    outlet_id: outletB.id,
    source: 'QR',
    status: 'PENDING',
    total_amount: 50000,
    notes: null,
    created_at: '2026-11-07T16:00:00+07:00',
    updated_at: '2026-11-07T16:00:00+07:00',
    items: [],
    payment: null,
  },
]

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function pageResponse<T>(items: T[], total = items.length) {
  return {
    data: items,
    meta: { current_page: 1, last_page: 1, per_page: 50, total },
  }
}

// jsdom tidak punya ResizeObserver; recharts ResponsiveContainer membutuhkannya.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function mockApi(membership: typeof ownerMembership | null) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input))
    if (url.pathname.endsWith('/sanctum/csrf-cookie')) return new Response(null, { status: 204 })
    if (url.pathname.endsWith('/me')) {
      return jsonResponse({ data: { ...user, membership } })
    }
    if (url.pathname.endsWith('/reports/sales')) return jsonResponse({ data: salesReport })
    if (url.pathname.endsWith('/cash-sessions')) return jsonResponse(pageResponse(openSessions))
    if (url.pathname.endsWith('/inventory')) return jsonResponse(pageResponse(lowStockItems))
    if (url.pathname.endsWith('/orders')) return jsonResponse(pageResponse(recentOrders))
    throw new Error(`Unexpected request: ${url.pathname}${url.search}`)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const router = createMemoryRouter(routes, { initialEntries: ['/'] })

  return render(
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <RouterProvider router={router} />
      </SessionProvider>
    </QueryClientProvider>,
  )
}

describe('dashboard (Owner Dashboard)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
    localStorage.clear()
  })

  it('menampilkan kartu hari ini, tren 7 hari, status kas, stok rendah, transaksi terbaru, dan aksi mulai jualan', async () => {
    mockApi(ownerMembership)

    renderDashboard()

    // Kartu hari ini memakai hari terakhir rentang query 7 hari.
    expect(
      (await screen.findByText('Penjualan hari ini')).parentElement?.parentElement,
    ).toHaveTextContent(/Rp.?75\.000/)
    expect(screen.getByText('Transaksi hari ini').parentElement?.parentElement).toHaveTextContent(
      /2 transaksi/,
    )
    expect(
      screen.getByText('Rata-rata per transaksi').parentElement?.parentElement,
    ).toHaveTextContent(/Rp.?37\.500/)

    // Grafik tren dapat diakses sebagai role img dengan deskripsi.
    expect(screen.getByRole('img', { name: /Tren penjualan 7 hari/ })).toBeVisible()

    // Status kas: sesi terbuka dengan outlet, kas awal, dan kas saat ini.
    expect(screen.getByRole('heading', { name: 'Status kas' })).toBeVisible()
    expect(screen.getAllByText('Outlet Kopi').length).toBeGreaterThan(0)
    expect(screen.getByText('Terbuka')).toBeVisible()
    expect(screen.getByText('Kas awal').nextElementSibling).toHaveTextContent(/Rp.?500\.000/)
    expect(screen.getByText('Kas saat ini').nextElementSibling).toHaveTextContent(/Rp.?640\.000/)

    // Stok rendah dengan badge dari ambang API.
    expect(screen.getByText('Susu UHT')).toBeVisible()
    expect(screen.getAllByText('Stok rendah').length).toBeGreaterThanOrEqual(2)

    // Transaksi terbaru sebagai tabel TanStack: kolom waktu, outlet, total, status.
    const ordersTable = screen.getByRole('table', { name: 'Transaksi terbaru' })
    expect(within(ordersTable).getAllByText('Outlet Kopi').length).toBeGreaterThan(0)
    expect(within(ordersTable).getAllByText(/Rp.?75\.000/).length).toBeGreaterThan(0)
    expect(within(ordersTable).getByText('Lunas')).toBeVisible()
    expect(within(ordersTable).getByText('Menunggu pembayaran')).toBeVisible()
    expect(within(ordersTable).getByText('Outlet Roti')).toBeVisible()

    // Primary action menuju POS.
    expect(screen.getByRole('link', { name: 'Mulai Jualan' })).toHaveAttribute('href', '/pos')

    // Navigasi bergrup: Dashboard, kategori Operasional, dan Pengaturan.
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard')
    expect(screen.getByText('Operasional')).toBeVisible()
    expect(screen.getByText('Analitik')).toBeVisible()
    expect(screen.getByText('Pengaturan')).toBeVisible()
  })

  it('menyembunyikan widget di luar permission pengguna (CASHIER)', async () => {
    mockApi({
      ...ownerMembership,
      role: 'CASHIER',
      permissions: ['orders.read', 'orders.create'],
    })

    renderDashboard()

    // Transaksi terbaru tetap tampil; widget reports/cash/inventory tidak.
    expect(await screen.findByRole('table', { name: 'Transaksi terbaru' })).toBeVisible()
    expect(screen.queryByText('Penjualan hari ini')).not.toBeInTheDocument()
    expect(screen.queryByText('Status kas')).not.toBeInTheDocument()
    expect(screen.queryByText('Stok rendah')).not.toBeInTheDocument()
    // CASHIER tetap bisa jualan.
    expect(screen.getByRole('link', { name: 'Mulai Jualan' })).toHaveAttribute('href', '/pos')
  })

  it('menampilkan empty state saat tidak ada sesi kas dan tidak ada stok rendah', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input))
      if (url.pathname.endsWith('/sanctum/csrf-cookie')) return new Response(null, { status: 204 })
      if (url.pathname.endsWith('/me')) {
        return jsonResponse({ data: { ...user, membership: ownerMembership } })
      }
      if (url.pathname.endsWith('/reports/sales')) return jsonResponse({ data: salesReport })
      if (url.pathname.endsWith('/cash-sessions')) return jsonResponse(pageResponse([]))
      if (url.pathname.endsWith('/inventory')) return jsonResponse(pageResponse([]))
      if (url.pathname.endsWith('/orders')) return jsonResponse(pageResponse([]))
      throw new Error(`Unexpected request: ${url.pathname}${url.search}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    renderDashboard()

    expect(await screen.findByText(/Belum ada sesi kas yang terbuka/)).toBeVisible()
    expect(screen.getByText(/Tidak ada item dengan stok rendah/)).toBeVisible()
    expect(screen.getByText(/Belum ada transaksi tercatat/)).toBeVisible()
  })

  it('mengalihkan pengguna tanpa membership ke /onboarding', async () => {
    mockApi(null)

    renderDashboard()

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Siapkan bisnis Anda' })).toBeVisible(),
    )
    expect(screen.queryByText('Penjualan hari ini')).not.toBeInTheDocument()
  })
})
