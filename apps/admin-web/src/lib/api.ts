// Lapisan akses API — enkripsi header konteks tenant/outlet & autorisasi.
import axios, { type InternalAxiosRequestConfig } from 'axios'
import { clearSession, getRefreshToken, getToken, setSession, type LoginResult } from './auth'

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

// Satu refresh berjalan dibagi oleh semua request 401 yang datang bersamaan.
let refreshPromise: Promise<LoginResult> | null = null

// Perbarui access token via refresh token (pakai axios polos supaya tidak
// masuk loop interceptor). Backend memutar refresh token tiap kali dipakai.
async function refreshTokens(): Promise<LoginResult> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) throw new Error('Tidak ada refresh token.')
  const { data } = await axios.post<{ data: LoginResult }>(
    `${api.defaults.baseURL}/auth/refresh`,
    { refresh_token: refreshToken },
    { headers: { Accept: 'application/json' } },
  )
  setSession(data.data)
  return data.data
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error?.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined
    const status = error?.response?.status
    const isOnLogin = window.location.pathname === '/login'

    // 401 pada request biasa → coba refresh sekali lalu ulangi request.
    // Request refresh itu sendiri tidak ikut di-retry (hindari infinite loop).
    const canRetry =
      config && status === 401 && !config._retry && !isOnLogin && !config.url?.includes('/auth/refresh')

    if (canRetry) {
      try {
        if (!refreshPromise) {
          refreshPromise = refreshTokens().finally(() => {
            refreshPromise = null
          })
        }
        await refreshPromise
        config._retry = true
        return api(config)
      } catch {
        // Refresh gagal → sesi dianggap kedaluwarsa, lanjut ke logout.
      }
    }

    clearSession()
    if (!isOnLogin) window.location.assign('/login')
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