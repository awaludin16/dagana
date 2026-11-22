import type {
  OperatorReportRow,
  PaymentsReport,
  ReportCashRow,
  ReportListParams,
  ReportRangeParams,
  SalesReport,
} from '@/types'

import { data, page, queryString } from './http'

export const reportsApi = {
  async reportSales(params: ReportRangeParams) {
    return data<SalesReport>(`/reports/sales${queryString(params)}`)
  },

  async reportPayments(params: ReportRangeParams) {
    return data<PaymentsReport>(`/reports/payments${queryString(params)}`)
  },

  async reportOperators(params: ReportListParams) {
    return page<OperatorReportRow>(`/reports/operators${queryString(params)}`)
  },

  async reportCash(params: ReportListParams) {
    return page<ReportCashRow>(`/reports/cash${queryString(params)}`)
  },
}
