import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { useBusiness } from '@/providers/business-provider'
import { api } from '@/lib/api'
import type { PaginatedResponse } from '@/types/catalog.types'
import type { Order } from '@/types/order.types'
import { ShoppingCart } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'

export function DashboardPage() {
  const { activeOutlet } = useBusiness()

  if (!activeOutlet) {
    return (
      <EmptyState
        title="Pilih outlet untuk mulai"
        description="Pilih outlet aktif untuk melihat transaksi atau mulai berjualan."
        action={
          <Button asChild variant="outline">
            <Link to="/outlets">Kelola outlet</Link>
          </Button>
        }
      />
    )
  }

  return <OutletDashboard key={activeOutlet.id} outletId={activeOutlet.id} />
}

function OutletDashboard({ outletId }: { outletId: string | number }) {
  const ordersQuery = useQuery({
    queryKey: ['dashboard-orders', outletId],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Order>>(
        `/outlets/${outletId}/orders`,
        { params: { per_page: 5 } },
      )
      return response.data
    },
  })

  if (ordersQuery.isPending) {
    return (
      <div className="space-y-6" aria-label="Memuat aktivitas outlet" aria-busy="true">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
          <Skeleton className="h-11 w-36" />
        </div>
        <section className="space-y-4">
          <Skeleton className="h-6 w-48" />
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} className="h-20 w-full" />
          ))}
        </section>
      </div>
    )
  }

  if (ordersQuery.isError) {
    return (
      <ErrorState
        title="Aktivitas outlet belum dapat dimuat"
        description="Periksa koneksi atau akses outlet, lalu coba muat ulang."
        action={
          <Button variant="outline" onClick={() => void ordersQuery.refetch()}>
            Coba lagi
          </Button>
        }
      />
    )
  }

  const orders = ordersQuery.data.data
  const currency = new Intl.NumberFormat('id-ID')
  const dateTime = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="app-page-title">Dasbor</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Aktivitas terbaru outlet. {new Intl.DateTimeFormat('id-ID', { dateStyle: 'full' }).format(new Date())}.
          </p>
        </div>
        <Button className="min-h-11 w-full sm:w-auto" asChild>
          <Link to="/pos" className="gap-2">
            <ShoppingCart className="size-4" aria-hidden="true" />
            Mulai Jualan
          </Link>
        </Button>
      </header>
      <section className="max-w-4xl space-y-3" aria-labelledby="recent-orders-title">
        <header className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="recent-orders-title" className="text-lg font-semibold">
            Transaksi terbaru
          </h2>
          <Link
            to="/orders"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            Lihat semua
          </Link>
        </header>
        {orders.length === 0 ? (
          <EmptyState
            title="Belum ada transaksi"
            description="Transaksi pertama akan muncul di sini setelah checkout."
            action={
              <Button asChild>
                <Link to="/pos">Buka POS</Link>
              </Button>
            }
          />
        ) : (
          <ul className="divide-y">
            {orders.map((order) => (
              <li key={order.id} className="flex min-w-0 flex-wrap items-center justify-between gap-3 py-4">
                <div className="min-w-0">
                  <p className="break-words font-medium">{order.number}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {dateTime.format(new Date(order.created_at))} · {order.items.length}{" "}
                    jenis menu
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold tabular-nums">
                    Rp {currency.format(order.total)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {order.payment.status === 'PAID' ? 'Lunas' : 'Menunggu pembayaran'}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
