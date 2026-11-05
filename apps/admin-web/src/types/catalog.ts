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
}

export type CategoryInput = Pick<Category, 'name' | 'is_active'>

export type ProductInput = Pick<
  Product,
  'name' | 'price' | 'category_id' | 'is_active' | 'is_available'
>
