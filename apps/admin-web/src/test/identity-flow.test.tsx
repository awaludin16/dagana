import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
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
    'orders.create',
    'orders.read',
    'payments.create',
  ],
}
const profile = { ...user, membership: ownerMembership }
const emptyProfile = { ...user, membership: null }
const provinces = [{ id: '31', name: 'DKI JAKARTA' }]

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function renderAt(path: string) {
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

function installFetch(
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

describe('identity and merchant onboarding', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('registers, creates the first business and outlet, then manages them', async () => {
    let created = false
    let currentBusiness = business
    let currentOutlets = [outlet]

    const fetchMock = installFetch(async (input, init) => {
      const url = String(input)
      const method = init?.method ?? 'GET'

      if (url.endsWith('/auth/web/register') && method === 'POST') {
        return jsonResponse({ data: emptyProfile }, 201)
      }
      if (url.endsWith('/me')) {
        if (!created) return jsonResponse({ message: 'Unauthenticated.' }, 401)

        return jsonResponse({
          data: {
            ...profile,
            membership: {
              ...ownerMembership,
              business: currentBusiness,
              outlets: currentOutlets.map(({ id, name }) => ({ id, name })),
            },
          },
        })
      }
      if (url.endsWith('/regions/provinces')) return jsonResponse({ data: provinces })
      if (url.endsWith('/outlets') && method === 'GET') {
        return jsonResponse({ data: currentOutlets })
      }
      if (url.endsWith('/businesses') && method === 'POST') {
        created = true
        return jsonResponse({ data: { business: currentBusiness, outlet } }, 201)
      }
      if (url.endsWith(`/businesses/${business.id}`) && method === 'PATCH') {
        const body = JSON.parse(String(init?.body)) as { name: string }
        currentBusiness = { ...currentBusiness, name: body.name }
        return jsonResponse({ data: currentBusiness })
      }
      if (url.endsWith(`/outlets/${outlet.id}`) && method === 'PATCH') {
        const body = JSON.parse(String(init?.body)) as { name: string }
        currentOutlets = [{ ...currentOutlets[0], name: body.name }]
        return jsonResponse({ data: currentOutlets[0] })
      }
      if (url.endsWith(`/businesses/${business.id}`)) {
        return jsonResponse({ data: currentBusiness })
      }

      return null
    })

    renderAt('/register')
    expect(await screen.findByRole('heading', { name: 'Buat akun Dagana' })).toBeVisible()

    fireEvent.change(screen.getByLabelText('Nama lengkap'), { target: { value: 'Ayu' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: user.email } })
    fireEvent.change(screen.getByLabelText('Kata sandi'), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText('Ulangi kata sandi'), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Buat akun' }))

    expect(await screen.findByRole('heading', { name: 'Siapkan bisnis Anda' })).toBeVisible()

    fireEvent.change(screen.getByLabelText('Nama Business'), {
      target: { value: business.name },
    })
    fireEvent.change(screen.getByLabelText('Nama outlet'), {
      target: { value: outlet.name },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Simpan dan lanjutkan' }))

    expect(await screen.findByRole('heading', { name: 'Outlet' })).toBeVisible()
    expect(screen.getByLabelText('Nama business')).toHaveValue('Kedai Pagi')
    expect(screen.getByText('Outlet Utama')).toBeVisible()

    const registerCall = fetchMock.mock.calls.find(
      ([input, init]) => String(input).endsWith('/auth/web/register') && init?.method === 'POST',
    )
    expect(registerCall).toBeTruthy()
    const registerInit = registerCall?.[1] as RequestInit
    expect(new Headers(registerInit.headers).get('Authorization')).toBeNull()
    expect(registerInit.credentials).toBe('include')
    expect(localStorage.length).toBe(0)

    fireEvent.change(screen.getByLabelText('Nama business'), {
      target: { value: 'Kedai Pagi Baru' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Simpan nama' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Nama business tersimpan.')

    fireEvent.click(screen.getByRole('button', { name: 'Ubah Outlet Utama' }))
    expect(await screen.findByRole('heading', { name: 'Ubah outlet' })).toBeVisible()
    fireEvent.change(screen.getByLabelText('Nama outlet'), {
      target: { value: 'Outlet Utama Baru' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Simpan perubahan' }))

    expect(await screen.findByText('Outlet Utama Baru')).toBeVisible()
    expect(
      fetchMock.mock.calls.some(
        ([input, init]) =>
          String(input).endsWith(`/outlets/${outlet.id}`) && init?.method === 'PATCH',
      ),
    ).toBe(true)
    expect(localStorage.length).toBe(0)
  })

  it('validates matching passwords before sending registration to the API', async () => {
    const fetchMock = installFetch(async (input) => {
      if (String(input).endsWith('/me')) return jsonResponse({ message: 'Unauthenticated.' }, 401)
      return null
    })

    renderAt('/register')
    expect(await screen.findByRole('heading', { name: 'Buat akun Dagana' })).toBeVisible()

    fireEvent.change(screen.getByLabelText('Nama lengkap'), { target: { value: 'Ayu' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: user.email } })
    fireEvent.change(screen.getByLabelText('Kata sandi'), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText('Ulangi kata sandi'), {
      target: { value: 'different123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Buat akun' }))

    expect(await screen.findByText('Kata sandi belum sama.')).toBeVisible()
    expect(
      fetchMock.mock.calls.some(([input]) => String(input).endsWith('/auth/web/register')),
    ).toBe(false)
  })

  it('logs in with the HttpOnly session and opens the existing business context', async () => {
    const fetchMock = installFetch(async (input, init) => {
      const url = String(input)

      if (url.endsWith('/me')) return jsonResponse({ message: 'Unauthenticated.' }, 401)
      if (url.endsWith('/auth/web/login') && init?.method === 'POST') {
        return jsonResponse({ data: profile })
      }
      if (url.endsWith('/outlets')) return jsonResponse({ data: [outlet] })
      if (url.endsWith(`/businesses/${business.id}`)) return jsonResponse({ data: business })

      return null
    })

    renderAt('/login')
    expect(await screen.findByRole('heading', { name: 'Masuk ke Dagana' })).toBeVisible()
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: user.email } })
    fireEvent.change(screen.getByLabelText('Kata sandi'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Masuk' }))

    expect(await screen.findByRole('heading', { name: 'Kedai Pagi' })).toBeVisible()
    expect(localStorage.length).toBe(0)

    const loginCall = fetchMock.mock.calls.find(
      ([input, init]) => String(input).endsWith('/auth/web/login') && init?.method === 'POST',
    )
    const loginInit = loginCall?.[1] as RequestInit
    expect(JSON.parse(String(loginInit.body)).email).toBe(user.email)
  })

  it('restores the session from the HttpOnly cookie after a refresh', async () => {
    installFetch(async (input) => {
      const url = String(input)

      if (url.endsWith('/me')) return jsonResponse({ data: profile })
      if (url.endsWith('/outlets')) return jsonResponse({ data: [outlet] })
      if (url.endsWith(`/businesses/${business.id}`)) return jsonResponse({ data: business })

      return null
    })

    renderAt('/outlets')

    expect(await screen.findByRole('heading', { name: 'Outlet' })).toBeVisible()
    expect(screen.getByLabelText('Nama business')).toHaveValue('Kedai Pagi')
    expect(screen.getByText('Outlet Utama')).toBeVisible()
    expect(localStorage.length).toBe(0)
  })

  it('logs out through the session endpoint without a bearer token', async () => {
    const fetchMock = installFetch(async (input, init) => {
      const url = String(input)

      if (url.endsWith('/me')) return jsonResponse({ data: profile })
      if (url.endsWith('/outlets')) return jsonResponse({ data: [outlet] })
      if (url.endsWith(`/businesses/${business.id}`)) return jsonResponse({ data: business })
      if (url.endsWith('/auth/web/logout') && init?.method === 'POST') {
        return new Response(null, { status: 204 })
      }

      return null
    })

    renderAt('/outlets')
    fireEvent.click(await screen.findByRole('button', { name: 'Keluar' }))

    expect(await screen.findByRole('heading', { name: 'Masuk ke Dagana' })).toBeVisible()
    expect(localStorage.length).toBe(0)

    const logoutCall = fetchMock.mock.calls.find(
      ([input, init]) => String(input).endsWith('/auth/web/logout') && init?.method === 'POST',
    )
    const logoutInit = logoutCall?.[1] as RequestInit
    expect(logoutCall).toBeTruthy()
    expect(new Headers(logoutInit.headers).get('Authorization')).toBeNull()
  })

  it('shows backend validation errors on login without hiding the form', async () => {
    installFetch(async (input, init) => {
      const url = String(input)

      if (url.endsWith('/me')) return jsonResponse({ message: 'Unauthenticated.' }, 401)
      if (url.endsWith('/auth/web/login') && init?.method === 'POST') {
        return jsonResponse(
          {
            message: 'The provided credentials are incorrect.',
            errors: { email: ['The provided credentials are incorrect.'] },
          },
          422,
        )
      }

      return null
    })

    renderAt('/login')
    expect(await screen.findByRole('heading', { name: 'Masuk ke Dagana' })).toBeVisible()

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'wrong@example.com' } })
    fireEvent.change(screen.getByLabelText('Kata sandi'), { target: { value: 'wrongpass' } })
    fireEvent.click(screen.getByRole('button', { name: 'Masuk' }))

    expect(await screen.findAllByRole('alert')).toHaveLength(1)
    expect(screen.getByText('The provided credentials are incorrect.')).toBeVisible()
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('button', { name: 'Masuk' })).toBeEnabled()
  })

  it('does not display internal server details when the API fails', async () => {
    installFetch(async (input, init) => {
      const url = String(input)

      if (url.endsWith('/me')) return jsonResponse({ message: 'Unauthenticated.' }, 401)
      if (url.endsWith('/auth/web/login') && init?.method === 'POST') {
        return jsonResponse({ message: 'SQLSTATE: internal secret detail' }, 500)
      }

      return null
    })

    renderAt('/login')
    expect(await screen.findByRole('heading', { name: 'Masuk ke Dagana' })).toBeVisible()
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ayu@example.com' } })
    fireEvent.change(screen.getByLabelText('Kata sandi'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Masuk' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Layanan sedang mengalami gangguan. Silakan coba lagi.',
    )
    expect(screen.queryByText(/SQLSTATE|internal secret/i)).not.toBeInTheDocument()
  })

  it('clears the session and returns to login after a protected request returns 401', async () => {
    installFetch(async (input) => {
      const url = String(input)

      if (url.endsWith('/me')) return jsonResponse({ data: profile })
      if (url.endsWith('/outlets') || url.endsWith(`/businesses/${business.id}`)) {
        return jsonResponse({ message: 'Unauthenticated.' }, 401)
      }

      return null
    })

    renderAt('/outlets')

    expect(await screen.findByRole('heading', { name: 'Masuk ke Dagana' })).toBeVisible()
    expect(screen.getByRole('status')).toHaveTextContent('Sesi berakhir')
    expect(localStorage.length).toBe(0)
  })
})
