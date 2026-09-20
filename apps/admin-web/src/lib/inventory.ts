// Jenis & operasi API modul Inventory (Phase 2). Kontrak: docs/API-Specification.md §4.5.
import { api } from './api'

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock'
export type MovementType = 'ADJUSTMENT' | 'OPNAME' | 'RECEIVING' | 'SALE'

export interface VariantLite {
  id: string
  sku: string
  unit: string
  product: { id: string; name: string }
}

export interface StockEntry {
  id: string
  quantity: string
  stock_status: StockStatus
  threshold: string | null
  variant: VariantLite
  outlet: { id: string; name: string }
}

export interface StockMovement {
  id: string
  quantity: string
  movement_type: MovementType
  reference_type: string | null
  reference_id: string | null
  reason: string | null
  note: string | null
  created_at: string
  actor: { id: string; name: string } | null
  variant: VariantLite
  outlet: { id: string; name: string }
}

export interface StockAdjustmentRecord {
  id: string
  product_variant_id: string
  system_qty: string
  counted_qty: string
  diff: string
}

export interface AdjustmentInput {
  product_variant_id: string
  quantity: number
  reason: string
  note?: string
}

export interface AdjustmentResult {
  adjustment: StockAdjustmentRecord
  movement: StockMovement
  balance: string
}

export interface ReceivingItemInput {
  product_variant_id: string
  quantity: number
  cost_price?: number
}

export interface ReceivingInput {
  note?: string
  received_at?: string
  items: ReceivingItemInput[]
}

export interface ReceivingResult {
  receiving: {
    id: string
    outlet_id: string
    received_at: string | null
    note: string | null
    items: { id: string; quantity: string; cost_price: string; variant: VariantLite }[]
  }
  movements: StockMovement[]
}

export interface Opname {
  id: string
  outlet_id: string
  started_at: string
  completed_at: string | null
  status: string
  adjustments_count?: number
}

export interface OpnameAdjustmentInput {
  product_variant_id: string
  counted_qty: number
  reason?: string
}

export interface OpnameCompleteResult {
  id: string
  status: string
  completed_at: string | null
  movements_count: number
}

export interface LowStockRule {
  id: string
  threshold: string
  outlet_id: string | null
  outlet: { id: string; name: string } | null
  variant: VariantLite
}

export interface Paginated<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface StockFilters {
  search?: string
  product_variant_id?: string
  low_stock?: boolean
  page?: number
  per_page?: number
}

export function listStocks(filters: StockFilters = {}): Promise<Paginated<StockEntry>> {
  return api.get<Paginated<StockEntry>>('/inventory/stocks', { params: filters }).then((r) => r.data)
}

export function getVariantStocks(
  variantId: string,
): Promise<{ variant: VariantLite; stocks: { outlet_id: string; outlet_name: string; quantity: string }[] }> {
  return api.get(`/inventory/stocks/${variantId}`).then((r) => r.data.data)
}

export function listStockMovements(filters: StockFilters = {}): Promise<Paginated<StockMovement>> {
  return api.get<Paginated<StockMovement>>('/inventory/stock-movements', { params: filters }).then((r) => r.data)
}

export function createAdjustment(payload: AdjustmentInput): Promise<AdjustmentResult> {
  return api.post<{ data: AdjustmentResult }>('/inventory/adjustments', payload).then((r) => r.data.data)
}

export function createReceiving(payload: ReceivingInput): Promise<ReceivingResult> {
  return api.post<{ data: ReceivingResult }>('/inventory/receivings', payload).then((r) => r.data.data)
}

export function createOpname(): Promise<Opname> {
  return api.post<{ data: Opname }>('/inventory/opnames', {}).then((r) => r.data.data)
}

export function getActiveOpname(): Promise<Opname | null> {
  return api.get<{ data: Opname | null }>('/inventory/opnames/active').then((r) => r.data.data)
}

export function addOpnameAdjustment(
  opnameId: string,
  payload: OpnameAdjustmentInput,
): Promise<StockAdjustmentRecord> {
  return api
    .post<{ data: StockAdjustmentRecord }>(`/inventory/opnames/${opnameId}/adjustments`, payload)
    .then((r) => r.data.data)
}

export function completeOpname(opnameId: string): Promise<OpnameCompleteResult> {
  return api.post<{ data: OpnameCompleteResult }>(`/inventory/opnames/${opnameId}/complete`, {}).then((r) => r.data.data)
}

export function listLowStockRules(): Promise<LowStockRule[]> {
  return api.get<{ data: LowStockRule[] }>('/inventory/low-stock-rules').then((r) => r.data.data)
}

export function createLowStockRule(payload: {
  product_variant_id: string
  outlet_id?: string
  threshold: number
}): Promise<LowStockRule> {
  return api.post<{ data: LowStockRule }>('/inventory/low-stock-rules', payload).then((r) => r.data.data)
}

export function updateLowStockRule(id: string, threshold: number): Promise<LowStockRule> {
  return api.patch<{ data: LowStockRule }>(`/inventory/low-stock-rules/${id}`, { threshold }).then((r) => r.data.data)
}