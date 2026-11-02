import { createContext, useContext } from 'react'

import type { User } from '@/types'

export type SessionContextValue = {
  token: string | null
  user: User | null
  message: string | null
  startSession: (token: string, user: User) => void
  endSession: (message?: string) => void
}

export const SessionContext = createContext<SessionContextValue | null>(null)

export function useSession() {
  const context = useContext(SessionContext)

  if (!context) throw new Error('useSession harus digunakan di dalam SessionProvider.')

  return context
}
