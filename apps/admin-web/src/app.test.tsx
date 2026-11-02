import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'

import { SessionProvider } from '@/auth/session-provider'
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

describe('admin web routes', () => {
  it('requires a session to enter the workspace', async () => {
    renderAt('/')

    expect(await screen.findByRole('heading', { level: 1, name: 'Masuk ke Dagana' })).toBeVisible()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeRequired()
    expect(screen.getByLabelText('Kata sandi')).toHaveAttribute('type', 'password')
  })

  it('renders a not-found page for unknown routes', async () => {
    renderAt('/tidak-ada')

    expect(await screen.findByRole('heading', { name: 'Halaman tidak ditemukan' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Kembali ke beranda' })).toHaveAttribute('href', '/')
  })
})
