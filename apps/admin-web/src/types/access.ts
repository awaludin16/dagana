export type Role = 'OWNER' | 'MANAGER' | 'CASHIER'

export type MembershipStatus = 'ACTIVE' | 'INACTIVE'

export type Member = {
  id: number
  user_id: number
  business_id: number
  role: Role
  status: MembershipStatus
  user: { id: number; name: string; email: string }
  business: { id: number; name: string }
  outlets: { id: number; name: string }[]
  permissions: string[]
}

export type RoleCatalog = {
  role: Role
  permissions: string[]
}

export type CreateMemberInput = {
  name: string
  email: string
  password: string
  role: Exclude<Role, 'OWNER'>
  outlet_ids: number[]
}

export type UpdateMemberInput = {
  role?: Exclude<Role, 'OWNER'>
  status?: MembershipStatus
  outlet_ids?: number[]
}
