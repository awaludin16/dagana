// Lapisan akses API — enkripsi header konteks tenant/outlet & autorisasi.
import axios from 'axios'
import { clearSession, getToken } from './auth'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  headers: { Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = getToken()
  const tenant = localStorage.getItem('dagana.tenant')
  const outlet = localStorage.getItem('dagana.outlet')

  if (token) config.headers.Authorization = `Bearer ${token}`
  if (tenant) config.headers['X-Tenant-Context'] = tenant
  if (outlet) config.headers['X-Outlet-Context'] = outlet

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearSession()
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }
    return Promise.reject(error)
  },
)

export interface ApiErrorShape {
  code?: string
  message?: string
}

export function errorMessage(error: unknown): string {
  const data = (error as { response?: { data?: { error?: ApiErrorShape } } })?.response?.data
  return data?.error?.message ?? 'Terjadi kesalahan. Coba lagi.'
}

export interface ApiFieldErrors {
  [field: string]: string[]
}

/** Ambil daftar kesalahan per field dari respons 422 Laravel. */
export function extractFieldErrors(error: unknown): ApiFieldErrors {
  const data = (error as { response?: { data?: { errors?: ApiFieldErrors } } })?.response?.data
  const errors = data?.errors
  if (!errors || typeof errors !== 'object' || Array.isArray(errors)) return {}
  return errors
}

/** Pesan error untuk satu field, mis. `variants.0.sku`. */
export function fieldError(error: unknown, field: string): string | undefined {
  return extractFieldErrors(error)[field]?.[0]
}