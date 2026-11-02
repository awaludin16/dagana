import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SessionProvider } from '@/auth/session-provider'
import { routes } from '@/router'

const user = {
  id: 8,
  name: 'Ayu',
  email: 'ayu@example.com',
  email_verified_at: null,
}
const business = { id: 12, name: 'Kedai Pagi', phone: null, address: null }
const outlet = {
  id: 23,
  business_id: business.id,
  name: 'Outlet Utama',
  phone: null,
  address: null,
}

const ownerMembership = {
  id: 1,
  user_id: user.id,
  business_id: business.id,
  role: 'OWNER' as const,
  status: 'ACTIVE' as const,
  user,
  business,
  outlets: [outlet],
  permissions: [
    'members.read',
    'members.invite',
    'members.update',
    'members.remove',
    'outlets.read',
    'outlets.update',
    'orders.create',
    'orders.read',
    'payments.create',
  ],
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
  permissions: ['orders.create', 'orders.read', 'payments.create'],
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
  permissions: ['members.read', 'members.update', 'orders.read'],
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

function renderWithFetch() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const router = createMemoryRouter(routes, { initialEntries: ['/login'] })

  return render(
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <RouterProvider router={router} />
      </SessionProvider>
    </QueryClientProvider>,
  )
}

async function loginAsOwner() {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: user.email } })
  fireEvent.change(screen.getByLabelText('Kata sandi'), {
    target: { value: 'password123' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Masuk' }))

  await waitFor(() => expect(screen.getByText('Kedai Pagi')).toBeVisible())
  fireEvent.click(screen.getByRole('link', { name: 'Anggota' }))
}

describe('manajemen anggota tim (Phase 2)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('menampilkan daftar anggota dan ringkasan hak akses bagi Owner', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)

      if (url.endsWith('/auth/login')) {
        return jsonResponse({ data: { user, token: 'test-token' } })
      }
      if (url.endsWith('/me')) {
        return jsonResponse({ data: { ...user, membership: ownerMembership } })
      }
      if (url.endsWith('/outlets')) return jsonResponse({ data: [outlet] })
      if (url.endsWith('/roles')) return jsonResponse({ data: rolesCatalog })
      if (url.endsWith('/members')) return jsonResponse({ data: [ownerMembership, cashierMember] })
      if (url.endsWith(`/businesses/${business.id}`)) return jsonResponse({ data: business })

      throw new Error(`Unexpected request: ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    renderWithFetch()

    await loginAsOwner()

    const table = await screen.findByRole('table')
    expect(within(table).getByText('Ayu')).toBeInTheDocument()
    expect(within(table).getByText('Budi Santoso')).toBeInTheDocument()
    expect(within(table).getByText('Owner')).toBeInTheDocument()
    expect(within(table).getAllByText('Aktif')).toHaveLength(2)
    expect(within(table).getByText('Outlet Utama')).toBeInTheDocument()

    expect(screen.getByRole('heading', { name: 'Ringkasan role & hak akses' })).toBeVisible()
    expect(screen.getByText('semua izin')).toBeInTheDocument()

    expect(localStorage.length).toBe(0)
  })

  it('menolak akses anggota bila tidak memiliki permission members.read', async () => {
    const noMemberPerm = {
      ...ownerMembership,
      permissions: ['orders.read', 'orders.create'],
    }
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)

      if (url.endsWith('/auth/login')) {
        return jsonResponse({ data: { user, token: 'test-token' } })
      }
      if (url.endsWith('/me')) {
        return jsonResponse({ data: { ...user, membership: noMemberPerm } })
      }
      if (url.endsWith('/outlets')) return jsonResponse({ data: [outlet] })
      if (url.endsWith(`/businesses/${business.id}`)) return jsonResponse({ data: business })

      throw new Error(`Unexpected request: ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    renderWithFetch()

    await loginAsOwner()

    await waitFor(() =>
      expect(
        screen.getByText('Anda tidak memiliki izin untuk mengelola anggota tim.'),
      ).toBeVisible(),
    )
  })

  it('menambah anggota baru melalui modal', async () => {
    let created = false
    let members = [ownerMembership, cashierMember]
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const method = init?.method ?? 'GET'

      if (url.endsWith('/auth/login')) {
        return jsonResponse({ data: { user, token: 'test-token' } })
      }
      if (url.endsWith('/me')) {
        return jsonResponse({ data: { ...user, membership: ownerMembership } })
      }
      if (url.endsWith('/outlets')) return jsonResponse({ data: [outlet] })
      if (url.endsWith('/roles')) return jsonResponse({ data: rolesCatalog })
      if (url.endsWith('/members') && method === 'POST') {
        created = true
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
      if (url.endsWith(`/businesses/${business.id}`)) return jsonResponse({ data: business })

      throw new Error(`Unexpected request: ${method} ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    renderWithFetch()

    await loginAsOwner()

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

    await waitFor(() => expect(created).toBe(true))
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Anggota baru berhasil ditambahkan.',
    )
  })

  it('mengubah role dan akses outlet anggota melalui modal', async () => {
    let updated = false
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const method = init?.method ?? 'GET'

      if (url.endsWith('/auth/login')) {
        return jsonResponse({ data: { user, token: 'test-token' } })
      }
      if (url.endsWith('/me')) {
        return jsonResponse({ data: { ...user, membership: ownerMembership } })
      }
      if (url.endsWith('/outlets')) return jsonResponse({ data: [outlet] })
      if (url.endsWith('/roles')) return jsonResponse({ data: rolesCatalog })
      if (url.endsWith('/members/3') && method === 'PATCH') {
        updated = true
        return jsonResponse({ data: { ...managerMembership, role: 'CASHIER' } })
      }
      if (url.endsWith('/members'))
        return jsonResponse({ data: [ownerMembership, managerMembership] })
      if (url.endsWith(`/businesses/${business.id}`)) return jsonResponse({ data: business })

      throw new Error(`Unexpected request: ${method} ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    renderWithFetch()

    await loginAsOwner()

    fireEvent.click(await screen.findByRole('button', { name: 'Ubah' }))

    expect(await screen.findByRole('heading', { name: 'Ubah role & akses outlet' })).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: 'Simpan Perubahan' }))

    await waitFor(() => expect(updated).toBe(true))
  })

  it('menonaktifkan akses anggota setelah konfirmasi', async () => {
    let removed = false
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const method = init?.method ?? 'GET'

      if (url.endsWith('/auth/login')) {
        return jsonResponse({ data: { user, token: 'test-token' } })
      }
      if (url.endsWith('/me')) {
        return jsonResponse({ data: { ...user, membership: ownerMembership } })
      }
      if (url.endsWith('/outlets')) return jsonResponse({ data: [outlet] })
      if (url.endsWith('/roles')) return jsonResponse({ data: rolesCatalog })
      if (url.endsWith('/members/2') && method === 'DELETE') {
        removed = true
        return new Response(null, { status: 204 })
      }
      if (url.endsWith('/members')) return jsonResponse({ data: [ownerMembership, cashierMember] })
      if (url.endsWith(`/businesses/${business.id}`)) return jsonResponse({ data: business })

      throw new Error(`Unexpected request: ${method} ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    renderWithFetch()

    await loginAsOwner()

    fireEvent.click(await screen.findByRole('button', { name: 'Nonaktifkan' }))

    expect(await screen.findByRole('heading', { name: 'Nonaktifkan akses anggota?' })).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Ya, nonaktifkan' }))

    await waitFor(() => expect(removed).toBe(true))
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Akses anggota berhasil dinonaktifkan.',
    )
  })
})
