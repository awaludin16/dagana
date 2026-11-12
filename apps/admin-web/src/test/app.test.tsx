import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SessionProvider } from '@/auth/SessionProvider'
import { routes } from '@/router'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  const queryClient = new QueryClient()

  return render(
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <RouterProvider router={router} />
      </SessionProvider>
    </QueryClientProvider>,
  )
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const ownerProfile = {
  id: 1,
  name: 'Owner Dagana',
  email: 'owner@dagana.test',
  email_verified_at: null,
  membership: {
    id: 1,
    role: 'OWNER',
    status: 'ACTIVE',
    business: { id: 1, name: 'Warung Dagana' },
    outlets: [{ id: 1, name: 'Outlet Kemang' }],
    permissions: ['orders.read', 'reports.read'],
  },
}

describe('admin web routes', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 401 })),
    )
  })

  it('requires a session to enter the workspace', async () => {
    renderAt('/dashboard')

    expect(await screen.findByRole('heading', { level: 1, name: 'Masuk ke Dagana' })).toBeVisible()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeRequired()
    expect(screen.getByLabelText('Kata sandi')).toHaveAttribute('type', 'password')
  })

  it('sends authenticated users from auth pages to the dashboard', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) =>
        String(input).endsWith('/me') ? jsonResponse({ data: ownerProfile }) : jsonResponse({}),
      ),
    )
    renderAt('/login')

    // Bukan lagi ke '/' (landing) dan bukan berhenti di form login.
    expect(await screen.findByRole('heading', { level: 1, name: 'Warung Dagana' })).toBeVisible()
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument()
  })

  it('renders the public landing page for anonymous visitors', async () => {
    renderAt('/')

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Platform operasional untuk usaha F&B Anda',
      }),
    ).toBeVisible()
    expect(screen.getByRole('main')).toBeInTheDocument()
    const startLinks = screen.getAllByRole('link', { name: 'Mulai sekarang' })
    expect(startLinks.length).toBeGreaterThan(0)
    for (const link of startLinks) {
      expect(link).toHaveAttribute('href', '/register')
    }
  })

  it('renders a not-found page for unknown routes', async () => {
    renderAt('/tidak-ada')

    expect(await screen.findByRole('heading', { name: 'Halaman tidak ditemukan' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Kembali ke beranda' })).toHaveAttribute('href', '/')
  })
})
