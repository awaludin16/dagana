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
  permissions: [
    'cash.read',
    'cash.open',
    'cash.cash_in',
    'cash.cash_out',
    'cash.close',
    'cash.reconcile',
  ],
}

const openSession = {
  id: 301,
  business_id: 12,
  outlet_id: outlet.id,
  operator_membership_id: 1,
  status: 'OPEN',
  opening_cash: 500000,
  expected_cash: 2550000,
  actual_cash: null,
  variance: null,
  variance_note: null,
  opened_at: '2026-11-10T08:00:00+07:00',
  closed_at: null,
  closed_by_membership_id: null,
  created_at: '2026-11-10T08:00:00+07:00',
}

const closedSession = {
  ...openSession,
  id: 302,
  status: 'CLOSED',
  expected_cash: 2550000,
  actual_cash: 2500000,
  variance: -50000,
  variance_note: 'Uang dipakai membeli gas.',
  opened_at: '2026-11-09T08:00:00+07:00',
  closed_at: '2026-11-09T21:00:00+07:00',
  closed_by_membership_id: 1,
}

const movement = {
  id: 9001,
  cash_session_id: 301,
  business_id: 12,
  outlet_id: outlet.id,
  membership_id: 1,
  type: 'CASH_SALE',
  amount: 2000000,
  reason: null,
  created_at: '2026-11-10T09:00:00+07:00',
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
    meta: { current_page: currentPage, last_page: lastPage, per_page: 20, total },
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

function renderCash() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const router = createMemoryRouter(routes, { initialEntries: ['/cash'] })

  return render(
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <RouterProvider router={router} />
      </SessionProvider>
    </QueryClientProvider>,
  )
}

