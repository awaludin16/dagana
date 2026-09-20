// Manajemen sesi: access token (JWT) + refresh token + konteks tenant/outlet.
import { api } from './api'

const ACCESS_KEY = 'dagana.accessToken'
const REFRESH_KEY = 'dagana.refreshToken'
const TENANT_KEY = 'dagana.tenant'

export interface TenantLite {
  id: string
  name: string
  slug: string
}

export interface LoginResult {
  access_token: string
  refresh_token: string
  expires_in: number
  user: { id: string; name: string; email: string }
  tenants: TenantLite[]
}

export function getToken(): string | null {
  return localStorage.getItem(ACCESS_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

export function getActiveTenant(): string | null {
  return localStorage.getItem(TENANT_KEY)
}

export function setActiveTenant(tenantId: string): void {
  localStorage.setItem(TENANT_KEY, tenantId)
}

export function setSession(session: LoginResult): void {
  localStorage.setItem(ACCESS_KEY, session.access_token)
  localStorage.setItem(REFRESH_KEY, session.refresh_token)
  const first = session.tenants?.[0]
  if (first) setActiveTenant(first.id)
}

export function clearSession(): void {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(TENANT_KEY)
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const { data } = await api.post<{ data: LoginResult }>('/auth/login', { email, password })
  setSession(data.data)
  return data.data
}

export async function refreshSession(): Promise<LoginResult> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) throw new Error('Tidak ada refresh token.')

  const { data } = await api.post<{ data: LoginResult }>('/auth/refresh', {
    refresh_token: refreshToken,
  })
  setSession(data.data)
  return data.data
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken()
  try {
    if (refreshToken) await api.post('/auth/logout', { refresh_token: refreshToken })
  } finally {
    clearSession()
  }
}