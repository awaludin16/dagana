import type { MembershipStatus, Role } from '@/types/access'
import type { Business, Outlet } from '@/types/business'

export type User = {
  id: number
  name: string
  email: string
  email_verified_at: string | null
  created_at?: string
  updated_at?: string
}

export type Me = User & {
  membership: {
    id: number
    role: Role
    status: MembershipStatus
    business: Pick<Business, 'id' | 'name'>
    outlets: Pick<Outlet, 'id' | 'name'>[]
    permissions: string[]
  } | null
}
