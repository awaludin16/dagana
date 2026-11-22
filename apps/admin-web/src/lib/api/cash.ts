import type {
  CashMovement,
  CashMovementInput,
  CashSession,
  CashSessionListParams,
  CloseCashSessionInput,
  OpenCashSessionInput,
} from '@/types'

import { data, page, queryString } from './http'

export const cashApi = {
  async cashSessions(params: CashSessionListParams = {}) {
    return page<CashSession>(`/cash-sessions${queryString(params)}`)
  },

  async cashSession(id: number) {
    return data<CashSession>(`/cash-sessions/${id}`)
  },

  async openCashSession(input: OpenCashSessionInput) {
    return data<CashSession>('/cash-sessions', { method: 'POST', body: input })
  },

  async cashMovements(sessionId: number, params: CashSessionListParams = {}) {
    return page<CashMovement>(`/cash-sessions/${sessionId}/movements${queryString(params)}`)
  },

  async createCashMovement(sessionId: number, input: CashMovementInput) {
    return data<CashMovement>(`/cash-sessions/${sessionId}/movements`, {
      method: 'POST',
      body: input,
    })
  },

  async closeCashSession(sessionId: number, input: CloseCashSessionInput) {
    return data<CashSession>(`/cash-sessions/${sessionId}/close`, {
      method: 'POST',
      body: input,
    })
  },
}
