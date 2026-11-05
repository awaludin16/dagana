import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'

import { useSession } from '@/auth/SessionContext'
import { useAccess } from '@/auth/useAccess'
import { AccessDeniedState, ErrorState, LoadingState } from '@/components/PageFeedback'

export function RequireSession() {
  const { isAuthenticated, isPending, isError, refetch } = useSession()
  const location = useLocation()

  if (isPending) return <LoadingState label="Memeriksa sesi..." />

  if (isError) {
    return (
      <ErrorState
        message="Sesi belum dapat diperiksa. Periksa koneksi lalu coba lagi."
        onRetry={refetch}
      />
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

export function RequirePermission({
  permission,
  children,
}: {
  permission: string
  children: ReactNode
}) {
  const access = useAccess()

  if (access.isPending) return <LoadingState label="Memeriksa hak akses..." />

  if (access.isError) {
    return (
      <ErrorState
        message="Hak akses belum dapat diperiksa. Periksa koneksi lalu coba lagi."
        onRetry={access.refetch}
      />
    )
  }

  if (!access.can(permission)) {
    return <AccessDeniedState message="Anda tidak memiliki izin untuk membuka halaman ini." />
  }

  return children
}

export function AnonymousOnly() {
  const { isAuthenticated, isPending } = useSession()

  if (isPending) return <LoadingState label="Memeriksa sesi..." />

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
