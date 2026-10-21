import axios from 'axios'
import { env } from '@/config/env'

export const api = axios.create({
  baseURL: `${env.API_URL}/api/v1`,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

// Ambil XSRF-TOKEN dari cookie (Sanctum SPA)
function getCsrfToken() {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : undefined
}

let csrfPromise: Promise<void> | null = null
async function ensureCsrf(forceRefresh = false) {
  if (!forceRefresh && getCsrfToken()) return

  if (!csrfPromise) {
    const pending = fetch(`${env.API_URL}/sanctum/csrf-cookie`, {
      credentials: 'include',
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch CSRF cookie')
      })
    let request: Promise<void>
    request = pending.finally(() => {
      if (csrfPromise === request) csrfPromise = null
    })
    csrfPromise = request
  }
  return csrfPromise
}

// Request interceptor: set X-XSRF-TOKEN untuk method yang mengubah data
api.interceptors.request.use(async (config) => {
  const method = (config.method || 'get').toLowerCase()
  const needsCsrf = ['post', 'put', 'patch', 'delete'].includes(method)
  if (needsCsrf) {
    await ensureCsrf()
    const token = getCsrfToken()
    if (token) {
      config.headers = config.headers ?? {}
      config.headers['X-XSRF-TOKEN'] = token
    }
  }
  return config
})

// Response interceptor: handle 419 (CSRF expired/mismatch) -> retry once
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error.response?.status
    const originalRequest = error.config
    if (status === 419 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true
      // refresh CSRF cookie
      csrfPromise = null
      await ensureCsrf(true)
      const token = getCsrfToken()
      if (token && originalRequest.headers) {
        originalRequest.headers['X-XSRF-TOKEN'] = token
      }
      return api(originalRequest)
    }
    return Promise.reject(error)
  }
)

export default api
