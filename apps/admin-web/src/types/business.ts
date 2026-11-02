export type Business = {
  id: number
  name: string
  phone: string | null
  address: string | null
  created_at?: string
  updated_at?: string
}

export type Outlet = {
  id: number
  business_id: number
  name: string
  phone: string | null
  address: string | null
  created_at?: string
  updated_at?: string
}
