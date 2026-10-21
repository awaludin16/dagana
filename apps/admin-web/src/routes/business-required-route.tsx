import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'

export function BusinessRequiredRoute() {
  const { memberships } = useAuth()
  const hasActiveMembership = memberships.some(
    (membership) => membership.status === 'active',
  )

  return hasActiveMembership ? <Outlet /> : <Navigate to="/onboarding" replace />
}
