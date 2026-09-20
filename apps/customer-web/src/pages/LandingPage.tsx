import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
        <span className="text-lg font-bold">Dagana</span>
        <span className="text-xs uppercase tracking-widest text-slate-400">QR Ordering</span>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col items-center px-6 py-16 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">
          Pesan lewat QR, tanpa aplikasi tambahan.
        </h1>
        <p className="mt-4 max-w-xl text-slate-400">
          Scan kode QR di meja untuk membuka menu digital, memesan, dan membayar — terhubung
          langsung ke kasir merchant.
        </p>

        <div className="mt-10 inline-flex flex-col items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900 p-8">
          <div className="grid h-36 w-36 grid-cols-8 grid-rows-8 gap-1">
            {Array.from({ length: 64 }).map((_, i) => (
              <div key={i} className={i % 9 === 0 || i % 7 === 0 ? 'bg-white' : 'bg-slate-900'} />
            ))}
          </div>
          <span className="text-xs text-slate-400">Contoh QR meja</span>
        </div>

        <p className="mt-10 text-xs text-slate-500">
          Phase 4 (QR Ordering) belum aktif — halaman ini placeholder dari Phase 0.
        </p>
        <Link to="/menu" className="mt-4 text-sm text-slate-300 underline">
          Pratinjau halaman menu
        </Link>
      </main>
    </div>
  )
}