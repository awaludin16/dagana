import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SessionProvider } from '@/auth/SessionProvider'
import { routes } from '@/router'

const user = {
  id: 8,
  name: 'Ayu',
  email: 'ayu@example.com',
  email_verified_at: '2026-01-01T00:00:00+00:00',
}
const business = { id: 12, name: 'Kedai Pagi' }
const outlet = {
  id: 23,
  business_id: business.id,
  name: 'Outlet Utama',
  phone: '081298765432',
  address: {
    street: 'Jl. Merdeka No. 1',
    village: 'Kelurahan Menteng',
    district: 'Kecamatan Menteng',
    regency: 'Jakarta Pusat',
    province: 'DKI JAKARTA',
    postal_code: '10310',
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
  'products.delete',
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
    expect(screen.queryByRole('option', { name: 'Semua outlet' })).not.toBeInTheDocument()

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
    expect(within(dialog).getByLabelText('Harga (Rp)')).toHaveValue('15.000')
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

  it('menyimpan stok awal saat membuat menu di satu outlet', async () => {
    const fetchMock = mockApi(async (url, init) => {
      if (url.pathname.endsWith('/me')) return jsonResponse({ data: { ...user, membership } })
      if (url.pathname.endsWith('/categories')) return jsonResponse(pageResponse([category]))
      if (url.pathname.endsWith('/products') && init?.method === 'POST') {
        return jsonResponse({ data: product }, 201)
      }
      if (url.pathname.endsWith('/products')) return jsonResponse(pageResponse([product]))
      return null
    })

    renderCatalog()
    fireEvent.click(await screen.findByRole('button', { name: 'Tambah menu' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('Nama menu'), {
      target: { value: 'Es Kopi Susu' },
    })
    fireEvent.change(within(dialog).getByLabelText('Harga (Rp)'), { target: { value: '15000' } })
    fireEvent.change(within(dialog).getByLabelText('Stok awal (opsional)'), {
      target: { value: '6' },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Simpan menu' }))

    await waitFor(() => {
      const request = fetchMock.mock.calls.find(
        ([input, init]) => String(input).endsWith('/products') && init?.method === 'POST',
      )
      expect(request).toBeDefined()
      expect(JSON.parse(String(request?.[1]?.body))).toMatchObject({
        initial_stock: 6,
        initial_stock_outlet_id: outlet.id,
      })
    })
  })

  it('menampilkan stok habis di kolom stok dan status', async () => {
    const soldOut = {
      ...product,
      is_available_at_outlet: false,
      stock_quantity: 0,
      low_stock_threshold: 10,
      low_stock: true,
    }
    mockApi(async (url) => {
      if (url.pathname.endsWith('/me')) return jsonResponse({ data: { ...user, membership } })
      if (url.pathname.endsWith('/categories')) return jsonResponse(pageResponse([category]))
      if (url.pathname.endsWith('/products')) return jsonResponse(pageResponse([soldOut]))
      return null
    })

    renderCatalog()
    expect(await screen.findByRole('columnheader', { name: 'Stok' })).toBeVisible()
    expect(screen.getAllByText('Habis').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Habis di outlet ini').length).toBeGreaterThan(0)
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
    fireEvent.pointerDown(
      screen.getAllByRole('button', { name: 'Aksi lain untuk Es Kopi Susu' })[0],
      { button: 0, ctrlKey: false },
    )
    const menu = await screen.findByRole('menu')
    expect(within(menu).getByRole('menuitem', { name: 'Hapus permanen' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Nonaktifkan' }))
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
      screen.queryByRole('button', { name: 'Aksi lain untuk Es Kopi Susu' }),
    ).not.toBeInTheDocument()
  })

  it('menampilkan status sesuai stok pada outlet terpilih', async () => {
    const branch = { ...outlet, id: 24, name: 'Outlet Cabang' }
    const multiOutletMembership = { ...membership, outlets: [outlet, branch] }
    const fetchMock = mockApi(async (url) => {
      if (url.pathname.endsWith('/me')) {
        return jsonResponse({ data: { ...user, membership: multiOutletMembership } })
      }
      if (url.pathname.endsWith('/categories')) return jsonResponse(pageResponse([category]))
      if (url.pathname.endsWith('/products')) {
        const outletId = url.searchParams.get('outlet_id')
        const soldOutAtBranch = Number(outletId) === branch.id
        return jsonResponse(
          pageResponse([
            {
              ...product,
              is_available_at_outlet: !soldOutAtBranch,
              stock_quantity: soldOutAtBranch ? 0 : 4,
            },
          ]),
        )
      }
      return null
    })

    renderCatalog()
    await screen.findAllByText('Es Kopi Susu')
    expect((await screen.findAllByText('Tersedia di outlet ini')).length).toBeGreaterThan(0)

    // Regresi: daftar mobile tidak boleh berada di dalam container `hidden md:block`.
    const mobileList = screen
      .getAllByRole('list')
      .find((node) => node.textContent?.includes('Es Kopi Susu'))
    expect(mobileList).toBeDefined()
    expect(mobileList?.closest('.hidden')).toBeNull()

    fireEvent.change(screen.getByLabelText('Outlet'), { target: { value: String(branch.id) } })
    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          ([input]) => new URL(String(input)).searchParams.get('outlet_id') === String(branch.id),
        ),
      ).toBe(true)
      expect(screen.getAllByText('Habis di outlet ini').length).toBeGreaterThan(0)
    })
  })

  it('mengubah stok menu untuk outlet terpilih', async () => {
    const stockMembership = {
      ...membership,
      permissions: [...catalogPermissions, 'products.update_stock'],
    }
    const tracked = {
      ...product,
      is_available_at_outlet: true,
      stock_quantity: 4,
      low_stock_threshold: 10,
      low_stock: true,
    }
    const fetchMock = mockApi(async (url, init) => {
      if (url.pathname.endsWith('/me')) {
        return jsonResponse({ data: { ...user, membership: stockMembership } })
      }
      if (url.pathname.endsWith('/categories')) return jsonResponse(pageResponse([category]))
      if (url.pathname.endsWith('/products/9/stock') && init?.method === 'PATCH') {
        return jsonResponse({ data: { ...tracked, stock_quantity: 7 } })
      }
      if (url.pathname.endsWith('/products')) {
        return jsonResponse(pageResponse([tracked]))
      }
      return null
    })

    renderCatalog()
    expect(await screen.findByRole('columnheader', { name: 'Stok' })).toBeVisible()
    expect(screen.getAllByText('Menipis').length).toBeGreaterThan(0)

    fireEvent.click(screen.getAllByRole('button', { name: 'Ubah stok Es Kopi Susu' })[0])
    fireEvent.change(await screen.findByLabelText('Stok tersedia'), { target: { value: '7' } })
    expect(screen.getByLabelText('Peringatan stok menipis (opsional)')).toHaveValue(10)
    fireEvent.change(screen.getByLabelText('Alasan (opsional)'), {
      target: { value: 'Stok awal' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Simpan stok' }))

    await waitFor(() => {
      const request = fetchMock.mock.calls.find(
        ([input, init]) => String(input).endsWith('/products/9/stock') && init?.method === 'PATCH',
      )
      expect(request).toBeDefined()
      expect(JSON.parse(String(request?.[1]?.body))).toEqual({
        outlet_id: outlet.id,
        quantity: 7,
        low_stock_threshold: 10,
        reason: 'Stok awal',
      })
    })
    expect(
      await screen.findByText('Stok Es Kopi Susu di Outlet Utama diperbarui menjadi 7.'),
    ).toBeDefined()
  })

  it('memberi kasier aksi ubah stok', async () => {
    const cashierMembership = {
      ...membership,
      role: 'CASHIER',
      permissions: ['outlets.read', 'products.read', 'products.update_stock'],
    }
    const tracked = {
      ...product,
      is_available_at_outlet: true,
      stock_quantity: 3,
      low_stock_threshold: 10,
      low_stock: true,
    }
    mockApi(async (url) => {
      if (url.pathname.endsWith('/me')) {
        return jsonResponse({ data: { ...user, membership: cashierMembership } })
      }
      if (url.pathname.endsWith('/categories')) return jsonResponse(pageResponse([category]))
      if (url.pathname.endsWith('/products')) return jsonResponse(pageResponse([tracked]))
      return null
    })

    renderCatalog()
    expect(await screen.findByRole('columnheader', { name: 'Stok' })).toBeVisible()
    expect(
      screen.getAllByRole('button', { name: 'Ubah stok Es Kopi Susu' }).length,
    ).toBeGreaterThan(0)
  })

  it('mengaktifkan kembali menu nonaktif dari dropdown aksi', async () => {
    const inactive = { ...product, is_active: false }
    const fetchMock = mockApi(async (url, init) => {
      if (url.pathname.endsWith('/me')) {
        return jsonResponse({ data: { ...user, membership } })
      }
      if (url.pathname.endsWith('/categories')) return jsonResponse(pageResponse([category]))
      if (url.pathname.endsWith('/products/9') && init?.method === 'PATCH') {
        return jsonResponse({ data: { ...product, is_active: true } })
      }
      if (url.pathname.endsWith('/products')) return jsonResponse(pageResponse([inactive]))
      return null
    })

    renderCatalog()
    await screen.findAllByText('Es Kopi Susu')
    fireEvent.pointerDown(
      screen.getAllByRole('button', { name: 'Aksi lain untuk Es Kopi Susu' })[0],
      { button: 0, ctrlKey: false },
    )
    const menu = await screen.findByRole('menu')
    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Aktifkan kembali' }))

    await waitFor(() => {
      const request = fetchMock.mock.calls.find(
        ([input, init]) => String(input).endsWith('/products/9') && init?.method === 'PATCH',
      )
      expect(request).toBeDefined()
      expect(JSON.parse(String(request?.[1]?.body))).toEqual({ is_active: true })
    })
    expect(await screen.findByRole('status')).toHaveTextContent('Menu berhasil diaktifkan kembali.')
  })

  it('menyimpan menu tanpa kategori pada klik simpan pertama', async () => {
    const fetchMock = mockApi(async (url, init) => {
      if (url.pathname.endsWith('/me')) {
        return jsonResponse({ data: { ...user, membership } })
      }
      if (url.pathname.endsWith('/categories')) return jsonResponse(pageResponse([category]))
      if (url.pathname.endsWith('/products') && init?.method === 'POST') {
        return jsonResponse({ data: { ...product, category_id: null, category: null } }, 201)
      }
      if (url.pathname.endsWith('/products')) return jsonResponse(pageResponse([product]))
      return null
    })

    renderCatalog()
    await screen.findAllByText('Es Kopi Susu')
    fireEvent.click(screen.getByRole('button', { name: 'Tambah menu' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('Nama menu'), {
      target: { value: 'Teh Manis' },
    })
    fireEvent.change(within(dialog).getByLabelText('Harga (Rp)'), {
      target: { value: '8000' },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Simpan menu' }))

    await waitFor(() => {
      const request = fetchMock.mock.calls.find(
        ([input, init]) => String(input).endsWith('/products') && init?.method === 'POST',
      )
      expect(request).toBeDefined()
      expect(JSON.parse(String(request?.[1]?.body))).toMatchObject({ category_id: null })
    })
    expect(screen.queryByText('Kategori tidak valid.')).not.toBeInTheDocument()
    expect(await screen.findByRole('status')).toHaveTextContent('Menu berhasil ditambahkan.')
  })

  it('mengubah ketersediaan global dari form edit', async () => {
    const unavailable = { ...product, is_available: false }
    const fetchMock = mockApi(async (url, init) => {
      if (url.pathname.endsWith('/me')) {
        return jsonResponse({ data: { ...user, membership } })
      }
      if (url.pathname.endsWith('/categories')) return jsonResponse(pageResponse([category]))
      if (url.pathname.endsWith('/products/9') && init?.method === 'PATCH') {
        return jsonResponse({ data: { ...product, is_available: true } })
      }
      if (url.pathname.endsWith('/products')) return jsonResponse(pageResponse([unavailable]))
      return null
    })

    renderCatalog()
    await screen.findAllByText('Es Kopi Susu')
    fireEvent.pointerDown(
      screen.getAllByRole('button', { name: 'Aksi lain untuk Es Kopi Susu' })[0],
      { button: 0, ctrlKey: false },
    )
    const menu = await screen.findByRole('menu')
    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Edit' }))
    const dialog = await screen.findByRole('dialog')
    const checkbox = within(dialog).getByLabelText('Tersedia untuk semua outlet')
    expect(checkbox).not.toBeChecked()

    fireEvent.click(checkbox)
    fireEvent.click(within(dialog).getByRole('button', { name: 'Simpan menu' }))

    await waitFor(() => {
      const request = fetchMock.mock.calls.find(
        ([input, init]) => String(input).endsWith('/products/9') && init?.method === 'PATCH',
      )
      expect(request).toBeDefined()
      expect(JSON.parse(String(request?.[1]?.body))).toMatchObject({ is_available: true })
    })
    expect(fetchMock.mock.calls.some(([input]) => String(input).includes('/availability'))).toBe(
      false,
    )
    expect(await screen.findByRole('status')).toHaveTextContent('Menu berhasil diperbarui.')
  })
})
