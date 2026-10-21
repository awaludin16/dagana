export interface Outlet {
  id: string | number
  name: string
  address?: string | null
  timezone?: string
  status?: 'active' | 'disabled'
  code?: string | null
}

export interface Business {
  id: string | number
  name: string
}

export interface Membership {
  id: string | number
  business_id: string | number
  business?: Business
  outlet_ids?: Array<string | number>
  outlets?: Outlet[]
  outlet_access?: Array<Outlet>
  role?: string | null
  role_label?: string | null
  permissions?: string[]
  permission_grants?: string[]
  permission_denials?: string[]
  preset_permissions?: string[]
  business_wide_outlet_access?: boolean
  status: 'active' | 'invited' | 'disabled'
}

export interface AuthUser {
  id: string | number
  name: string
  email: string
}

export interface MeResponse {
  data: AuthUser & {
    memberships: Membership[]
  }
}
