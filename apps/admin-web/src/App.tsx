import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

function App() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-screen-2xl items-center justify-center p-4">
      <section className="w-full max-w-md space-y-4 text-center">
        <h1 className="app-page-title">Dagana</h1>
        <p className="text-sm text-muted-foreground">
          Operasional F&amp;B dari pesanan pertama hingga bisnis berkembang.
        </p>
        <Button asChild>
          <Link to="/login">Masuk ke Dagana</Link>
        </Button>
      </section>
    </main>
  )
}

export default App
