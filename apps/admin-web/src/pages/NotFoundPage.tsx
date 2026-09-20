import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-muted-foreground">
      <div className="text-6xl font-bold tracking-tight text-muted">404</div>
      <p className="mt-2 text-sm">Halaman tidak ditemukan.</p>
      <Link to="/" className="mt-4 text-sm text-primary underline underline-offset-4">
        Kembali ke Dashboard
      </Link>
    </div>
  )
}