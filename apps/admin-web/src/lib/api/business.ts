import type { Business, CreateBusinessInput, Outlet, OutletInput } from '@/types'

import { data, request } from './http'

export const businessApi = {
  async outlets() {
    return data<Outlet[]>('/outlets')
  },

  async business(id: number) {
    return data<Business>(`/businesses/${id}`)
  },

  async updateBusiness(id: number, input: Pick<Business, 'name'>) {
    return data<Business>(`/businesses/${id}`, { method: 'PATCH', body: input })
  },

  async createOutlet(input: OutletInput) {
    return data<Outlet>('/outlets', { method: 'POST', body: input })
  },

  async updateOutlet(id: number, input: Partial<OutletInput>) {
    return data<Outlet>(`/outlets/${id}`, { method: 'PATCH', body: input })
  },

  async deleteOutlet(id: number) {
    await request(`/outlets/${id}`, { method: 'DELETE' })
  },

  async createBusiness(input: CreateBusinessInput) {
    return data<{ business: Business; outlet: Outlet }>('/businesses', {
      method: 'POST',
      body: input,
    })
  },
}
