import { StatusBadge } from '@/components/states/StatusBadge'
import { Button } from '@/components/ui/button'
import { ShoppingCart } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Dasbor</h1>
          <p className="text-sm text-muted-foreground">
            Lihat kondisi usaha hari ini.
          </p>
        </div>
        <Button variant="accent" asChild>
          <Link to="/pos" className="gap-2">
            <ShoppingCart className="size-4" />
            Mulai Jualan
          </Link>
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Penjualan Hari Ini', value: 'Rp 0', note: '0 transaksi' },
          { label: 'Status Kas', value: 'Belum Dibuka', badge: 'neutral' as const },
          { label: 'Pesanan Aktif', value: '0', note: 'Hari ini' },
          { label: 'Stok Menipis', value: '0', note: 'Produk' },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border bg-card p-4 shadow-xs">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="mt-2 text-lg font-semibold">{item.value}</p>
            <div className="mt-2 flex items-center justify-between">
              {item.note ? <p className="text-xs text-muted-foreground">{item.note}</p> : <div />}
              {item.badge ? <StatusBadge label="Belum Aktif" variant="neutral" /> : null}
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-lg border bg-card p-4">
        <h2 className="text-sm font-semibold">Transaksi Terbaru</h2>
        <p className="mt-1 text-sm text-muted-foreground">Belum ada transaksi.</p>
      </div>
    </div>
  )
}
