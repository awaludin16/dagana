import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SessionProvider } from '@/auth/SessionProvider'
import { routes } from '@/router'

const user = { id: 8, name: 'Ayu', email: 'ayu@example.com', email_verified_at: null }
const business = { id: 12, name: 'Kedai Pagi' }
const outlet = {
  id: 23,
  business_id: business.id,
  name: 'Outlet Utama',
  phone: null,
  address: {
    street: null,
    village: null,
    district: null,
    regency: null,
    province: null,
    postal_code: null,
  },
}
const catalogPermissions = [
  'outlets.read',
  'categories.read',
  'categories.create',
  'categories.update',
  'products.read',
  'products.create',
  'products.update',
]
const membership = {
  id: 1,
  user_id: user.id,
  business_id: business.id,
  role: 'OWNER',
  status: 'ACTIVE',
  user,
  business,
  outlets: [outlet],
  permissions: catalogPermissions,
}
const category = {
  id: 4,
  business_id: business.id,
  name: 'Minuman',
  is_active: true,
}
const product = {
  id: 9,
  business_id: business.id,
  category_id: category.id,
  category,
  name: 'Es Kopi Susu',
  price: 15000,
  is_active: true,
  is_available: true,
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function renderCatalog() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const router = createMemoryRouter(routes, { initialEntries: ['/catalog'] })
  return render(
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <RouterProvider router={router} />
      </SessionProvider>
    </QueryClientProvider>,
  )
}

function mockApi(handler: (url: URL, init?: RequestInit) => Promise<Response | null>) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input))
    if (url.pathname.endsWith('/sanctum/csrf-cookie')) return new Response(null, { status: 204 })
    const response = await handler(url, init)
    if (response) return response
    throw new Error(`Unexpected request: ${init?.method ?? 'GET'} ${url}`)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
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

