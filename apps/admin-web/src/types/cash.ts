export type CashSessionStatus = 'OPEN' | 'CLOSED'

export type CashMovementType = 'CASH_SALE' | 'CASH_IN' | 'CASH_OUT' | 'REFUND' | 'ADJUSTMENT'

export type CashSession = {
  id: number
  business_id: number
  outlet_id: number
  operator_membership_id: number
  status: CashSessionStatus
  opening_cash: number
  expected_cash: number
  actual_cash: number | null
  variance: number | null
  variance_note: string | null
  opened_at: string
  closed_at: string | null
  closed_by_membership_id: number | null
  created_at: string
}

export type CashMovement = {
  id: number
  cash_session_id: number
  business_id: number
  outlet_id: number
  membership_id: number
  type: CashMovementType
  amount: number
  reason: string | null
  created_at: string
}

export type CashSessionListParams = {
  outlet_id?: number
  status?: CashSessionStatus
  page?: number
  per_page?: number
}

export type OpenCashSessionInput = {
  outlet_id: number
  opening_cash: number
}

export type CashMovementInput = {
  type: Exclude<CashMovementType, 'CASH_SALE'>
  amount: number
  reason?: string
}

export type CloseCashSessionInput = {
  actual_cash: number
  variance_note?: string
}
