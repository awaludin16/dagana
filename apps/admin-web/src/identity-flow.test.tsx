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

describe('identity and merchant onboarding', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('registers, creates the first Business and Outlet, then opens that Business context', async () => {
    let outletReads = 0
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const method = init?.method ?? 'GET'

      if (url.endsWith('/auth/register')) {
        return jsonResponse({ data: { user, token: 'test-token' } }, 201)
      }
      if (url.endsWith('/outlets')) {
        outletReads += 1
        return jsonResponse({ data: outletReads === 1 ? [] : [outlet] })
      }
      if (url.endsWith('/businesses') && method === 'POST') {
        return jsonResponse({ data: { business, outlet } }, 201)
      }
      if (url.endsWith(`/businesses/${business.id}`) && method === 'PATCH') {
        return jsonResponse({ data: { ...business, name: 'Kedai Pagi Baru' } })
      }
      if (url.endsWith(`/outlets/${outlet.id}`) && method === 'PATCH') {
        return jsonResponse({ data: { ...outlet, name: 'Outlet Utama Baru' } })
      }
      if (url.endsWith(`/businesses/${business.id}`)) {
        return jsonResponse({ data: business })
      }

      throw new Error(`Unexpected request: ${method} ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    renderAt('/register')

    fireEvent.change(screen.getByLabelText('Nama lengkap'), { target: { value: 'Ayu' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: user.email } })
    fireEvent.change(screen.getByLabelText('Kata sandi'), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText('Ulangi kata sandi'), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Buat akun' }))

    expect(await screen.findByRole('heading', { name: 'Siapkan bisnis Anda' })).toBeVisible()
    expect(localStorage.length).toBe(0)

    fireEvent.change(screen.getByLabelText('Nama Business'), {
      target: { value: business.name },
    })
    fireEvent.change(screen.getByLabelText('Nama outlet'), {
      target: { value: outlet.name },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Simpan dan lanjutkan' }))

    expect(await screen.findByRole('heading', { name: 'Business Anda' })).toBeVisible()
    expect(await screen.findByText('Kedai Pagi')).toBeVisible()
    expect(screen.getByText('Outlet Utama')).toBeVisible()
    expect(screen.queryByLabelText('Outlet')).not.toBeInTheDocument()
    expect(
      fetchMock.mock.calls.some(
        ([input, init]) =>
          String(input).endsWith('/businesses') &&
          init?.method === 'POST' &&
          new Headers(init.headers).get('Authorization') === 'Bearer test-token',
      ),
    ).toBe(true)

    fireEvent.change(screen.getAllByLabelText('Nama')[0], {
      target: { value: 'Kedai Pagi Baru' },
    })
    fireEvent.click(screen.getAllByRole('button', { name: 'Simpan perubahan' })[0])

    expect(await screen.findByRole('status')).toHaveTextContent('Perubahan berhasil disimpan.')
    expect(
      fetchMock.mock.calls.some(
        ([input, init]) =>
          String(input).endsWith(`/businesses/${business.id}`) && init?.method === 'PATCH',
      ),
    ).toBe(true)

    fireEvent.change(screen.getAllByLabelText('Nama')[1], {
      target: { value: 'Outlet Utama Baru' },
    })
    fireEvent.click(screen.getAllByRole('button', { name: 'Simpan perubahan' })[1])

    const outletSettings = screen
      .getByRole('heading', { name: 'Outlet · Outlet Utama' })
      .closest('section')
    if (!outletSettings) throw new Error('Outlet settings section was not rendered.')
    expect(await within(outletSettings).findByRole('status')).toHaveTextContent(
      'Perubahan berhasil disimpan.',
    )
    expect(
      fetchMock.mock.calls.some(
        ([input, init]) =>
          String(input).endsWith(`/outlets/${outlet.id}`) && init?.method === 'PATCH',
      ),
    ).toBe(true)
    expect(localStorage.length).toBe(0)
  })

  it('validates matching passwords before sending registration to the API', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    renderAt('/register')

    fireEvent.change(screen.getByLabelText('Nama lengkap'), { target: { value: 'Ayu' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: user.email } })
    fireEvent.change(screen.getByLabelText('Kata sandi'), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText('Ulangi kata sandi'), {
      target: { value: 'different123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Buat akun' }))

    expect(await screen.findByText('Kata sandi belum sama.')).toBeVisible()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('logs in and opens the existing Business context', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)

      if (url.endsWith('/auth/login') && init?.method === 'POST') {
        return jsonResponse({ data: { user, token: 'test-token' } })
      }
      if (url.endsWith('/outlets')) return jsonResponse({ data: [outlet] })
      if (url.endsWith(`/businesses/${business.id}`)) return jsonResponse({ data: business })

      throw new Error(`Unexpected request: ${init?.method ?? 'GET'} ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    renderAt('/login')
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: user.email } })
    fireEvent.change(screen.getByLabelText('Kata sandi'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Masuk' }))

    expect(await screen.findByRole('heading', { name: 'Business Anda' })).toBeVisible()
    expect(screen.getByText('Kedai Pagi')).toBeVisible()
    expect(localStorage.length).toBe(0)
    expect(
      fetchMock.mock.calls.some(
        ([input, init]) =>
          String(input).endsWith('/auth/login') &&
          init?.method === 'POST' &&
          JSON.parse(String(init.body)).email === user.email,
      ),
    ).toBe(true)
  })

  it('shows outlet selection only when the Business has multiple outlets', async () => {
    const secondOutlet = {
      ...outlet,
      id: 24,
      name: 'Outlet Cabang',
    }

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)

        if (url.endsWith('/auth/register')) {
          return jsonResponse({ data: { user, token: 'test-token' } }, 201)
        }
        if (url.endsWith('/outlets')) {
          return jsonResponse({ data: [outlet, secondOutlet] })
        }
        if (url.endsWith(`/businesses/${business.id}`)) {
          return jsonResponse({ data: business })
        }

        throw new Error(`Unexpected request: ${url}`)
      }),
    )

    renderAt('/register')
    fireEvent.change(screen.getByLabelText('Nama lengkap'), { target: { value: 'Ayu' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: user.email } })
    fireEvent.change(screen.getByLabelText('Kata sandi'), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText('Ulangi kata sandi'), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Buat akun' }))

    expect(await screen.findByRole('heading', { name: 'Business Anda' })).toBeVisible()
    const selector = screen.getByRole('combobox', { name: 'Outlet' })
    expect(selector).toBeVisible()
    fireEvent.change(selector, { target: { value: String(secondOutlet.id) } })
    expect(screen.getAllByLabelText('Nama')[1]).toHaveValue(secondOutlet.name)
  })

  it('loads the safe profile and logs out by revoking the active token', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)

      if (url.endsWith('/auth/register')) {
        return jsonResponse({ data: { user, token: 'test-token' } }, 201)
      }
      if (url.endsWith('/outlets')) return jsonResponse({ data: [] })
      if (url.endsWith('/me')) return jsonResponse({ data: user })
      if (url.endsWith('/auth/logout') && init?.method === 'POST') {
        return new Response(null, { status: 204 })
      }

      throw new Error(`Unexpected request: ${init?.method ?? 'GET'} ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    renderAt('/register')
    fireEvent.change(screen.getByLabelText('Nama lengkap'), { target: { value: 'Ayu' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: user.email } })
    fireEvent.change(screen.getByLabelText('Kata sandi'), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText('Ulangi kata sandi'), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Buat akun' }))

    expect(await screen.findByRole('heading', { name: 'Siapkan bisnis Anda' })).toBeVisible()
    fireEvent.click(screen.getByRole('link', { name: 'Kembali ke profil' }))

    expect(await screen.findByRole('heading', { name: 'Profil pengguna' })).toBeVisible()
    expect(screen.getAllByRole('definition')[1]).toHaveTextContent(user.email)
    expect(screen.queryByText(/password|remember_token/i)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Keluar' }))

    expect(await screen.findByRole('heading', { name: 'Masuk ke Dagana' })).toBeVisible()
    expect(
      fetchMock.mock.calls.some(
        ([input, init]) =>
          String(input).endsWith('/auth/logout') &&
          init?.method === 'POST' &&
          new Headers(init.headers).get('Authorization') === 'Bearer test-token',
      ),
    ).toBe(true)
  })

  it('shows backend validation errors on login without hiding the form', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse(
          {
            message: 'The provided credentials are incorrect.',
            errors: { email: ['The provided credentials are incorrect.'] },
          },
          422,
        ),
      ),
    )

    renderAt('/login')

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'wrong@example.com' } })
    fireEvent.change(screen.getByLabelText('Kata sandi'), { target: { value: 'wrongpass' } })
    fireEvent.click(screen.getByRole('button', { name: 'Masuk' }))

    expect(await screen.findAllByRole('alert')).toHaveLength(2)
    expect(screen.getAllByText('The provided credentials are incorrect.')).toHaveLength(2)
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('button', { name: 'Masuk' })).toBeEnabled()
  })

  it('does not display internal server details when the API fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ message: 'SQLSTATE: internal secret detail' }, 500)),
    )

    renderAt('/login')
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ayu@example.com' } })
    fireEvent.change(screen.getByLabelText('Kata sandi'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Masuk' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Layanan sedang mengalami gangguan. Silakan coba lagi.',
    )
    expect(screen.queryByText(/SQLSTATE|internal secret/i)).not.toBeInTheDocument()
  })

  it('clears the in-memory session and returns to login after an API 401', async () => {
    let protectedRequest = false
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        if (String(input).endsWith('/auth/register')) {
          return jsonResponse({ data: { user, token: 'expired-token' } }, 201)
        }
        protectedRequest = true
        return jsonResponse({ message: 'Unauthenticated.' }, 401)
      }),
    )

    renderAt('/register')

    fireEvent.change(screen.getByLabelText('Nama lengkap'), { target: { value: 'Ayu' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: user.email } })
    fireEvent.change(screen.getByLabelText('Kata sandi'), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText('Ulangi kata sandi'), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Buat akun' }))

    await waitFor(() => expect(protectedRequest).toBe(true))
    expect(await screen.findByRole('heading', { name: 'Masuk ke Dagana' })).toBeVisible()
    expect(screen.getByRole('status')).toHaveTextContent('Sesi berakhir')
  })
})
