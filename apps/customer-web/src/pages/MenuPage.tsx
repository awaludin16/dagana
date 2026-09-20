import { Link } from 'react-router-dom'

export default function MenuPage() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <span className="font-bold">Menu</span>
          <span className="text-xs text-slate-400">Demo Cafe · Bandung</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-10">
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-sm text-slate-500">
            Endpoint publik menu QR (<code className="rounded bg-slate-100 px-1">.qr/menu</code>)
            akan diimplementasikan pada Phase 4.
          </p>
          <Link to="/" className="mt-4 inline-block text-sm text-slate-900 underline">
            Kembali
          </Link>
        </div>
      </main>
    </div>
  )
}