import type { Outlet } from '@/types/auth.types'

export interface ApiCollection<T> {
  data: T[]
}

export interface ApiPaginatedCollection<T> extends ApiCollection<T> {
  links: {
    first: string | null
    last: string | null
    prev: string | null
    next: string | null
  }
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export interface RolePreset {
  value: string
  label: string
  permissions: string[]
  business_wide_outlet_access: boolean
}

export interface ManagedMembership {
  id: string | number
  business_id: string | number
  role: string
  role_label: string
  status: 'active' | 'invited' | 'disabled'
  business_wide_outlet_access: boolean
  permissions: string[]
  preset_permissions: string[]
  permission_grants: string[]
  permission_denials: string[]
  user: {
    id: string | number
    name: string
    email: string
  }
  outlets: Outlet[]
}

export interface BusinessPayload {
  name: string
  outlet?: {
    name: string
    address?: string
  }
}

export interface MemberPayload {
  email?: string
  role?: string
  outlet_ids?: number[]
  permission_grants?: string[]
  permission_denials?: string[]
}

export interface MemberInvitation {
  id: string | number
  email: string
  role: string
  role_label: string
  status: 'pending' | 'accepted' | 'canceled' | 'expired'
  delivery_status: 'pending' | 'sent' | 'failed'
  expires_at: string
  created_at: string
}
