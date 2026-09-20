import { useQuery } from '@tanstack/react-query'
import { Card } from '../components/ui/card'
import { Skeleton } from '../components/ui/skeleton'
import { api } from '../lib/api'

interface Me {
  user: { id: string; name: string; email: string }
  tenants: { id: string; name: string; slug: string }[]
  current_tenant: string | null
  outlets: { id: string; name: string; business_type: string }[]
  permissions: string[]
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</div>
    </Card>
  )
}

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<{ data: Me }>('/auth/me').then((r) => r.data.data),
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-40 rounded-xl" />
      </div>
    )
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        Gagal memuat data.{' '}
        <button onClick={() => window.location.reload()} className="underline">
          Coba lagi
        </button>
      </p>
    )
  }

  const tenant = data!.tenants[0]

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Selamat datang, {data!.user.name}. Base line Phase 0 aktif.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Tenant aktif" value={tenant?.name ?? '—'} />
        <StatCard label="Outlet" value={String(data!.outlets.length)} />
        <StatCard label="Permission" value={String(data!.permissions.length)} />
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-foreground">Konteks tenant</h2>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">
          {JSON.stringify({ tenants: data!.tenants, permissions: data!.permissions }, null, 2)}
        </pre>
      </Card>
    </div>
  )
}