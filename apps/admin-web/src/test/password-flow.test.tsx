import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SessionProvider } from '@/auth/SessionProvider'
import { routes } from '@/router'

const unverifiedProfile = {
  id: 8,
  name: 'Ayu',
  email: 'ayu@example.com',
  email_verified_at: null,
  membership: null,
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

describe('password reset and email verification flows', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('sends a reset link from the forgot password page', async () => {
    const fetchMock = installFetch(async (input, init) => {
      const url = String(input)

      if (url.endsWith('/auth/forgot-password') && init?.method === 'POST') {
        return jsonResponse({ message: 'Jika email Anda terdaftar, tautan atur ulang password telah dikirim.' })
      }

      return null
    })

    renderAt('/forgot-password')

    fireEvent.change(await screen.findByLabelText(/email/i), {
      target: { value: 'ayu@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /kirim tautan/i }))

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/tautan atur ulang/i)
    })

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/auth/forgot-password'),
      expect.objectContaining({ method: 'POST' }),
    )
    const init = fetchMock.mock.calls.find(([url]) => String(url).includes('/auth/forgot-password'))?.[1]
    expect(JSON.parse(String(init?.body))).toEqual({ email: 'ayu@example.com' })
  })

  it('resets the password from the emailed link and returns to login', async () => {
    const fetchMock = installFetch(async (input, init) => {
      const url = String(input)

      if (url.endsWith('/auth/reset-password') && init?.method === 'POST') {
        return jsonResponse({ message: 'Password berhasil diperbarui.' })
      }
      if (url.endsWith('/me')) return jsonResponse({ message: 'Unauthenticated.' }, 401)

      return null
    })

    renderAt('/reset-password?token=reset-token&email=ayu%40example.com')

    fireEvent.change(await screen.findByLabelText('Kata sandi baru'), {
      target: { value: 'katasandibaru' },
    })
    fireEvent.change(screen.getByLabelText('Ulangi kata sandi baru'), {
      target: { value: 'katasandibaru' },
    })
    fireEvent.click(screen.getByRole('button', { name: /simpan kata sandi baru/i }))

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/kata sandi berhasil diperbarui/i)
    })

    const init = fetchMock.mock.calls.find(([url]) => String(url).includes('/auth/reset-password'))?.[1]
    expect(JSON.parse(String(init?.body))).toEqual({
      email: 'ayu@example.com',
      token: 'reset-token',
      password: 'katasandibaru',
      password_confirmation: 'katasandibaru',
    })
  })

  it('redirects to the forgot password page when the reset link is incomplete', async () => {
    installFetch(async () => null)

    renderAt('/reset-password')

    await waitFor(() => {
      expect(screen.getByText(/masukkan email akun anda/i)).toBeInTheDocument()
    })
  })

  it('verifies the email via the signed link forwarded to the API', async () => {
    const fetchMock = installFetch(async (input) => {
      const url = String(input)

      if (url.includes('/auth/email/verify/8/')) {
        return jsonResponse({ message: 'Email berhasil diverifikasi. Silakan login untuk melanjutkan.' })
      }

      return null
    })

    renderAt('/verify-email?id=8&hash=abc&expires=9999999999&signature=sig')

    await waitFor(() => {
      expect(screen.getByText(/email terverifikasi/i)).toBeInTheDocument()
    })

    const verifyCall = fetchMock.mock.calls.find(([url]) => String(url).includes('/auth/email/verify/'))
    expect(String(verifyCall?.[0])).toContain('/auth/email/verify/8/abc?expires=9999999999&signature=sig')
  })

  it('shows a failure state for an invalid verification link', async () => {
    installFetch(async (input) => {
      const url = String(input)

      if (url.includes('/auth/email/verify/')) return jsonResponse({ message: 'Tautan tidak valid.' }, 403)

      return null
    })

    renderAt('/verify-email?id=8&hash=abc&expires=1&signature=bad')

    await waitFor(() => {
      expect(screen.getByText(/verifikasi belum berhasil/i)).toBeInTheDocument()
    })
  })

  it('requires email verification before showing the workspace', async () => {
    installFetch(async (input, init) => {
      const url = String(input)

      if (url.endsWith('/me')) return jsonResponse({ data: unverifiedProfile })
      if (url.endsWith('/auth/email/verification-notification') && init?.method === 'POST') {
        return jsonResponse({ message: 'Tautan verifikasi baru telah dikirim ke email Anda.' })
      }

      return null
    })

    renderAt('/dashboard')

    const heading = await screen.findByRole('heading', { name: /verifikasi email anda/i })
    expect(heading).toBeInTheDocument()
    expect(screen.queryByText(/dashboard/i)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /kirim ulang/i }))

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/tautan verifikasi baru/i)
    })
  })

  it('links to the forgot password page from login', async () => {
    installFetch(async (input) => {
      if (String(input).endsWith('/me')) return jsonResponse({ message: 'Unauthenticated.' }, 401)

      return null
    })

    renderAt('/login')

    const link = await screen.findByRole('link', { name: /lupa kata sandi/i })
    expect(link.getAttribute('href')).toBe('/forgot-password')
  })
})
