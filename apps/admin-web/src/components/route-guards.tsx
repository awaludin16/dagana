import { Navigate, Outlet, useLocation } from 'react-router'

import { useSession } from '@/auth/session-context'

export function RequireSession() {
  const { token } = useSession()
  const location = useLocation()

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

export function AnonymousOnly() {
  const { token } = useSession()

  if (token) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
