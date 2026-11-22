import type { Order, OrderCreateInput, OrderListParams, OrderPayment } from '@/types'

import { data, page, queryString } from './http'

export const ordersApi = {
  async orders(params: OrderListParams = {}) {
    return page<Order>(`/orders${queryString(params)}`)
  },

  async order(id: number) {
    return data<Order>(`/orders/${id}`)
  },

  async createOrder(input: OrderCreateInput) {
    return data<Order>('/orders', { method: 'POST', body: input })
  },

  async confirmPayment(id: number) {
    return data<OrderPayment>(`/payments/${id}/confirm`, { method: 'POST' })
  },
}
