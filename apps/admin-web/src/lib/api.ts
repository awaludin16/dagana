import { env } from '@/lib/env'
import type {
  Business,
  CreateMemberInput,
  Me,
  Member,
  Outlet,
  RoleCatalog,
  UpdateMemberInput,
  User,
} from '@/types'

type ApiEnvelope<T> = { data: T }
type ApiErrorResponse = { message?: string; errors?: Record<string, string[]> }

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

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  token?: string
  body?: unknown
}

async function request(path: string, options: RequestOptions = {}): Promise<Response> {
  const headers = new Headers({ Accept: 'application/json' })

  if (options.body !== undefined) headers.set('Content-Type', 'application/json')
  if (options.token) headers.set('Authorization', `Bearer ${options.token}`)

  const response = await fetch(`${env.apiBaseUrl.replace(/\/$/, '')}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  if (!response.ok) {
    let payload: ApiErrorResponse = {}

    if (response.headers.get('content-type')?.includes('application/json')) {
      payload = (await response.json()) as ApiErrorResponse
    }

    if (response.status === 401 && options.token) {
      window.dispatchEvent(new Event('dagana:session-expired'))
    }

    throw new ApiError(
      response.status >= 500
        ? 'Layanan sedang mengalami gangguan. Silakan coba lagi.'
        : (payload.message ?? `Permintaan gagal (HTTP ${response.status}).`),
      response.status,
      payload.errors ?? {},
    )
  }

  return response
}

async function data<T>(response: Response): Promise<T> {
  const envelope = (await response.json()) as ApiEnvelope<T>
  return envelope.data
}

export const api = {
  async register(input: {
    name: string
    email: string
    password: string
    password_confirmation: string
  }) {
    return data<{ user: User; token: string }>(
      await request('/auth/register', { method: 'POST', body: input }),
    )
  },

  async login(input: { email: string; password: string; device_name: string }) {
    return data<{ user: User; token: string }>(
      await request('/auth/login', { method: 'POST', body: input }),
    )
  },

  async logout(token: string) {
    await request('/auth/logout', { method: 'POST', token })
  },

  async profile(token: string) {
    return data<Me>(await request('/me', { token }))
  },

  async outlets(token: string) {
    return data<Outlet[]>(await request('/outlets', { token }))
  },

  async business(token: string, id: number) {
    return data<Business>(await request(`/businesses/${id}`, { token }))
  },

  async updateBusiness(
    token: string,
    id: number,
    input: Partial<Pick<Business, 'name' | 'phone' | 'address'>>,
  ) {
    return data<Business>(
      await request(`/businesses/${id}`, { method: 'PATCH', token, body: input }),
    )
  },

  async updateOutlet(
    token: string,
    id: number,
    input: Partial<Pick<Outlet, 'name' | 'phone' | 'address'>>,
  ) {
    return data<Outlet>(await request(`/outlets/${id}`, { method: 'PATCH', token, body: input }))
  },

  async createBusiness(
    token: string,
    input: {
      business: { name: string; phone: string; address: string }
      outlet: { name: string; phone: string; address: string }
    },
  ) {
    return data<{ business: Business; outlet: Outlet }>(
      await request('/businesses', { method: 'POST', token, body: input }),
    )
  },

  async members(token: string) {
    return data<Member[]>(await request('/members', { token }))
  },

  async createMember(token: string, input: CreateMemberInput) {
    return data<Member>(await request('/members', { method: 'POST', token, body: input }))
  },

  async updateMember(token: string, id: number, input: UpdateMemberInput) {
    return data<Member>(await request(`/members/${id}`, { method: 'PATCH', token, body: input }))
  },

  async removeMember(token: string, id: number) {
    await request(`/members/${id}`, { method: 'DELETE', token })
  },

  async roles(token: string) {
    return data<RoleCatalog[]>(await request('/roles', { token }))
  },
}
