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