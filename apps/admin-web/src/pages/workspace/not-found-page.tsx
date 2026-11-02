import { Link } from 'react-router'

import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-page-title tracking-tight">Halaman tidak ditemukan</h1>
      <p className="text-sm text-muted-foreground">
        Alamat yang Anda buka tidak tersedia di aplikasi admin.
      </p>
      <Button asChild variant="outline">
        <Link to="/">Kembali ke beranda</Link>
      </Button>
    </section>
  )
}
