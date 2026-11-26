import type {
  CatalogListParams,
  Category,
  CategoryInput,
  Product,
  ProductInput,
  ProductStockInput,
} from '@/types'

import { data, page, queryString } from './http'

export const catalogApi = {
  async categories(params: CatalogListParams = {}) {
    return page<Category>(`/categories${queryString(params)}`)
  },

  async createCategory(input: CategoryInput) {
    return data<Category>('/categories', { method: 'POST', body: input })
  },

  async updateCategory(id: number, input: Partial<CategoryInput>) {
    return data<Category>(`/categories/${id}`, { method: 'PATCH', body: input })
  },

  async products(params: CatalogListParams = {}) {
    return page<Product>(`/products${queryString(params)}`)
  },

  async createProduct(input: ProductInput) {
    return data<Product>('/products', { method: 'POST', body: input })
  },

  async updateProduct(id: number, input: Partial<ProductInput>) {
    return data<Product>(`/products/${id}`, { method: 'PATCH', body: input })
  },

  async updateProductStock(id: number, input: ProductStockInput) {
    return data<Product>(`/products/${id}/stock`, { method: 'PATCH', body: input })
  },

  async uploadProductImage(id: number, file: File) {
    const body = new FormData()
    body.append('image', file)
    return data<Product>(`/products/${id}/image`, { method: 'POST', body })
  },

  async deleteProductImage(id: number) {
    return data<Product>(`/products/${id}/image`, { method: 'DELETE' })
  },
}
