export type PaymentMethod =
  | 'cash'
  | 'qr_payment'
  | 'bank_transfer'
  | 'debit'
  | 'credit'

export interface OrderItem {
  id: number
  menu_id: number | null
  name: string
  quantity: number
  unit_price: number
  total: number
}

export interface OrderPayment {
  id: number
  method: PaymentMethod
  amount: number
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED'
  reference: string | null
  actor_user_id: number
  confirmed_by_user_id: number | null
  created_at: string
  paid_at: string | null
}

export interface Order {
  id: number
  number: string
  outlet_id: number
  actor_user_id: number
  source: 'POS'
  status: 'PENDING_PAYMENT' | 'PAID'
  total: number
  created_at: string
  items: OrderItem[]
  payment: OrderPayment
}
