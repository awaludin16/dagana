import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

interface Me {
  user: { id: string; name: string; email: string }
  tenants: { id: string; name: string; slug: string }[]
  current_tenant: string | null
  outlets: { id: string; name: string; business_type: string }[]
  permissions: string[]
}

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<{ data: Me }>('/auth/me').then((r) => r.data.data),
  })

  if (isLoading) return <p className="text-slate-500">Memuat data…</p>
  if (isError) return <p className="text-rose-600">Gagal memuat data.</p>

  const tenant = data!.tenants[0]

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Selamat datang, {data!.user.name}. Base line Phase 0 aktif.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card label="Tenant aktif" value={tenant?.name ?? '—'} />
        <Card label="Outlet" value={String(data!.outlets.length)} />
        <Card label="Permission" value={String(data!.permissions.length)} />
      </div>

      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700">Konteks tenant</h2>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">
          {JSON.stringify({ tenants: data!.tenants, permissions: data!.permissions }, null, 2)}
        </pre>
      </section>
    </div>
  )
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-900">{value}</div>
    </div>
  )
}