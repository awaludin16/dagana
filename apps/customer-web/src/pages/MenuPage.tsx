import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '../components/ui/card'

export default function MenuPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b bg-card/95 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
            <ArrowLeft className="size-4" aria-hidden />
            Menu
          </Link>
          <span className="text-xs text-muted-foreground">Demo Cafe · Bandung</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-10">
        <Card className="border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Endpoint publik menu QR (<code className="rounded bg-muted px-1 font-mono text-xs">.qr/menu</code>)
            akan diimplementasikan pada Phase 4.
          </p>
          <Link to="/" className="mt-4 inline-block text-sm font-medium text-primary underline underline-offset-4">
            Kembali
          </Link>
        </Card>
      </main>
    </div>
  )
}