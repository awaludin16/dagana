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
  email_verified_at: null,
}
const address = {
  street: 'Jl. Merdeka No. 1',
  village: 'Kelurahan Menteng',
  district: 'Kecamatan Menteng',
  regency: 'Jakarta Pusat',
  province: 'DKI JAKARTA',
  postal_code: '10310',
}
const business = { id: 12, name: 'Kedai Pagi' }
const outlet = {
  id: 23,
  business_id: business.id,
  name: 'Outlet Utama',
  phone: '081298765432',
  address,
}
const permissions = [
  'business.read',
  'business.update',
  'members.read',
  'members.invite',
  'members.update',
  'members.delete',
  'outlets.read',
  'outlets.create',
  'outlets.update',
  'outlets.delete',
]

const ownerMembership = {
  id: 1,
  user_id: user.id,
  business_id: business.id,
  role: 'OWNER' as const,
  status: 'ACTIVE' as const,
  user,
  business,
  outlets: [outlet],
  permissions,
}

const cashierMember = {
  id: 2,
  user_id: 9,
  business_id: business.id,
  role: 'CASHIER' as const,
  status: 'ACTIVE' as const,
  user: { id: 9, name: 'Budi Santoso', email: 'budi@example.com', email_verified_at: null },
  business,
  outlets: [outlet],
  permissions: ['business.read', 'outlets.read', 'orders.create', 'orders.read'],
}

const managerMembership = {
  id: 3,
  user_id: 10,
  business_id: business.id,
  role: 'MANAGER' as const,
  status: 'ACTIVE' as const,
  user: { id: 10, name: 'Citra Dewi', email: 'citra@example.com', email_verified_at: null },
  business,
  outlets: [outlet],
  permissions: ['business.read', 'members.read', 'members.update', 'outlets.read', 'orders.read'],
}

