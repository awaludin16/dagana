import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SessionProvider } from '@/auth/SessionProvider'
import { routes } from '@/router'

const user = { id: 8, name: 'Ayu', email: 'ayu@example.com', email_verified_at: null }
const outlet = { id: 23, name: 'Outlet Utama' }
const secondOutlet = { id: 24, name: 'Outlet Cabang' }

function membershipWith(permissions: string[]) {
  return {
    id: 1,
    role: 'OWNER',
    status: 'ACTIVE',
    business: { id: 12, name: 'Kedai Pagi' },
    outlets: [outlet, secondOutlet],
    permissions,
  }
}

const allPermissions = [
  'inventory.read',
  'inventory.create',
  'inventory.update',
  'inventory.adjust',
]

const item = {
  id: 51,
  business_id: 12,
  outlet_id: outlet.id,
  name: 'Beras',
  unit: 'g',
  low_stock_threshold: 1000,
  current_stock: 400,
  is_low_stock: true,
  is_active: true,
  created_at: '2026-11-11T08:00:00+07:00',
  updated_at: '2026-11-11T08:00:00+07:00',
}

const movement = {
  id: 701,
  business_id: 12,
  outlet_id: outlet.id,
  inventory_item_id: item.id,
  membership_id: 1,
  type: 'ADJUSTMENT',
  quantity_change: 400,
  reason: 'Stok awal',
  created_at: '2026-11-11T08:00:00+07:00',
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

function renderInventory() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const router = createMemoryRouter(routes, { initialEntries: ['/inventory'] })

  return render(
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <RouterProvider router={router} />
      </SessionProvider>
    </QueryClientProvider>,
  )
}