describe('katalog (Phase 3)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('membuat menu dari API dengan validasi harga dan feedback', async () => {
    const fetchMock = mockApi(async (url, init) => {
      if (url.pathname.endsWith('/me')) {
        return jsonResponse({ data: { ...user, membership } })
      }
      if (url.pathname.endsWith('/categories')) return jsonResponse(pageResponse([category]))
      if (url.pathname.endsWith('/products') && init?.method === 'POST') {
        return jsonResponse({ data: product }, 201)
      }
      if (url.pathname.endsWith('/products')) return jsonResponse(pageResponse([product]))
      return null
    })

    renderCatalog()
    expect(await screen.findAllByText('Es Kopi Susu')).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: 'Tambah menu' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('Nama menu'), {
      target: { value: 'Es Kopi Susu' },
    })
    fireEvent.change(within(dialog).getByLabelText('Harga (Rp)'), {
      target: { value: '' },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Simpan menu' }))
    expect(await within(dialog).findByText('Harga wajib diisi.')).toBeVisible()

    fireEvent.change(within(dialog).getByLabelText('Harga (Rp)'), {
      target: { value: '15000' },
    })
    fireEvent.change(within(dialog).getByLabelText('Kategori'), {
      target: { value: String(category.id) },
    })
    expect(within(dialog).getByLabelText('Harga (Rp)')).toHaveValue(15000)
    fireEvent.click(within(dialog).getByRole('button', { name: 'Simpan menu' }))
    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          ([input, init]) => String(input).endsWith('/products') && init?.method === 'POST',
        ),
      ).toBe(true)
    })
    expect(await screen.findByRole('status')).toHaveTextContent('Menu berhasil ditambahkan.')

    await waitFor(() => {
      const request = fetchMock.mock.calls.find(
        ([input, init]) => String(input).endsWith('/products') && init?.method === 'POST',
      )
      expect(request).toBeDefined()
      expect(JSON.parse(String(request?.[1]?.body))).toEqual({
        name: 'Es Kopi Susu',
        price: 15000,
        category_id: category.id,
        is_active: true,
        is_available: true,
      })
    })
    expect(screen.getByRole('button', { name: 'Cari' })).toBeVisible()
  })

  it('mencari dan memaginasi kategori memakai filter API', async () => {
    const fetchMock = mockApi(async (url) => {
      if (url.pathname.endsWith('/me')) {
        return jsonResponse({ data: { ...user, membership } })
      }
      if (url.pathname.endsWith('/categories')) {
        if (url.searchParams.get('page') === '2') {
          return jsonResponse(
            pageResponse([{ ...category, id: 5, name: 'Minuman Hangat' }], 2, 2, 2),
          )
        }
        if (url.searchParams.get('q') === 'minuman') {
          return jsonResponse(pageResponse([category], 1, 2, 2))
        }
        return jsonResponse(pageResponse([category]))
      }
      if (url.pathname.endsWith('/products')) return jsonResponse(pageResponse([]))
      return null
    })

    renderCatalog()
    await screen.findByRole('button', { name: 'Tambah menu' })
    fireEvent.click(screen.getByRole('button', { name: 'Kategori' }))
    expect(await screen.findAllByText('Minuman')).toHaveLength(2)
    fireEvent.change(screen.getByLabelText('Cari kategori'), {
      target: { value: 'minuman' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Cari' }))
    await screen.findByText(/Halaman 1 dari 2/)
    fireEvent.click(screen.getByRole('button', { name: 'Berikutnya' }))
    expect(await screen.findAllByText('Minuman Hangat')).toHaveLength(2)

    expect(
      fetchMock.mock.calls.some(
        ([input]) => new URL(String(input)).searchParams.get('q') === 'minuman',
      ),
    ).toBe(true)
    expect(
      fetchMock.mock.calls.some(
        ([input]) => new URL(String(input)).searchParams.get('page') === '2',
      ),
    ).toBe(true)
  })

  it('menonaktifkan menu melalui konfirmasi tanpa menghapus histori', async () => {
    const fetchMock = mockApi(async (url, init) => {
      if (url.pathname.endsWith('/me')) {
        return jsonResponse({ data: { ...user, membership } })
      }
      if (url.pathname.endsWith('/categories')) return jsonResponse(pageResponse([category]))
      if (url.pathname.endsWith('/products/9') && init?.method === 'PATCH') {
        return jsonResponse({ data: { ...product, is_active: false } })
      }
      if (url.pathname.endsWith('/products')) return jsonResponse(pageResponse([product]))
      return null
    })

    renderCatalog()
    await screen.findAllByText('Es Kopi Susu')
    fireEvent.click(screen.getAllByRole('button', { name: 'Nonaktifkan Es Kopi Susu' })[0])
    const dialog = await screen.findByRole('alertdialog')
    expect(within(dialog).getByText(/bukan menghapus histori transaksi/)).toBeVisible()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Nonaktifkan' }))
    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          ([input, init]) => String(input).endsWith('/products/9') && init?.method === 'PATCH',
        ),
      ).toBe(true)
    })
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Menu berhasil dinonaktifkan. Histori transaksi tidak dihapus.',
    )
    expect(
      fetchMock.mock.calls.some(
        ([input, init]) => String(input).endsWith('/products/9') && init?.method === 'PATCH',
      ),
    ).toBe(true)
  })

  it('menangani permission baca tanpa menampilkan aksi tulis', async () => {
    const readOnlyMembership = {
      ...membership,
      permissions: ['products.read'],
    }
    mockApi(async (url) => {
      if (url.pathname.endsWith('/me')) {
        return jsonResponse({ data: { ...user, membership: readOnlyMembership } })
      }
      if (url.pathname.endsWith('/products')) return jsonResponse(pageResponse([product]))
      return null
    })

    renderCatalog()
    expect(await screen.findAllByText('Es Kopi Susu')).toHaveLength(2)
    expect(screen.queryByRole('button', { name: 'Tambah menu' })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Nonaktifkan Es Kopi Susu' }),
    ).not.toBeInTheDocument()
  })
})
