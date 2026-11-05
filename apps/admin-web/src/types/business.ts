export type Address = {
  street: string | null
  village: string | null
  district: string | null
  regency: string | null
  province: string | null
  postal_code: string | null
}

export const emptyAddress: Address = {
  street: null,
  village: null,
  district: null,
  regency: null,
  province: null,
  postal_code: null,
}

export type Business = {
  id: number
  name: string
  created_at?: string
  updated_at?: string
}

export type Outlet = {
  id: number
  business_id: number
  name: string
  phone: string | null
  address: Address
  created_at?: string
  updated_at?: string
}

export type OutletInput = {
  name: string
  phone: string | null
  address: Address
}

export type CreateBusinessInput = {
  business: { name: string }
  outlet: OutletInput
}
