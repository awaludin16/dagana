import { QrCode, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/ui/badge'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
        <span className="flex items-center gap-2 text-lg font-bold">
          <span className="grid size-7 place-items-center rounded-lg bg-primary text-sm text-primary-foreground">
            D
          </span>
          Dagana
        </span>
        <span className="text-xs uppercase tracking-widest text-slate-400">QR Ordering</span>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col items-center px-6 py-16 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Pesan lewat <span className="text-emerald-400">QR</span>, tanpa aplikasi tambahan.
        </h1>
        <p className="mt-4 max-w-xl text-slate-400">
          Scan kode QR di meja untuk membuka menu digital, memesan, dan membayar — terhubung
          langsung ke kasir merchant.
        </p>

        <div className="mt-10 inline-flex flex-col items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-lg">
          <div className="grid h-36 w-36 grid-cols-8 grid-rows-8 gap-1 rounded-lg bg-white p-1.5">
            {Array.from({ length: 64 }).map((_, i) => (
              <div key={i} className={i % 9 === 0 || i % 7 === 0 ? 'bg-emerald-600' : 'bg-slate-900'} />
            ))}
          </div>
          <Badge variant="success" className="gap-1.5">
            <QrCode className="size-3.5" aria-hidden />
            Contoh QR meja
          </Badge>
        </div>

        <p className="mt-10 text-xs text-slate-500">
          Phase 4 (QR Ordering) belum aktif — halaman ini placeholder dari Phase 0.
        </p>
        <Link to="/menu" className="mt-4 inline-flex items-center gap-1.5 text-sm text-emerald-400 underline underline-offset-4 hover:text-emerald-300">
          <ShoppingBag className="size-4" aria-hidden />
          Pratinjau halaman menu
        </Link>
      </main>
    </div>
  )
}