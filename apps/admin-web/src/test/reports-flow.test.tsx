import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SessionProvider } from '@/auth/SessionProvider'
import { routes } from '@/router'

const user = { id: 8, name: 'Ayu', email: 'ayu@example.com', email_verified_at: null }
const outletA = { id: 23, name: 'Outlet Kopi' }
const outletB = { id: 24, name: 'Outlet Roti' }
const membership = {
  id: 1,
  role: 'OWNER',
  status: 'ACTIVE',
  business: { id: 12, name: 'Kedai Pagi' },
  outlets: [outletA, outletB],
  permissions: ['reports.read'],
}

// Fixture manual: 2 transaksi 100.000 + 1 transaksi 50.000 pada 1–2 Nov,
// 3 Nov tanpa transaksi. Paid = 3 transaksi / 150.000.
const salesReport = {
  from: '2026-11-01',
  to: '2026-11-03',
  summary: { sales_total: 150000, transactions: 3 },
  days: [
    { date: '2026-11-01', sales_total: 100000, transactions: 2, average_order_value: 50000 },
    { date: '2026-11-02', sales_total: 50000, transactions: 1, average_order_value: 50000 },
    { date: '2026-11-03', sales_total: 0, transactions: 0, average_order_value: null },
  ],
}

const paymentsReport = {
  from: '2026-11-01',
  to: '2026-11-03',
  by_method: [{ method: 'cash', transactions: 3, total: 150000 }],
  by_status: [
    { status: 'PAID', transactions: 3, total: 150000 },
    { status: 'PENDING', transactions: 1, total: 50000 },
  ],
}

const operatorsRows = [
  { membership_id: 1, operator_name: 'Ayu', transactions: 3, sales_total: 150000 },
]

const cashRows = [
  {
    id: 401,
    outlet_id: outletA.id,
    operator_membership_id: 1,
    status: 'CLOSED',
    opening_cash: 500000,
    movements_by_type: [
      { type: 'CASH_SALE', amount: 150000 },
      { type: 'CASH_OUT', amount: -10000 },
    ],
    net_movement: 140000,
    expected_cash: 640000,
    actual_cash: 630000,
    variance: -10000,
    variance_note: null,
    opened_at: '2026-11-01T08:00:00+07:00',
    closed_at: '2026-11-01T21:00:00+07:00',
  },
]

const inventoryRows = [
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
    movements_count: 4,
    movements_net: -900,
  },
  {
    id: 10,
    business_id: 12,
    outlet_id: outletA.id,
    name: 'Gula Pasir',
    unit: 'g',
    low_stock_threshold: 500,
    current_stock: 9000,
    is_low_stock: false,
    is_active: true,
    movements_count: 1,
    movements_net: 1000,
  },
]

const emptySalesReport = {
  ...salesReport,
  summary: { sales_total: 0, transactions: 0 },
  days: salesReport.days.map((day) => ({
    ...day,
    sales_total: 0,
    transactions: 0,
    average_order_value: null,
  })),
}

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

function mockApi(handler: (url: URL, method: string) => Promise<Response | null>) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input))
    if (url.pathname.endsWith('/sanctum/csrf-cookie')) return new Response(null, { status: 204 })
    const response = await handler(url, init?.method ?? 'GET')
    if (response) return response
    throw new Error(`Unexpected request: ${url.pathname}${url.search}`)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function reportHandler(options: { sales?: typeof salesReport; salesStatus?: number } = {}) {
  const lastQuery: Record<string, string> = {}
  const keyFor = (pathname: string) => pathname.replace(/^.*\/reports/, '/reports')

  const handler = async (url: URL) => {
    if (url.pathname.endsWith('/me')) return jsonResponse({ data: { ...user, membership } })
    if (url.pathname.includes('/reports/')) {
      lastQuery[keyFor(url.pathname)] = url.search
      if (url.pathname.endsWith('/reports/sales')) {
        return jsonResponse({ data: options.sales ?? salesReport }, options.salesStatus ?? 200)
      }
      if (url.pathname.endsWith('/reports/payments')) return jsonResponse({ data: paymentsReport })
      if (url.pathname.endsWith('/reports/operators'))
        return jsonResponse(pageResponse(operatorsRows))
      if (url.pathname.endsWith('/reports/cash')) return jsonResponse(pageResponse(cashRows))
      if (url.pathname.endsWith('/reports/inventory'))
        return jsonResponse(pageResponse(inventoryRows))
    }
    return null
  }

  return { handler, lastQuery }
}

function renderReports() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const router = createMemoryRouter(routes, { initialEntries: ['/reports'] })

  return render(
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <RouterProvider router={router} />
      </SessionProvider>
    </QueryClientProvider>,
  )
}

async function setPeriod(from: string, to: string) {
  await screen.findByLabelText('Dari tanggal')
  fireEvent.change(screen.getByLabelText('Dari tanggal'), { target: { value: from } })
  fireEvent.change(screen.getByLabelText('Sampai tanggal'), { target: { value: to } })
}