describe('inventory (Phase 6)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('menampilkan saldo dan low-stock dari server serta filter outlet', async () => {
    const fetchMock = mockApi(async (url) => {
      if (url.pathname.endsWith('/me')) {
        return jsonResponse({ data: { ...user, membership: membershipWith(allPermissions) } })
      }
      if (url.pathname.endsWith('/inventory')) return jsonResponse(pageResponse([item]))
      return null
    })

    renderInventory()

    expect(await screen.findAllByText('Beras')).not.toHaveLength(0)
    expect(screen.getAllByText('400 g')).not.toHaveLength(0)
    expect(screen.getAllByText('Stok rendah')).not.toHaveLength(0)
    expect(screen.getAllByText('1.000 g')).not.toHaveLength(0)

    fireEvent.change(screen.getByLabelText('Filter outlet'), { target: { value: '24' } })

    await waitFor(() => {
      const filtered = fetchMock.mock.calls.some(([input]) => {
        const url = new URL(String(input))
        return url.pathname.endsWith('/inventory') && url.searchParams.get('outlet_id') === '24'
      })
      expect(filtered).toBe(true)
    })
  })

  it('membuat item dengan outlet, satuan, dan ambang low stock', async () => {
    const fetchMock = mockApi(async (url, method) => {
      if (url.pathname.endsWith('/me')) {
        return jsonResponse({ data: { ...user, membership: membershipWith(allPermissions) } })
      }
      if (url.pathname.endsWith('/inventory') && method === 'GET') {
        return jsonResponse(pageResponse([item]))
      }
      if (url.pathname.endsWith('/inventory') && method === 'POST') {
        return jsonResponse(
          { data: { ...item, id: 52, name: 'Gula', low_stock_threshold: 500 } },
          201,
        )
      }
      return null
    })

    renderInventory()
    await screen.findAllByText('Beras')

    fireEvent.click(screen.getByRole('button', { name: 'Tambah item' }))
    fireEvent.input(screen.getByLabelText('Nama item'), { target: { value: 'Gula' } })
    fireEvent.input(screen.getByLabelText('Satuan dasar'), { target: { value: 'g' } })
    fireEvent.input(screen.getByLabelText('Ambang low stock'), { target: { value: '500' } })
    fireEvent.click(screen.getByRole('button', { name: 'Simpan item' }))

    expect(await screen.findByText('Item inventory berhasil dibuat.')).toBeVisible()

    const post = fetchMock.mock.calls.find(
      ([input, init]) =>
        new URL(String(input)).pathname.endsWith('/inventory') && init?.method === 'POST',
    )
    expect(JSON.parse(String(post?.[1]?.body))).toEqual({
      name: 'Gula',
      unit: 'g',
      low_stock_threshold: 500,
      is_active: true,
      outlet_id: outlet.id,
    })
  })

  it('mencatat adjustment lewat API movement dan menampilkan saldo terbaru server', async () => {
    let adjusted = false
    const fetchMock = mockApi(async (url, method) => {
      if (url.pathname.endsWith('/me')) {
        return jsonResponse({ data: { ...user, membership: membershipWith(allPermissions) } })
      }
      if (url.pathname.endsWith(`/inventory/${item.id}`) && method === 'GET') {
        return jsonResponse({
          data: adjusted ? { ...item, current_stock: 900, is_low_stock: true } : item,
        })
      }
      if (url.pathname.endsWith(`/inventory/${item.id}/movements`)) {
        return jsonResponse(pageResponse([movement]))
      }
      if (url.pathname.endsWith(`/inventory/${item.id}/adjustments`) && method === 'POST') {
        adjusted = true
        return jsonResponse({ data: { ...movement, id: 702, quantity_change: 500 } }, 201)
      }
      if (url.pathname.endsWith('/inventory')) {
        return jsonResponse(pageResponse([adjusted ? { ...item, current_stock: 900 } : item]))
      }
      return null
    })

    renderInventory()
    await screen.findAllByText('Beras')

    fireEvent.click(screen.getAllByRole('button', { name: 'Kelola stok Beras' })[0])
    expect(await screen.findByText('Stok Beras')).toBeVisible()

    fireEvent.input(screen.getByLabelText('Jumlah perubahan'), { target: { value: '500' } })
    fireEvent.input(screen.getByLabelText('Alasan'), { target: { value: 'Pembelian bahan' } })
    fireEvent.click(screen.getByRole('button', { name: 'Catat adjustment' }))

    expect(await screen.findAllByText('900 g')).not.toHaveLength(0)
    expect(screen.getByText('Adjustment tersimpan. Saldo diperbarui dari server.')).toBeVisible()

    const post = fetchMock.mock.calls.find(
      ([input, init]) =>
        new URL(String(input)).pathname.endsWith(`/inventory/${item.id}/adjustments`) &&
        init?.method === 'POST',
    )
    const body = JSON.parse(String(post?.[1]?.body))
    expect(body).toMatchObject({ quantity_change: 500, reason: 'Pembelian bahan' })
    expect(body.idempotency_key).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    )
  })

  it('menampilkan konflik 422 tanpa mengubah saldo yang ditampilkan', async () => {
    mockApi(async (url, method) => {
      if (url.pathname.endsWith('/me')) {
        return jsonResponse({ data: { ...user, membership: membershipWith(allPermissions) } })
      }
      if (url.pathname.endsWith(`/inventory/${item.id}`) && method === 'GET') {
        return jsonResponse({ data: item })
      }
      if (url.pathname.endsWith(`/inventory/${item.id}/movements`)) {
        return jsonResponse(pageResponse([movement]))
      }
      if (url.pathname.endsWith(`/inventory/${item.id}/adjustments`) && method === 'POST') {
        return jsonResponse(
          {
            message: 'Stok tidak mencukupi untuk adjustment ini.',
            errors: { quantity_change: ['Stok tidak mencukupi untuk adjustment ini.'] },
          },
          422,
        )
      }
      if (url.pathname.endsWith('/inventory')) return jsonResponse(pageResponse([item]))
      return null
    })

    renderInventory()
    await screen.findAllByText('Beras')

    fireEvent.click(screen.getAllByRole('button', { name: 'Kelola stok Beras' })[0])
    await screen.findByText('Stok Beras')

    fireEvent.input(screen.getByLabelText('Jumlah perubahan'), { target: { value: '-500' } })
    fireEvent.input(screen.getByLabelText('Alasan'), { target: { value: 'Koreksi' } })
    fireEvent.click(screen.getByRole('button', { name: 'Catat adjustment' }))

    expect(
      await screen.findAllByText('Stok tidak mencukupi untuk adjustment ini.'),
    ).not.toHaveLength(0)
    expect(screen.getAllByText('400 g')).not.toHaveLength(0)
  })

  it('menonaktifkan form adjustment untuk item nonaktif', async () => {
    mockApi(async (url, method) => {
      if (url.pathname.endsWith('/me')) {
        return jsonResponse({ data: { ...user, membership: membershipWith(allPermissions) } })
      }
      if (url.pathname.endsWith(`/inventory/${item.id}`) && method === 'GET') {
        return jsonResponse({ data: { ...item, is_active: false, current_stock: 0 } })
      }
      if (url.pathname.endsWith(`/inventory/${item.id}/movements`)) {
        return jsonResponse(pageResponse([]))
      }
      if (url.pathname.endsWith('/inventory')) {
        return jsonResponse(pageResponse([{ ...item, is_active: false, current_stock: 0 }]))
      }
      return null
    })

    renderInventory()
    await screen.findAllByText('Beras')

    fireEvent.click(screen.getAllByRole('button', { name: 'Kelola stok Beras' })[0])

    expect(await screen.findByText(/Item nonaktif\. Aktifkan item melalui Ubah item/)).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Catat adjustment' })).not.toBeInTheDocument()
    expect(screen.getAllByText('Stok habis')).not.toHaveLength(0)
  })

  it('menonaktifkan item lewat update tanpa menghapus histori', async () => {
    const fetchMock = mockApi(async (url, method) => {
      if (url.pathname.endsWith('/me')) {
        return jsonResponse({ data: { ...user, membership: membershipWith(allPermissions) } })
      }
      if (url.pathname.endsWith(`/inventory/${item.id}`) && method === 'PATCH') {
        return jsonResponse({ data: { ...item, is_active: false } })
      }
      if (url.pathname.endsWith('/inventory')) return jsonResponse(pageResponse([item]))
      return null
    })

    renderInventory()
    await screen.findAllByText('Beras')

    fireEvent.click(screen.getAllByRole('button', { name: 'Nonaktifkan Beras' })[0])
    fireEvent.click(await screen.findByRole('button', { name: 'Nonaktifkan' }))

    expect(await screen.findByText(/Item Beras dinonaktifkan/)).toBeVisible()

    const patch = fetchMock.mock.calls.find(
      ([input, init]) =>
        new URL(String(input)).pathname.endsWith(`/inventory/${item.id}`) &&
        init?.method === 'PATCH',
    )
    expect(JSON.parse(String(patch?.[1]?.body))).toEqual({ is_active: false })
  })

  it('menolak akses tanpa permission inventory.read', async () => {
    mockApi(async (url) => {
      if (url.pathname.endsWith('/me')) {
        return jsonResponse({ data: { ...user, membership: membershipWith([]) } })
      }
      return null
    })

    renderInventory()

    expect(
      await screen.findByText('Anda tidak memiliki izin untuk membuka halaman ini.'),
    ).toBeVisible()
  })
})
