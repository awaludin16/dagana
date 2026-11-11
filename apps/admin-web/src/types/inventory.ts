export type InventoryItem = {
  id: number
  business_id: number
  outlet_id: number
  name: string
  unit: string
  low_stock_threshold: number | null
  current_stock: number
  is_low_stock: boolean
  is_active: boolean
  created_at: string | null
  updated_at: string | null
}

export type StockMovement = {
  id: number
  business_id: number
  outlet_id: number
  inventory_item_id: number
  membership_id: number
  type: 'ADJUSTMENT'
  quantity_change: number
  reason: string
  created_at: string | null
}

export type InventoryListParams = {
  outlet_id?: number
  q?: string
  is_active?: boolean
  low_stock?: boolean
  page?: number
  per_page?: number
}

export type InventoryItemInput = Pick<
  InventoryItem,
  'name' | 'unit' | 'low_stock_threshold' | 'is_active'
>

export type CreateInventoryItemInput = InventoryItemInput & { outlet_id: number }

export type StockAdjustmentInput = {
  quantity_change: number
  reason: string
  idempotency_key: string
}
