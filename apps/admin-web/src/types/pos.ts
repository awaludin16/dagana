import type { OrderCreateInput } from '@/types'

export type PaymentMethod = 'cash' | 'qr_payment'

export type CartLine = {
  product_id: number
  product_name: string
  product_price: number
  quantity: number
}

export type CheckoutAttempt = {
  input: OrderCreateInput
  cart: CartLine[]
}

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Tunai' },
  { value: 'qr_payment', label: 'QRIS' },
]

export const QUICK_CASH_AMOUNTS = [100000, 50000, 20000, 10000, 5000, 0]
export const CASH_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', 'backspace', 'clear']
export const CATALOG_PAGE_SIZE = 100
export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
