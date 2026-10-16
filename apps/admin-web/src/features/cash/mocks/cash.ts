export interface CashSession {
  id: string
  status: 'open' | 'closed'
  opening: number
  openedAt: string
  operator?: string
}

export const cashSession: CashSession | null = null
