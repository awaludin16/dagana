import { Link, Navigate } from 'react-router'

import { useAccess } from '@/auth/useAccess'
import { ErrorState, LoadingState } from '@/components/PageFeedback'
import { Button } from '@/components/ui/button'

import { CashStatusSection } from './CashStatusSection'
import { RecentOrdersSection } from './RecentOrdersSection'
import { SummarySection } from './SummarySection'
import { timeGreeting } from './utils'

export function DashboardPage() {
  const access = useAccess()

  if (access.isPending) return <LoadingState label="Memeriksa Business Anda..." />

  if (access.isError) {
    return (
      <ErrorState
        message="Business belum dapat dimuat. Periksa koneksi lalu coba lagi."
        onRetry={() => void access.refetch()}
      />
    )
  }

  if (!access.membership) return <Navigate to="/onboarding" replace />

  const outlets = access.membership.outlets

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">
            {timeGreeting()}, {access.data?.name ?? 'Pengguna'}
          </p>
          <h1 className="text-page-title tracking-tight">{access.membership.business.name}</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Ringkasan operasional: penjualan hari ini, tren 7 hari terakhir, status kas, dan
            transaksi terbaru. Semua angka dihitung server; bukan accounting penuh.
          </p>
        </div>
        {access.can('orders.create') && (
          <Button asChild size="lg" className="self-start sm:self-center">
            <Link to="/pos">Mulai Jualan</Link>
          </Button>
        )}
      </header>

      {access.can('reports.read') && <SummarySection />}
      {access.can('cash.read') && <CashStatusSection outlets={outlets} />}
      {access.can('orders.read') && <RecentOrdersSection outlets={outlets} />}
    </section>
  )
}