describe('reports (Phase 7)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('menampilkan kartu ringkasan, tren harian, tabel pendukung, dan rentang tanggal aktif', async () => {
    const { handler, lastQuery } = reportHandler()
    mockApi(handler)

    renderReports()
    await setPeriod('2026-11-01', '2026-11-03')

    // Rentang tanggal aktif tampil sebagai nilai filter yang dikirim ke API.
    await waitFor(() => expect(lastQuery['/reports/sales']).toContain('from=2026-11-01'))
    expect(lastQuery['/reports/sales']).toContain('to=2026-11-03')

    // Indeks pertama = kartu ringkasan (section ringkasan dirender sebelum tabel operator).
    expect(
      screen.getAllByText('Total penjualan')[0].parentElement?.parentElement,
    ).toHaveTextContent(/Rp.?150\.000/)
    expect(
      screen.getAllByText('Jumlah transaksi')[0].parentElement?.parentElement,
    ).toHaveTextContent(/3 transaksi/)

    // Grafik tren harian dapat diakses sebagai role img dengan deskripsi.
    expect(screen.getByRole('img', { name: /Tren penjualan harian/ })).toBeVisible()

    // Operator & kas dari endpoint masing-masing.
    const operatorTable = screen.getByRole('table', { name: /per operator/ })
    expect(within(operatorTable).getByText('Ayu')).toBeVisible()
    expect(within(operatorTable).getByText(/Rp.?150\.000/)).toBeVisible()
    expect(await screen.findByText(/Session #401/)).toBeVisible()
    expect(screen.getAllByText(/-Rp.?10\.000/).length).toBeGreaterThan(0)

    // Inventory report menandai stok rendah dari ambang API.
    const inventoryTable = screen.getByRole('table', { name: /inventory/ })
    expect(within(inventoryTable).getByText('Susu UHT')).toBeVisible()
    expect(within(inventoryTable).getByText('Stok rendah')).toBeVisible()
  })

  it('memisahkan pembayaran lunas per metode dari pembayaran menunggu/gagal per status', async () => {
    const { handler } = reportHandler()
    mockApi(handler)

    renderReports()
    await setPeriod('2026-11-01', '2026-11-03')

    const methodTable = await screen.findByRole('table', {
      name: /Pembayaran per metode/,
    })
    expect(within(methodTable).getByText('Tunai')).toBeVisible()
    expect(within(methodTable).getByText(/Rp.?150\.000/)).toBeVisible()
    // PENDING tidak boleh menyatu ke tabel metode.
    expect(within(methodTable).queryByText(/Menunggu konfirmasi/)).not.toBeInTheDocument()

    const statusTable = screen.getByRole('table', { name: /Pembayaran per status/ })
    expect(within(statusTable).getByText('Terkonfirmasi')).toBeVisible()
    const pendingRow = within(statusTable).getByText('Menunggu konfirmasi').closest('tr')
    expect(pendingRow).toHaveTextContent('1')
    expect(pendingRow).toHaveTextContent(/Rp.?50\.000/)
  })

  it('menerapkan filter outlet pada semua request laporan', async () => {
    const { handler, lastQuery } = reportHandler()
    mockApi(handler)

    renderReports()
    await setPeriod('2026-11-01', '2026-11-03')

    await screen.findByText('Total penjualan')

    fireEvent.change(screen.getByLabelText('Outlet'), { target: { value: String(outletB.id) } })

    await waitFor(() => {
      for (const path of [
        '/reports/sales',
        '/reports/payments',
        '/reports/operators',
        '/reports/cash',
        '/reports/inventory',
      ]) {
        expect(lastQuery[path]).toContain(`outlet_id=${outletB.id}`)
      }
    })
  })

  it('menampilkan empty state untuk periode tanpa transaksi', async () => {
    const { handler } = reportHandler({ sales: emptySalesReport })
    mockApi(handler)

    renderReports()
    await setPeriod('2026-11-01', '2026-11-03')

    expect(await screen.findByText(/Belum ada transaksi pada periode/)).toBeVisible()
  })

  it('menampilkan error state dengan tombol coba lagi lalu pulih', async () => {
    let failing = true
    const { handler } = reportHandler()
    const wrapped = async (url: URL) => {
      if (url.pathname.endsWith('/reports/sales') && failing) {
        return jsonResponse({ message: 'Server error' }, 500)
      }
      return handler(url)
    }
    mockApi(wrapped)

    renderReports()
    await setPeriod('2026-11-01', '2026-11-03')

    expect(await screen.findByText(/Layanan sedang mengalami gangguan/)).toBeVisible()

    failing = false
    fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }))

    await waitFor(() =>
      expect(
        screen.getAllByText('Total penjualan')[0].parentElement?.parentElement,
      ).toHaveTextContent(/Rp.?150\.000/),
    )
  })
})
