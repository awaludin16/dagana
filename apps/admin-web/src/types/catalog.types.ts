export interface CatalogCategory {
  id: number
  business_id: number
  name: string
  status: 'active' | 'disabled'
}

export interface CatalogMenu {
  id: number
  business_id: number
  category_id: number | null
  category: Pick<CatalogCategory, 'id' | 'name'> | null
  name: string
  price: number
  status: 'active' | 'disabled'
  is_available: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}
