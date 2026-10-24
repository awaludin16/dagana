import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ClipboardText } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { apiErrorMessage } from '@/lib/api-errors'
import { useBusiness } from '@/providers/business-provider'
import { PaginationBar } from '@/components/ui/pagination-bar'
import type { PaginatedResponse } from '@/types/catalog.types'
import type { Order } from '@/types/order.types'

function paymentMethodLabel(method: Order['payment']['method']): string {
  return {
    cash: 'Tunai',
    qr_payment: 'QR payment',
    bank_transfer: 'Transfer bank',
    debit: 'Debit',
    credit: 'Kredit',
  }[method]
}

export function OrdersPage() {
  const { activeOutlet } = useBusiness()
  if (!activeOutlet) {
    return (
      <EmptyState
        title="Outlet belum tersedia"
        description="Pilih outlet yang dapat Anda akses untuk melihat riwayat transaksi."
        icon={<ClipboardText className="size-10" weight="duotone" />}
      />
    )
  }

  return <OutletOrdersPage key={activeOutlet.id} outletId={activeOutlet.id} />
}

function OutletOrdersPage({ outletId }: { outletId: number | string }) {
  const { can } = useBusiness()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const queryKey = ['orders', outletId, page]
  const ordersQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Order>>(
        `/outlets/${outletId}/orders`,
        { params: { page, per_page: 20 } },
      )
      return response.data
    },
  })
  const confirmPayment = useMutation({
    mutationFn: async ({ orderId, reference }: { orderId: number; reference: string }) => {
      await api.post(`/outlets/${outletId}/orders/${orderId}/confirm-payment`, {
        reference: reference || undefined,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['orders', outletId] })
      toast.success('Pembayaran dikonfirmasi')
    },
  })

  if (ordersQuery.isPending) {
    return (
      <div className="space-y-4" aria-label="Memuat riwayat transaksi" aria-busy="true">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        {[0, 1, 2].map((row) => (
          <div key={row} className="space-y-3 rounded-lg border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-40 max-w-full" />
              </div>
              <Skeleton className="h-6 w-40 rounded-full" />
            </div>
            <div className="space-y-2">
              {[0, 1].map((item) => (
                <div key={item} className="flex items-center justify-between gap-3 py-2">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-36 max-w-full" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }
  if (ordersQuery.isError) {
    return (
      <ErrorState
        title="Riwayat transaksi tidak dapat dimuat"
        description={apiErrorMessage(ordersQuery.error, 'Permintaan pesanan gagal. Periksa koneksi lalu coba lagi.')}
        action={<Button onClick={() => void ordersQuery.refetch()}>Coba lagi</Button>}
      />
    )
  }

  const orders = ordersQuery.data.data
  return (
    <section className="space-y-4">
      <header>
        <h1 className="app-page-title">Riwayat transaksi</h1>
        <p className="text-sm text-muted-foreground">
          Receipt menampilkan snapshot item dan harga saat checkout.
        </p>
      </header>

      {orders.length === 0 ? (
        <EmptyState
          title="Belum ada pesanan"
          description="Pesanan akan muncul setelah checkout di POS."
          icon={<ClipboardText className="size-10" weight="duotone" />}
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <article key={order.id} className="space-y-3 rounded-lg border bg-card p-4">
              <header className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{order.number}</h2>
                  <p className="text-sm text-muted-foreground">
                    {new Intl.DateTimeFormat('id-ID', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(new Date(order.created_at))}
                  </p>
                </div>
                <Badge variant={order.status === 'PAID' ? 'secondary' : 'outline'}>
                  {order.status === 'PAID' ? 'Lunas' : 'Menunggu pembayaran'}
                </Badge>
              </header>

              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between gap-3 py-2 text-sm">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-muted-foreground">
                        {item.quantity} × Rp {item.unit_price.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <p className="shrink-0 font-medium tabular-nums">
                      Rp {item.total.toLocaleString('id-ID')}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div className="space-y-1">
                  <p>
                    Pembayaran: {paymentMethodLabel(order.payment.method)} · {order.payment.status}
                  </p>
                  <p className="text-muted-foreground">
                    Referensi: {order.payment.reference ?? 'Belum dicatat'}
                  </p>
                </div>
                <p className="font-semibold tabular-nums">
                  Total Rp {order.total.toLocaleString('id-ID')}
                </p>
              </div>

              {order.payment.status === 'PENDING' && can('payments.create') && (
                <form
                  className="flex flex-col gap-2 pt-3 sm:flex-row"
                  onSubmit={(event: FormEvent<HTMLFormElement>) => {
                    event.preventDefault()
                    const reference = String(new FormData(event.currentTarget).get('reference') ?? '').trim()
                    confirmPayment.mutate({ orderId: order.id, reference })
                  }}
                >
                  <label className="sr-only" htmlFor={`reference-${order.id}`}>
                    Referensi pembayaran
                  </label>
                  <Input
                    id={`reference-${order.id}`}
                    name="reference"
                    maxLength={150}
                    placeholder="Referensi pembayaran (opsional)"
                    className="min-h-11"
                    disabled={confirmPayment.isPending}
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    className="min-h-11"
                    disabled={confirmPayment.isPending}
                  >
                    {confirmPayment.isPending ? 'Mengonfirmasi…' : 'Konfirmasi pembayaran'}
                  </Button>
                </form>
              )}
            </article>
          ))}
        </div>
      )}

      <PaginationBar
        page={ordersQuery.data.meta.current_page}
        lastPage={ordersQuery.data.meta.last_page}
        total={ordersQuery.data.meta.total}
        perPage={ordersQuery.data.meta.per_page}
        noun="transaksi"
        onPageChange={setPage}
      />

      {confirmPayment.isError && (
        <p className="text-sm text-destructive" role="alert">
          {apiErrorMessage(confirmPayment.error, 'Konfirmasi pembayaran gagal. Coba lagi.')}
        </p>
      )}
    </section>
  )
}
