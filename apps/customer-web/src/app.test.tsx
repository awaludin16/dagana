import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'

import { routes } from '@/router'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })

  return render(<RouterProvider router={router} />)
}

describe('customer web shell', () => {
  it('renders the home page inside a main landmark', async () => {
    renderAt('/')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Dagana Customer' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Lewati ke konten utama' })).toHaveAttribute(
      'href',
      '#main',
    )
    expect(screen.getByRole('link', { name: 'Dagana Customer' })).toHaveAttribute('href', '/')
  })

  it('renders a not-found page for unknown routes', async () => {
    renderAt('/tidak-ada')

    expect(await screen.findByRole('heading', { name: 'Halaman tidak ditemukan' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Kembali ke beranda' })).toHaveAttribute('href', '/')
  })
})