describe('cash session (Phase 5)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('menampilkan state kosong lalu membuka session dengan kas awal', async () => {
    let opened = false
    const fetchMock = mockApi(async (url, method) => {
      if (url.pathname.endsWith('/me')) return jsonResponse({ data: { ...user, membership } })
      if (url.pathname.endsWith('/cash-sessions') && method === 'GET') {
        return jsonResponse(
          pageResponse(opened && url.searchParams.get('status') === 'OPEN' ? [openSession] : []),
        )
      }
      if (url.pathname.endsWith('/cash-sessions') && method === 'POST') {
        opened = true
        return jsonResponse({ data: openSession }, 201)
      }
      if (url.pathname.includes('/movements')) return jsonResponse(pageResponse([movement]))
      return null
    })

    renderCash()

    expect(await screen.findByText(/Belum ada Cash Session aktif/)).toBeVisible()

    fireEvent.input(screen.getByLabelText('Kas awal (Rp)'), { target: { value: '500000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Buka session' }))

    await screen.findByText('Session #301')

    const post = fetchMock.mock.calls.find(
      ([input, init]) => String(input).endsWith('/cash-sessions') && init?.method === 'POST',
    )
    expect(JSON.parse(String(post?.[1]?.body))).toEqual({
      outlet_id: outlet.id,
      opening_cash: 500000,
    })
  })

  it('menampilkan ringkasan session aktif, ledger, dan variance hasil server', async () => {
    mockApi(async (url, method) => {
      if (url.pathname.endsWith('/me')) return jsonResponse({ data: { ...user, membership } })
      if (url.pathname.endsWith('/cash-sessions') && method === 'GET') {
        return url.searchParams.get('status') === 'OPEN'
          ? jsonResponse(pageResponse([openSession]))
          : jsonResponse(pageResponse([closedSession]))
      }
      if (url.pathname.includes('/movements')) return jsonResponse(pageResponse([movement]))
      return null
    })

    renderCash()

    expect(await screen.findByText('Session #301')).toBeVisible()
    // Expected cash berasal dari server, bukan dihitung ulang di klien.
    expect(screen.getAllByText(/2\.550\.000/).length).toBeGreaterThan(0)
    // Ledger arus kas dimuat per session.
    expect(await screen.findByText('Penjualan tunai')).toBeVisible()

    // Riwayat rekonsiliasi menampilkan expected/actual/variance bertanda dari server.
    expect(await screen.findByText(/Kekurangan/)).toBeVisible()
    expect(screen.getAllByText(/-Rp.?50\.000/).length).toBeGreaterThan(0)
    expect(screen.getByText(/Uang dipakai membeli gas\./)).toBeVisible()
  })

  it('membatasi jenis movement sesuai permission dan mencegah double submit', async () => {
    let resolveMovement: ((response: Response) => void) | undefined
    let movementPosts = 0
    const cashierPermissions = ['cash.read', 'cash.cash_in', 'cash.cash_out', 'cash.close']

    mockApi(async (url, method) => {
      if (url.pathname.endsWith('/me')) {
        return jsonResponse({
          data: { ...user, membership: { ...membership, permissions: cashierPermissions } },
        })
      }
      if (url.pathname.endsWith('/cash-sessions') && method === 'GET') {
        return url.searchParams.get('status') === 'OPEN'
          ? jsonResponse(pageResponse([openSession]))
          : jsonResponse(pageResponse([]))
      }
      if (url.pathname.endsWith('/cash-sessions/301/movements') && method === 'POST') {
        movementPosts += 1
        return new Promise((resolve) => {
          resolveMovement = resolve
        })
      }
      if (url.pathname.includes('/movements')) return jsonResponse(pageResponse([movement]))
      return null
    })

    renderCash()

    await screen.findByText('Session #301')

    // CASHIER tanpa cash.reconcile tidak melihat REFUND/ADJUSTMENT (D-31).
    const jenis = screen.getByLabelText('Jenis')
    expect(within(jenis).getByRole('option', { name: 'Kas masuk' })).toBeVisible()
    expect(within(jenis).queryByRole('option', { name: 'Refund' })).not.toBeInTheDocument()

    fireEvent.input(screen.getByLabelText('Nominal (Rp)'), { target: { value: '100000' } })
    const submit = screen.getByRole('button', { name: 'Catat aktivitas' })
    fireEvent.click(submit)

    await waitFor(() => expect(submit).toBeDisabled())
    fireEvent.click(submit)

    resolveMovement?.(jsonResponse({ data: { ...movement, type: 'CASH_IN' } }, 201))

    await waitFor(() => expect(screen.getByLabelText('Nominal (Rp)')).toHaveValue(''))
    expect(movementPosts).toBe(1)
  })

  it('menutup session dengan actual cash dan catatan selisih', async () => {
    let closed = false
    const fetchMock = mockApi(async (url, method) => {
      if (url.pathname.endsWith('/me')) return jsonResponse({ data: { ...user, membership } })
      if (url.pathname.endsWith('/cash-sessions') && method === 'GET') {
        const isOpen = url.searchParams.get('status') === 'OPEN'
        if (isOpen) return jsonResponse(pageResponse(closed ? [] : [openSession]))
        return jsonResponse(pageResponse(closed ? [closedSession] : []))
      }
      if (url.pathname.endsWith('/cash-sessions/301/close') && method === 'POST') {
        closed = true
        return jsonResponse({ data: closedSession })
      }
      if (url.pathname.includes('/movements')) return jsonResponse(pageResponse([movement]))
      return null
    })

    renderCash()

    await screen.findByText('Session #301')

    fireEvent.input(screen.getByLabelText('Uang fisik di laci (Rp)'), {
      target: { value: '2500000' },
    })
    fireEvent.input(screen.getByLabelText('Catatan selisih (opsional)'), {
      target: { value: 'Uang dipakai membeli gas.' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Tutup session' }))

    // Setelah close, daftar aktif kosong dan riwayat menampilkan variance hasil server.
    expect(await screen.findByText('Session #302')).toBeVisible()
    expect(screen.getAllByText(/-Rp.?50\.000/).length).toBeGreaterThan(0)
    expect(
      fetchMock.mock.calls.some(
        ([input, init]) =>
          String(input).endsWith('/cash-sessions/301/close') && init?.method === 'POST',
      ),
    ).toBe(true)
  })

  it('menampilkan pesan kesalahan saat close gagal dan menjaga form tetap terisi', async () => {
    mockApi(async (url, method) => {
      if (url.pathname.endsWith('/me')) return jsonResponse({ data: { ...user, membership } })
      if (url.pathname.endsWith('/cash-sessions') && method === 'GET') {
        return url.searchParams.get('status') === 'OPEN'
          ? jsonResponse(pageResponse([openSession]))
          : jsonResponse(pageResponse([]))
      }
      if (url.pathname.endsWith('/cash-sessions/301/close') && method === 'POST') {
        return jsonResponse({ message: 'Session sudah ditutup.' }, 422)
      }
      if (url.pathname.includes('/movements')) return jsonResponse(pageResponse([movement]))
      return null
    })

    renderCash()

    await screen.findByText('Session #301')

    fireEvent.input(screen.getByLabelText('Uang fisik di laci (Rp)'), {
      target: { value: '2500000' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Tutup session' }))

    const alert = await screen.findByRole('alert')
    expect(within(alert).getByText(/Session gagal ditutup/)).toBeVisible()
    // Nilai input tetap ada agar pengguna tidak kehilangan isian.
    expect(screen.getByLabelText('Uang fisik di laci (Rp)')).toHaveValue('2.500.000')
  })

  it('menolak halaman kas tanpa permission cash.read', async () => {
    mockApi(async (url) => {
      if (url.pathname.endsWith('/me')) {
        return jsonResponse({
          data: { ...user, membership: { ...membership, permissions: [] } },
        })
      }
      return null
    })

    renderCash()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Anda tidak memiliki izin untuk membuka halaman ini.',
    )
  })
})
