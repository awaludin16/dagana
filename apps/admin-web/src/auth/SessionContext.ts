import { createContext, useContext } from 'react'

import type { Me } from '@/types'

export type SessionContextValue = {
  user: Me | null
  isAuthenticated: boolean
  isPending: boolean
  isError: boolean
  refetch: () => void
  message: string | null
  startSession: (user: Me) => void
  endSession: (message?: string) => void
}

export const SessionContext = createContext<SessionContextValue | null>(null)

export function useSession() {
  const context = useContext(SessionContext)

  if (!context) throw new Error('useSession harus digunakan di dalam SessionProvider.')

  return context
}
