export type OrderItem = {
  id: number
  order_id: number
  product_id: number
  product_name: string
  product_price: number
  quantity: number
  total: number
  created_at: string | null
}

export type OrderPayment = {
  id: number
  order_id: number
  method: string
  status: string
  amount: number
  amount_tendered: number | null
  change_amount: number | null
  qr_code_payload: string | null
  reference: string | null
  paid_at: string | null
  created_at: string | null
}

export type Order = {
  id: number
  business_id: number
  outlet_id: number
  source: string
  status: string
  total_amount: number
  notes: string | null
  created_at: string | null
  updated_at: string | null
  items: OrderItem[]
  payment: OrderPayment | null
}

export type OrderListParams = {
  page?: number
  per_page?: number
}

export type OrderCreateInput = {
  outlet_id: number
  idempotency_key: string
  payment_method: OrderPayment['method']
  amount_tendered?: number
  items: { product_id: number; quantity: number }[]
}
