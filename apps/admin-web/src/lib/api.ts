import { env } from '@/lib/env'
import type {
  Business,
  CatalogListParams,
  CatalogPage,
  Category,
  CategoryInput,
  CashMovement,
  CashMovementInput,
  CashSession,
  CashSessionListParams,
  CloseCashSessionInput,
  CreateBusinessInput,
  CreateInventoryItemInput,
  CreateMemberInput,
  InventoryItem,
  InventoryItemInput,
  InventoryListParams,
  Me,
  Member,
  OpenCashSessionInput,
  Outlet,
  OutletInput,
  Order,
  OrderCreateInput,
  OrderListParams,
  OrderPayment,
  Product,
  ProductInput,
  RoleCatalog,
  StockAdjustmentInput,
  StockMovement,
  UpdateMemberInput,
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
  body?: unknown
  allowUnauthenticated?: boolean
  isRetry?: boolean
}

function xsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

async function fetchCsrf(): Promise<void> {
  const response = await fetch(`${env.apiOrigin}/sanctum/csrf-cookie`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new ApiError('Sesi keamanan belum dapat dimuat. Silakan coba lagi.', response.status)
  }
}

async function request(path: string, options: RequestOptions = {}): Promise<Response> {
  const method = options.method ?? 'GET'
  const headers = new Headers({ Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' })

  if (options.body !== undefined) headers.set('Content-Type', 'application/json')

  if (method !== 'GET') {
    if (!xsrfToken()) await fetchCsrf()

    const token = xsrfToken()
    if (token) headers.set('X-XSRF-TOKEN', token)
  }

  const response = await fetch(`${env.apiBaseUrl.replace(/\/$/, '')}${path}`, {
    method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    credentials: 'include',
  })

  if (response.status === 419 && method !== 'GET' && !options.isRetry) {
    await fetchCsrf()
    return request(path, { ...options, isRetry: true })
  }

  if (!response.ok) {
    let payload: ApiErrorResponse = {}

    if (response.headers.get('content-type')?.includes('application/json')) {
      payload = (await response.json()) as ApiErrorResponse
    }

    if (response.status === 401 && !options.allowUnauthenticated) {
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

async function page<T>(response: Response): Promise<CatalogPage<T>> {
  return (await response.json()) as CatalogPage<T>
}

function queryString(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value))
  }
  const query = search.toString()
  return query ? `?${query}` : ''
}

export const api = {
  async register(input: {
    name: string
    email: string
    password: string
    password_confirmation: string
  }) {
    return data<Me>(await request('/auth/web/register', { method: 'POST', body: input }))
  },

  async login(input: { email: string; password: string }) {
    return data<Me>(await request('/auth/web/login', { method: 'POST', body: input }))
  },

  async logout() {
    await request('/auth/web/logout', { method: 'POST' })
  },

  async profile() {
    try {
      return data<Me>(await request('/me', { allowUnauthenticated: true }))
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return null
      throw error
    }
  },

  async outlets() {
    return data<Outlet[]>(await request('/outlets'))
  },

  async business(id: number) {
    return data<Business>(await request(`/businesses/${id}`))
  },

  async updateBusiness(id: number, input: Pick<Business, 'name'>) {
    return data<Business>(await request(`/businesses/${id}`, { method: 'PATCH', body: input }))
  },

  async createOutlet(input: OutletInput) {
    return data<Outlet>(await request('/outlets', { method: 'POST', body: input }))
  },

  async updateOutlet(id: number, input: Partial<OutletInput>) {
    return data<Outlet>(await request(`/outlets/${id}`, { method: 'PATCH', body: input }))
  },

  async deleteOutlet(id: number) {
    await request(`/outlets/${id}`, { method: 'DELETE' })
  },

  async createBusiness(input: CreateBusinessInput) {
    return data<{ business: Business; outlet: Outlet }>(
      await request('/businesses', { method: 'POST', body: input }),
    )
  },

  async members() {
    return data<Member[]>(await request('/members'))
  },

  async createMember(input: CreateMemberInput) {
    return data<Member>(await request('/members', { method: 'POST', body: input }))
  },

  async updateMember(id: number, input: UpdateMemberInput) {
    return data<Member>(await request(`/members/${id}`, { method: 'PATCH', body: input }))
  },

  async deleteMember(id: number) {
    await request(`/members/${id}`, { method: 'DELETE' })
  },

  async roles() {
    return data<RoleCatalog[]>(await request('/roles'))
  },

  async categories(params: CatalogListParams = {}) {
    return page<Category>(await request(`/categories${queryString(params)}`))
  },

  async createCategory(input: CategoryInput) {
    return data<Category>(await request('/categories', { method: 'POST', body: input }))
  },

  async updateCategory(id: number, input: Partial<CategoryInput>) {
    return data<Category>(await request(`/categories/${id}`, { method: 'PATCH', body: input }))
  },

  async products(params: CatalogListParams = {}) {
    return page<Product>(await request(`/products${queryString(params)}`))
  },

  async orders(params: OrderListParams = {}) {
    return page<Order>(await request(`/orders${queryString(params)}`))
  },

  async order(id: number) {
    return data<Order>(await request(`/orders/${id}`))
  },

  async createOrder(input: OrderCreateInput) {
    return data<Order>(await request('/orders', { method: 'POST', body: input }))
  },

  async confirmPayment(id: number) {
    return data<OrderPayment>(await request(`/payments/${id}/confirm`, { method: 'POST' }))
  },

  async createProduct(input: ProductInput) {
    return data<Product>(await request('/products', { method: 'POST', body: input }))
  },

  async updateProduct(id: number, input: Partial<ProductInput>) {
    return data<Product>(await request(`/products/${id}`, { method: 'PATCH', body: input }))
  },

  async cashSessions(params: CashSessionListParams = {}) {
    return page<CashSession>(await request(`/cash-sessions${queryString(params)}`))
  },

  async cashSession(id: number) {
    return data<CashSession>(await request(`/cash-sessions/${id}`))
  },

  async openCashSession(input: OpenCashSessionInput) {
    return data<CashSession>(await request('/cash-sessions', { method: 'POST', body: input }))
  },

  async cashMovements(sessionId: number, params: CashSessionListParams = {}) {
    return page<CashMovement>(
      await request(`/cash-sessions/${sessionId}/movements${queryString(params)}`),
    )
  },

  async createCashMovement(sessionId: number, input: CashMovementInput) {
    return data<CashMovement>(
      await request(`/cash-sessions/${sessionId}/movements`, { method: 'POST', body: input }),
    )
  },

  async closeCashSession(sessionId: number, input: CloseCashSessionInput) {
    return data<CashSession>(
      await request(`/cash-sessions/${sessionId}/close`, { method: 'POST', body: input }),
    )
  },

  async inventoryItems(params: InventoryListParams = {}) {
    return page<InventoryItem>(await request(`/inventory${queryString(params)}`))
  },

  async inventoryItem(id: number) {
    return data<InventoryItem>(await request(`/inventory/${id}`))
  },

  async createInventoryItem(input: CreateInventoryItemInput) {
    return data<InventoryItem>(await request('/inventory', { method: 'POST', body: input }))
  },

  async updateInventoryItem(id: number, input: Partial<InventoryItemInput>) {
    return data<InventoryItem>(await request(`/inventory/${id}`, { method: 'PATCH', body: input }))
  },

  async inventoryMovements(id: number, params: InventoryListParams = {}) {
    return page<StockMovement>(await request(`/inventory/${id}/movements${queryString(params)}`))
  },

  async adjustInventoryStock(id: number, input: StockAdjustmentInput) {
    return data<StockMovement>(
      await request(`/inventory/${id}/adjustments`, { method: 'POST', body: input }),
    )
  },
}
