import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { SessionContext } from '@/auth/SessionContext'
import { api } from '@/lib/api'
import type { Me } from '@/types'

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const me = useQuery({
    queryKey: ['me'],
    queryFn: api.profile,
    retry: false,
    staleTime: 30_000,
  })
  const [message, setMessage] = useState<string | null>(null)

  const endSession = useCallback(
    (notice?: string) => {
      queryClient.setQueryData(['me'], null)
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'me' })
      setMessage(notice ?? null)
    },
    [queryClient],
  )

  const startSession = useCallback(
    (profile: Me) => {
      queryClient.setQueryData(['me'], profile)
      setMessage(null)
    },
    [queryClient],
  )

  useEffect(() => {
    const handleExpiredSession = () => {
      endSession('Sesi berakhir. Silakan masuk kembali.')
    }

    window.addEventListener('dagana:session-expired', handleExpiredSession)
    return () => window.removeEventListener('dagana:session-expired', handleExpiredSession)
  }, [endSession])

  const value = useMemo(
    () => ({
      user: me.data ?? null,
      isAuthenticated: Boolean(me.data),
      isPending: me.isPending,
      isError: me.isError,
      refetch: () => void me.refetch(),
      message,
      startSession,
      endSession,
    }),
    [me, message, startSession, endSession],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
