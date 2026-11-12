// Kontrak Phase 7: GET /api/v1/reports/* (docs/architecture/api-design.md §13).
// Semua agregat dihitung backend; frontend hanya menampilkan.

export type ReportRangeParams = {
  from: string
  to: string
  outlet_id?: number
}

export type ReportListParams = ReportRangeParams & {
  page?: number
  per_page?: number
  low_stock?: boolean
}

export type ReportDay = {
  date: string
  sales_total: number
  transactions: number
  average_order_value: number | null
}

export type SalesReport = {
  from: string
  to: string
  summary: { sales_total: number; transactions: number }
  days: ReportDay[]
}

export type PaymentMethodRow = {
  method: string
  transactions: number
  total: number
}

export type PaymentStatusRow = {
  status: string
  transactions: number
  total: number
}

export type PaymentsReport = {
  from: string
  to: string
  by_method: PaymentMethodRow[]
  by_status: PaymentStatusRow[]
}

export type OperatorReportRow = {
  membership_id: number
  operator_name: string
  transactions: number
  sales_total: number
}

export type ReportCashRow = {
  id: number
  outlet_id: number
  operator_membership_id: number
  status: string
  opening_cash: number
  movements_by_type: { type: string; amount: number }[]
  net_movement: number
  expected_cash: number
  actual_cash: number | null
  variance: number | null
  variance_note: string | null
  opened_at: string | null
  closed_at: string | null
}

export type ReportInventoryRow = {
  id: number
  business_id: number
  outlet_id: number
  name: string
  unit: string
  low_stock_threshold: number | null
  current_stock: number
  is_low_stock: boolean
  is_active: boolean
  movements_count: number
  movements_net: number
}
