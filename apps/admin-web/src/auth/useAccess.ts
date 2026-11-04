import { useCallback, useMemo } from 'react'

import { useSession } from '@/auth/SessionContext'

export function useAccess() {
  const session = useSession()
  const membership = session.user?.membership ?? null
  const permissions = useMemo(() => membership?.permissions ?? [], [membership])
  const can = useCallback((permission: string) => permissions.includes(permission), [permissions])

  return { ...session, data: session.user, membership, permissions, can }
}
