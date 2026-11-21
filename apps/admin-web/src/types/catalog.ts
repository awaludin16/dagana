export type Category = {
  id: number
  business_id: number
  name: string
  is_active: boolean
}

export type Product = {
  id: number
  business_id: number
  category_id: number | null
  category: Category | null
  name: string
  price: number
  is_active: boolean
  is_available: boolean
  /** Only present when the request supplies an outlet_id (D-35). */
  is_available_at_outlet?: boolean
  /** null = stok tidak dipantau/tanpa batas (D-37). Hanya ada dengan outlet_id. */
  stock_quantity?: number | null
}

export type CatalogPage<T> = {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export type CatalogListParams = {
  page?: number
  per_page?: number
  q?: string
  is_active?: boolean
  is_available?: boolean
  category_id?: number
  outlet_id?: number
}

export type CategoryInput = Pick<Category, 'name' | 'is_active'>

export type ProductInput = Pick<
  Product,
  'name' | 'price' | 'category_id' | 'is_active' | 'is_available'
>

export type ProductStockInput = {
  outlet_id: number
  quantity: number | null
  reason?: string
}
