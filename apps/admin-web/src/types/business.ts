export type Address = {
  street: string
  village: string
  district: string
  regency: string
  province: string
  postal_code: string
}

export const emptyAddress: Address = {
  street: '',
  village: '',
  district: '',
  regency: '',
  province: '',
  postal_code: '',
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
  phone: string
  address: Address
  created_at?: string
  updated_at?: string
}

export type OutletInput = {
  name: string
  phone: string
  address: Address
}

export type CreateBusinessInput = {
  business: { name: string }
  outlet: OutletInput
}
