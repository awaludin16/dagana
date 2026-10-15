import { useState } from 'react'
import { Button } from '@/components/ui/button'

function App() {
  const [count, setCount] = useState(0)

  return (
    <main className="min-h-dvh flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4 text-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Dagana Admin</h1>
          <p className="text-sm text-muted-foreground">
            Mobile-first foundation — Posisi: portrait/landscape ready. 
            CTA emas hanya untuk aksi tertinggi, tidak jadi primary generik.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button variant="default" onClick={() => setCount((c) => c + 1)}>
            Primary Navy (klik: {count})
          </Button>
          <Button variant="accent" onClick={() => setCount(0)}>
            CTA Emas (reset)
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Desain dimulai dari 375px (mobile-first). Token mengikuti MASTER.md & project overrides.
        </p>
      </div>
    </main>
  )
}

export default App
