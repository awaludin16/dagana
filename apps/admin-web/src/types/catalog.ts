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
  /** Hanya ada dengan outlet_id; dihitung dari is_available global dan stok outlet (D-39). */
  is_available_at_outlet?: boolean
  /** null = stok tidak dipantau/tanpa batas (D-37). Hanya ada dengan outlet_id. */
  stock_quantity?: number | null
  /** Batas stok menipis; 0 = tanpa peringatan (D-38). Hanya ada dengan outlet_id. */
  low_stock_threshold?: number | null
  /** true bila stok <= batas. Hanya ada dengan outlet_id. */
  low_stock?: boolean
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
> & {
  /** Dipakai hanya saat create dengan satu outlet (D-38). */
  initial_stock?: number | null
  initial_stock_outlet_id?: number
}

export type ProductStockInput = {
  outlet_id: number
  quantity: number | null
  low_stock_threshold?: number | null
  reason?: string
}
