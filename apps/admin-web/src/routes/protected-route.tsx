import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/states/ErrorState'
import { useAuth } from '@/hooks/use-auth'

export function ProtectedRoute() {
  const { isAuthenticated, isLoading, error, refetch } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">Memuat…</p>
      </div>
    )
  }

  if (error) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg items-center px-4">
        <ErrorState
          title="Sesi belum dapat dimuat"
          description={error}
          action={
            <Button onClick={() => void refetch().catch(() => undefined)}>
              Coba lagi
            </Button>
          }
        />
      </main>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
