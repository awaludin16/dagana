// Data pengguna aktif dari /auth/me (dipakai AppShell & kontrol permission).
import { useQuery } from '@tanstack/react-query'
import { api } from './api'

export interface Me {
  user: { id: string; name: string; email: string }
  tenants: { id: string; name: string; slug: string }[]
  current_tenant: string | null
  permissions: string[]
}

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<{ data: Me }>('/auth/me').then((r) => r.data.data),
  })
}