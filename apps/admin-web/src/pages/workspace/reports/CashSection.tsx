import { useQuery } from '@tanstack/react-query'
import { Wallet } from 'lucide-react'

import { ErrorState, LoadingState } from '@/components/PageFeedback'
import { SectionTitle } from '@/components/SectionTitle'
import { api } from '@/lib/api'
import { apiErrorMessage } from '@/lib/form-errors'
import type { ReportCashRow, ReportRangeParams } from '@/types'

import { CashSessionRow } from './CashSessionRow'
import { MetaNote } from './MetaNote'
import { REPORT_PER_PAGE } from './utils'

export function CashSection({
  params,
  outlets,
}: {
  params: ReportRangeParams
  outlets: { id: number; name: string }[]
}) {
  const cash = useQuery({
    queryKey: ['reports', 'cash', params],
    queryFn: () => api.reportCash({ ...params, per_page: REPORT_PER_PAGE }),
  })

  if (cash.isPending) return <LoadingState label="Memuat rekonsiliasi kas..." />

  if (cash.isError || !cash.data) {
    return (
      <ErrorState
        message={apiErrorMessage(
          cash.error,
          'Rekonsiliasi kas belum dapat dimuat. Periksa koneksi lalu coba lagi.',
        )}
        onRetry={() => void cash.refetch()}
      />
    )
  }

  const rows: ReportCashRow[] = cash.data.data

  return (
    <div className="space-y-3">
      <SectionTitle icon={Wallet}>Rekonsiliasi kas</SectionTitle>
      {rows.length === 0 ? (
        <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground" role="status">
          Belum ada Cash Session pada periode ini.
        </div>
      ) : (
        <>
          <ul className="space-y-3" aria-label="Rekap Cash Session pada periode">
            {rows.map((session) => (
              <CashSessionRow
                key={session.id}
                session={session}
                outletName={outlets.find((outlet) => outlet.id === session.outlet_id)?.name}
              />
            ))}
          </ul>
          <MetaNote shown={rows.length} total={cash.data.meta.total} />
        </>
      )}
    </div>
  )
}
