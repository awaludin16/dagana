import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 text-slate-600">
      <div className="text-6xl font-bold text-slate-300">404</div>
      <p className="mt-2 text-sm">Halaman tidak ditemukan.</p>
      <Link to="/" className="mt-4 text-sm text-slate-900 underline">
        Kembali ke Dashboard
      </Link>
    </div>
  )
}