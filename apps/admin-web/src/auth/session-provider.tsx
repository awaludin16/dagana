import { useCallback, useEffect, useMemo, useState } from 'react'

import { SessionContext } from '@/auth/session-context'
import { queryClient } from '@/lib/query-client'
import type { User } from '@/lib/api'

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const endSession = useCallback((notice?: string) => {
    setToken(null)
    setUser(null)
    setMessage(notice ?? null)
    queryClient.clear()
  }, [])

  const startSession = useCallback((sessionToken: string, sessionUser: User) => {
    setToken(sessionToken)
    setUser(sessionUser)
    setMessage(null)
  }, [])

  useEffect(() => {
    const handleExpiredSession = () => {
      endSession('Sesi berakhir. Silakan masuk kembali.')
    }

    window.addEventListener('dagana:session-expired', handleExpiredSession)
    return () => window.removeEventListener('dagana:session-expired', handleExpiredSession)
  }, [endSession])

  const value = useMemo(
    () => ({ token, user, message, startSession, endSession }),
    [token, user, message, startSession, endSession],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