const rolesCatalog = [
  { role: 'OWNER', permissions: ['*'] },
  { role: 'MANAGER', permissions: ['members.read', 'orders.read'] },
  { role: 'CASHIER', permissions: ['orders.create', 'payments.create'] },
]

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function renderAt(path = '/members') {
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

function sessionMock(
  handler: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response | null>,
) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)

    if (url.endsWith('/sanctum/csrf-cookie')) return new Response(null, { status: 204 })

    const response = await handler(input, init)
    if (response) return response

    throw new Error(`Unexpected request: ${init?.method ?? 'GET'} ${url}`)
  })

  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('manajemen anggota tim (Phase 2)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('menampilkan daftar anggota dan ringkasan hak akses bagi Owner', async () => {
    sessionMock(async (input) => {
      const url = String(input)

      if (url.endsWith('/me')) {
        return jsonResponse({ data: { ...user, membership: ownerMembership } })
      }
      if (url.endsWith('/outlets')) return jsonResponse({ data: [outlet] })
      if (url.endsWith('/roles')) return jsonResponse({ data: rolesCatalog })
      if (url.endsWith('/members')) return jsonResponse({ data: [ownerMembership, cashierMember] })

      return null
    })

    renderAt()

    const table = await screen.findByRole('table')
    expect(within(table).getByText('Ayu')).toBeInTheDocument()
    expect(within(table).getByText('Budi Santoso')).toBeInTheDocument()
    expect(within(table).getByText('Owner')).toBeInTheDocument()
    expect(within(table).getAllByText('Aktif')).toHaveLength(2)
    expect(within(table).getByText('Outlet Utama')).toBeInTheDocument()
    expect(within(table).getByRole('button', { name: 'Hapus Budi Santoso' })).toBeInTheDocument()

    expect(screen.getByRole('heading', { name: 'Ringkasan role & hak akses' })).toBeVisible()
    expect(screen.getByText('semua izin')).toBeInTheDocument()
    expect(localStorage.length).toBe(0)
  })

  it('menyembunyikan menu anggota bila tidak memiliki permission members.read', async () => {
    const noMemberPerm = {
      ...ownerMembership,
      permissions: ['business.read', 'outlets.read', 'orders.read', 'orders.create'],
    }

    sessionMock(async (input) => {
      const url = String(input)

      if (url.endsWith('/me')) {
        return jsonResponse({ data: { ...user, membership: noMemberPerm } })
      }
      if (url.endsWith('/outlets')) return jsonResponse({ data: [outlet] })
      if (url.endsWith(`/businesses/${business.id}`)) return jsonResponse({ data: business })

      return null
    })

    renderAt('/outlets')

    expect(await screen.findByRole('heading', { name: 'Outlet' })).toBeVisible()
    expect(screen.queryByRole('link', { name: 'Anggota' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Outlet' })).toBeVisible()
  })

  it('menolak membuka route anggota tanpa permission members.read', async () => {
    const noMemberPerm = {
      ...ownerMembership,
      permissions: ['business.read', 'outlets.read', 'orders.read', 'orders.create'],
    }

    sessionMock(async (input) => {
      if (String(input).endsWith('/me')) {
        return jsonResponse({ data: { ...user, membership: noMemberPerm } })
      }

      return null
    })

    renderAt('/members')

    expect(
      await screen.findByText('Anda tidak memiliki izin untuk membuka halaman ini.'),
    ).toBeVisible()
  })

  it('menambah anggota baru melalui modal', async () => {
    let members = [ownerMembership, cashierMember]

    sessionMock(async (input, init) => {
      const url = String(input)
      const method = init?.method ?? 'GET'

      if (url.endsWith('/me')) {
        return jsonResponse({ data: { ...user, membership: ownerMembership } })
      }
      if (url.endsWith('/outlets')) return jsonResponse({ data: [outlet] })
      if (url.endsWith('/roles')) return jsonResponse({ data: rolesCatalog })
      if (url.endsWith('/members') && method === 'POST') {
        const createdMember = {
          id: 4,
          user_id: 11,
          business_id: business.id,
          role: 'CASHIER' as const,
          status: 'ACTIVE' as const,
          user: {
            id: 11,
            name: 'Budi Santoso',
            email: 'budi@example.com',
            email_verified_at: null,
          },
          business,
          outlets: [outlet],
          permissions: ['orders.create', 'orders.read'],
        }
        members = [...members, createdMember]
        return jsonResponse({ data: createdMember }, 201)
      }
      if (url.endsWith('/members')) return jsonResponse({ data: members })

      return null
    })

    renderAt()

    fireEvent.click(await screen.findByRole('button', { name: 'Tambah Anggota' }))
    expect(await screen.findByRole('heading', { name: 'Tambah anggota tim' })).toBeVisible()

    fireEvent.change(screen.getByLabelText('Nama lengkap'), {
      target: { value: 'Budi Santoso' },
    })
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'budi@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Kata sandi awal'), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByLabelText('Outlet Utama'))
    fireEvent.click(screen.getByRole('button', { name: 'Buat Anggota' }))

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Anggota baru berhasil ditambahkan.',
    )
  })

  it('mengubah role dan akses outlet anggota melalui modal', async () => {
    let updated = false

    sessionMock(async (input, init) => {
      const url = String(input)
      const method = init?.method ?? 'GET'

      if (url.endsWith('/me')) {
        return jsonResponse({ data: { ...user, membership: ownerMembership } })
      }
      if (url.endsWith('/outlets')) return jsonResponse({ data: [outlet] })
      if (url.endsWith('/roles')) return jsonResponse({ data: rolesCatalog })
      if (url.endsWith('/members/3') && method === 'PATCH') {
        updated = true
        return jsonResponse({ data: { ...managerMembership, role: 'CASHIER' } })
      }
      if (url.endsWith('/members')) {
        return jsonResponse({ data: [ownerMembership, managerMembership] })
      }

      return null
    })

    renderAt()

    fireEvent.click(await screen.findByRole('button', { name: 'Ubah' }))
    expect(await screen.findByRole('heading', { name: 'Ubah role & akses outlet' })).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: 'Simpan Perubahan' }))

    await waitFor(() => expect(updated).toBe(true))
  })

  it('menghapus anggota secara permanen setelah konfirmasi', async () => {
    let deleted = false
    let members = [ownerMembership, cashierMember]

    sessionMock(async (input, init) => {
      const url = String(input)
      const method = init?.method ?? 'GET'

      if (url.endsWith('/me')) {
        return jsonResponse({ data: { ...user, membership: ownerMembership } })
      }
      if (url.endsWith('/outlets')) return jsonResponse({ data: [outlet] })
      if (url.endsWith('/roles')) return jsonResponse({ data: rolesCatalog })
      if (url.endsWith('/members/2') && method === 'DELETE') {
        deleted = true
        members = [ownerMembership]
        return new Response(null, { status: 204 })
      }
      if (url.endsWith('/members')) return jsonResponse({ data: members })

      return null
    })

    renderAt()

    fireEvent.click(await screen.findByRole('button', { name: 'Hapus Budi Santoso' }))
    expect(await screen.findByRole('heading', { name: 'Hapus anggota permanen?' })).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Hapus permanen' }))

    await waitFor(() => expect(deleted).toBe(true))
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Anggota berhasil dihapus permanen.',
    )
  })
})
