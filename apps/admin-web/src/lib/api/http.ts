import axios, {
  AxiosHeaders,
  type AxiosAdapter,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'

import { env } from '@/lib/env'
import type { CatalogPage } from '@/types'

declare module 'axios' {
  interface AxiosRequestConfig {
    allowUnauthenticated?: boolean
    isRetry?: boolean
  }
}

export type ApiEnvelope<T> = { data: T }
export type ApiErrorResponse = { message?: string; errors?: Record<string, string[]> }

export class ApiError extends Error {
  readonly status: number
  readonly errors: Record<string, string[]>

  constructor(message: string, status: number, errors: Record<string, string[]> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  allowUnauthenticated?: boolean
  isRetry?: boolean
}

function fullUrl(config: AxiosRequestConfig): string {
  const path = config.url ?? ''
  if (/^https?:\/\//i.test(path)) return path

  const base = (config.baseURL ?? '').replace(/\/$/, '')
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`
}

// Adapter fetch menjaga mock global.fetch pada test tetap berlaku tanpa mengubah perilaku request.
const fetchAdapter: AxiosAdapter = async (config) => {
  const headers = new Headers()
  const source =
    config.headers instanceof AxiosHeaders ? config.headers.toJSON() : (config.headers ?? {})

  for (const [key, value] of Object.entries(source)) {
    if (value !== undefined && value !== null) headers.set(key, String(value))
  }

  if (config.data instanceof FormData) headers.delete('Content-Type')

  const response = await fetch(fullUrl(config), {
    method: (config.method ?? 'get').toUpperCase(),
    headers,
    body:
      config.data === undefined
        ? undefined
        : config.data instanceof FormData
          ? config.data
          : typeof config.data === 'string'
            ? config.data
            : JSON.stringify(config.data),
    credentials: 'include',
  })

  let payload: unknown = null
  if (response.headers.get('content-type')?.includes('application/json')) {
    const text = await response.text()
    payload = text ? JSON.parse(text) : null
  }

  const responseHeaders = new AxiosHeaders()
  response.headers.forEach((value, key) => responseHeaders.set(key, value))

  return {
    data: payload,
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
    config,
    request: response,
  }
}

function xsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

const csrfClient = axios.create({
  baseURL: env.apiOrigin,
  adapter: fetchAdapter,
  withCredentials: true,
  validateStatus: () => true,
  headers: { Accept: 'application/json' },
})

async function refreshCsrf(): Promise<void> {
  const response = await csrfClient.get('/sanctum/csrf-cookie')
  if (response.status >= 400) {
    throw new ApiError('Sesi keamanan belum dapat dimuat. Silakan coba lagi.', response.status)
  }
}

export const http = axios.create({
  baseURL: env.apiBaseUrl,
  adapter: fetchAdapter,
  withCredentials: true,
  validateStatus: () => true,
  headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
})

http.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const headers = new AxiosHeaders(config.headers)

  if (config.data !== undefined && !(config.data instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if ((config.method ?? 'get').toUpperCase() !== 'GET') {
    if (!xsrfToken()) await refreshCsrf()

    const token = xsrfToken()
    if (token) headers.set('X-XSRF-TOKEN', token)
  }

  config.headers = headers
  return config
})

http.interceptors.response.use(async (response) => {
  const config = response.config

  if (
    response.status === 419 &&
    (config.method ?? 'get').toUpperCase() !== 'GET' &&
    !config.isRetry
  ) {
    await refreshCsrf()
    return http.request({ ...config, isRetry: true })
  }

  if (response.status >= 200 && response.status < 300) return response

  const payload = (response.data ?? {}) as ApiErrorResponse
  if (response.status === 401 && !config.allowUnauthenticated) {
    window.dispatchEvent(new Event('dagana:session-expired'))
  }

  throw new ApiError(
    response.status >= 500
      ? 'Layanan sedang mengalami gangguan. Silakan coba lagi.'
      : (payload.message ?? `Permintaan gagal (HTTP ${response.status}).`),
    response.status,
    payload.errors ?? {},
  )
})

export function request(path: string, options: RequestOptions = {}): Promise<AxiosResponse> {
  return http.request({
    url: path,
    method: options.method ?? 'GET',
    data: options.body,
    allowUnauthenticated: options.allowUnauthenticated,
    isRetry: options.isRetry,
  })
}

export async function data<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await request(path, options)
  return (response.data as ApiEnvelope<T>).data
}

export async function raw<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await request(path, options)
  return response.data as T
}

export async function page<T>(path: string, options: RequestOptions = {}): Promise<CatalogPage<T>> {
  const response = await request(path, options)
  return response.data as CatalogPage<T>
}

export function queryString(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value))
  }
  const query = search.toString()
  return query ? `?${query}` : ''
}
