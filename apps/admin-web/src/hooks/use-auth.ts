import { useContext } from 'react'
import { AuthContext } from '@/providers/auth-provider'
import type { AuthState } from '@/providers/auth-provider'

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
