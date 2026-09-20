// Jenis & operasi API modul Catalog (Phase 1). Kontrak: docs/API-Specification.md.
import { api } from './api'

export type ProductStatus = 'ACTIVE' | 'INACTIVE'

export interface Category {
  id: string
  parent_id: string | null
  name: string
  sort_order: number
  products_count?: number
}

export interface ProductVariant {
  id: string
  sku: string
  barcode: string | null
  unit: string
  price: string
  cost_price: string
  status: ProductStatus
}

export interface Product {
  id: string
  category_id: string | null
  name: string
  description: string | null
  image_url: string | null
  status: ProductStatus
  created_at: string
  updated_at: string
  category: Category | null
  variants: ProductVariant[]
}

export interface VariantInput {
  sku: string
  barcode?: string
  unit?: string
  price: number
  cost_price?: number
}

export interface ProductInput {
  name: string
  category_id?: string
  description?: string
  image_url?: string
  status?: ProductStatus
  variants: VariantInput[]
}

export interface CategoryInput {
  name: string
  parent_id?: string
  sort_order?: number
}

export interface Paginated<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface ProductFilters {
  search?: string
  category?: string
  status?: ProductStatus
  page?: number
}

export function listProducts(filters: ProductFilters = {}): Promise<Paginated<Product>> {
  return api.get<Paginated<Product>>('/catalog/products', { params: filters }).then((r) => r.data)
}

export function getProduct(id: string): Promise<Product> {
  return api.get<{ data: Product }>(`/catalog/products/${id}`).then((r) => r.data.data)
}

export function createProduct(payload: ProductInput): Promise<Product> {
  return api.post<{ data: Product }>('/catalog/products', payload).then((r) => r.data.data)
}

export function updateProduct(id: string, payload: ProductInput): Promise<Product> {
  return api.put<{ data: Product }>(`/catalog/products/${id}`, payload).then((r) => r.data.data)
}

export function deleteProduct(id: string): Promise<void> {
  return api.delete(`/catalog/products/${id}`).then(() => undefined)
}

export function listCategories(): Promise<Category[]> {
  return api.get<{ data: Category[] }>('/catalog/categories').then((r) => r.data.data)
}

export function createCategory(payload: CategoryInput): Promise<Category> {
  return api.post<{ data: Category }>('/catalog/categories', payload).then((r) => r.data.data)
}

export function updateCategory(id: string, payload: CategoryInput): Promise<Category> {
  return api.put<{ data: Category }>(`/catalog/categories/${id}`, payload).then((r) => r.data.data)
}

export function deleteCategory(id: string): Promise<void> {
  return api.delete(`/catalog/categories/${id}`).then(() => undefined)
}