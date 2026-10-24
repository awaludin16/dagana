import { useState } from 'react'
import { isAxiosError } from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { StatusBadge } from '@/components/states/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { PaginationBar } from '@/components/ui/pagination-bar'
import { api } from '@/lib/api'
import { useBusiness } from '@/providers/business-provider'
import type { ApiPaginatedCollection } from '@/types/organization.types'
import type { Outlet } from '@/types/auth.types'

interface OutletPayload {
  name: string
  address?: string
}

export function OutletsPage() {
  const { activeBusiness, can } = useBusiness()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<Outlet | null>(null)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [error, setError] = useState<string | null>(null)
  const businessId = activeBusiness?.id
  const queryKey = ['business-outlets', businessId, 'all', page]

  const outletsQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await api.get<ApiPaginatedCollection<Outlet>>(
        `/businesses/${businessId}/outlets`,
        { params: { status: 'all', page, per_page: 10 } },
      )
      return response.data
    },
    enabled: !!businessId && can('outlets.read'),
  })

  const closeEditor = () => {
    setCreating(false)
    setEditing(null)
    setName('')
    setAddress('')
    setError(null)
  }

  const saveMutation = useMutation({
    mutationFn: (payload: OutletPayload) => editing
      ? api.patch(`/outlets/${editing.id}`, payload)
      : api.post(`/businesses/${businessId}/outlets`, payload),
    onSuccess: async () => {
      toast.success(editing ? 'Outlet berhasil diperbarui' : 'Outlet berhasil dibuat')
      closeEditor()
      await queryClient.invalidateQueries({ queryKey: ['business-outlets', businessId] })
    },
    onError: (mutationError) => {
      const message = isAxiosError<{ message?: string; errors?: Record<string, string[]> }>(mutationError)
        ? Object.values(mutationError.response?.data?.errors ?? {}).flat()[0] ??
          mutationError.response?.data?.message
        : null
      setError(message ?? 'Outlet belum dapat disimpan. Periksa koneksi lalu coba lagi.')
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({ outlet, enable }: { outlet: Outlet; enable: boolean }) =>
      api.post(`/outlets/${outlet.id}/${enable ? 'enable' : 'disable'}`),
    onSuccess: async (_, variables) => {
      toast.success(variables.enable ? 'Outlet diaktifkan kembali' : 'Outlet dinonaktifkan')
      await queryClient.invalidateQueries({ queryKey: ['business-outlets', businessId] })
    },
    onError: () => setError('Status outlet belum dapat diubah. Coba lagi.'),
  })

  const beginEdit = (outlet: Outlet) => {
    setEditing(outlet)
    setName(outlet.name)
    setAddress(outlet.address ?? '')
    setCreating(false)
    setError(null)
  }

  const beginCreate = () => {
    setEditing(null)
    setCreating(true)
    setName('')
    setAddress('')
    setError(null)
  }

  if (!activeBusiness) {
    return <EmptyState title="Pilih bisnis" description="Pilih business untuk mengelola outlet." />
  }

  if (outletsQuery.isPending) {
    return (
      <div className="space-y-4" aria-label="Memuat outlet">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    )
  }

  if (outletsQuery.isError) {
    return (
      <ErrorState
        title="Outlet belum dapat dimuat"
        description="Periksa koneksi atau akses Anda, lalu coba lagi."
        action={<Button variant="outline" onClick={() => void outletsQuery.refetch()}>Coba lagi</Button>}
      />
    )
  }

  const outlets = outletsQuery.data.data
  const pagination = outletsQuery.data.meta

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="app-page-title">Outlet</h1>
          <p className="text-sm text-muted-foreground">
            Kelola lokasi operasional {activeBusiness.name}.
          </p>
        </div>
        {can('outlets.create') && !creating && !editing && (
          <Button onClick={beginCreate}>Tambah outlet</Button>
        )}
      </header>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {(creating || editing) && (
        <form
          className="space-y-4 rounded-lg border bg-card p-4 sm:p-6"
          onSubmit={(event) => {
            event.preventDefault()
            saveMutation.mutate({
              name: name.trim(),
              ...(address.trim() && { address: address.trim() }),
            })
          }}
        >
          <h2 className="font-semibold">{editing ? 'Ubah outlet' : 'Outlet baru'}</h2>
          <div className="space-y-2">
            <Label htmlFor="outlet-name">Nama outlet</Label>
            <Input id="outlet-name" required maxLength={150} value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="outlet-address">Alamat (opsional)</Label>
            <Input id="outlet-address" maxLength={255} value={address} onChange={(event) => setAddress(event.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeEditor} disabled={saveMutation.isPending}>Batal</Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Menyimpan…' : 'Simpan'}
            </Button>
          </div>
        </form>
      )}

      {outlets.length === 0 ? (
        <EmptyState
          title="Belum ada outlet"
          description="Buat outlet saat bisnis Anda siap mengelola lokasi operasional."
          action={can('outlets.create') ? <Button onClick={beginCreate}>Tambah outlet</Button> : undefined}
        />
      ) : (
        <section className="space-y-3" aria-label="Daftar outlet">
          {outlets.map((outlet) => (
            <article key={outlet.id} className="flex flex-col gap-4 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{outlet.name}</h2>
                  <StatusBadge
                    label={outlet.status === 'disabled' ? 'Nonaktif' : 'Aktif'}
                    variant={outlet.status === 'disabled' ? 'neutral' : 'success'}
                  />
                </div>
                <p className="text-sm text-muted-foreground">{outlet.address || 'Alamat belum diisi'}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {can('outlets.update') && (
                  <Button variant="outline" onClick={() => beginEdit(outlet)}>Ubah</Button>
                )}
                {outlet.status === 'disabled' && can('outlets.disable') ? (
                  <Button
                    variant="outline"
                    disabled={statusMutation.isPending}
                    onClick={() => statusMutation.mutate({ outlet, enable: true })}
                  >
                    Aktifkan
                  </Button>
                ) : outlet.status !== 'disabled' && can('outlets.disable') ? (
                  <Button
                    variant="outline"
                    disabled={statusMutation.isPending}
                    onClick={() => {
                      if (window.confirm(`Nonaktifkan ${outlet.name}? Histori tetap disimpan, tetapi outlet tidak lagi tersedia untuk operasi baru.`)) {
                        statusMutation.mutate({ outlet, enable: false })
                      }
                    }}
                  >
                    Nonaktifkan
                  </Button>
                ) : null}
              </div>
            </article>
          ))}
          <PaginationBar
            page={pagination.current_page}
            lastPage={pagination.last_page}
            total={pagination.total}
            perPage={pagination.per_page}
            noun="outlet"
            onPageChange={setPage}
          />
        </section>
      )}
    </div>
  )
}
