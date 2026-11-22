import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MapPin, Pencil, Plus, Store, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { useAccess } from '@/auth/useAccess'
import { ErrorState, LoadingState } from '@/components/PageFeedback'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { formatAddress } from '@/lib/address'
import { api } from '@/lib/api'
import { apiErrorMessage } from '@/lib/form-errors'
import type { Outlet } from '@/types'

import { BusinessNameCard } from './BusinessNameCard'
import { OutletDialog } from './OutletDialog'

export function OutletsPage() {
  const access = useAccess()
  const queryClient = useQueryClient()
  const businessId = access.membership?.business.id ?? null
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Outlet | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const business = useQuery({
    queryKey: ['business', businessId],
    queryFn: () => api.business(businessId!),
    enabled: Boolean(businessId),
  })
  const outlets = useQuery({
    queryKey: ['outlets'],
    queryFn: api.outlets,
  })
  const deleteOutlet = useMutation({
    mutationFn: api.deleteOutlet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outlets'] })
      setDeleteTarget(null)
      setNotice('Outlet berhasil dihapus.')
    },
  })

  if (business.isPending || outlets.isPending) return <LoadingState label="Memuat outlet..." />

  if (business.isError || outlets.isError) {
    return (
      <ErrorState
        message="Data outlet belum dapat dimuat. Periksa koneksi lalu coba lagi."
        onRetry={() => {
          void business.refetch()
          void outlets.refetch()
        }}
      />
    )
  }

  const canDelete = access.can('outlets.delete') && outlets.data.length > 1

  function openCreate() {
    setEditingOutlet(null)
    setDialogOpen(true)
  }

  function openEdit(outlet: Outlet) {
    setEditingOutlet(outlet)
    setDialogOpen(true)
  }

  function handleSaved(message: string) {
    setDialogOpen(false)
    setEditingOutlet(null)
    setNotice(message)
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Pengaturan</p>
          <h1 className="mt-2 text-page-title tracking-tight">Outlet</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Kelola outlet dan alamat operasionalnya. Setiap business wajib memiliki minimal satu
            outlet.
          </p>
        </div>
        {access.can('outlets.create') ? (
          <Button type="button" className="gap-2" onClick={openCreate}>
            <Plus aria-hidden="true" className="size-4" />
            Tambah outlet
          </Button>
        ) : null}
      </div>

      {notice ? (
        <p
          role="status"
          className="rounded-lg border border-dagana-success/20 bg-dagana-success-container px-4 py-3 text-sm text-dagana-success"
        >
          {notice}
        </p>
      ) : null}

      <BusinessNameCard
        businessId={businessId}
        initialName={business.data.name}
        canEdit={access.can('business.update')}
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Daftar outlet</h2>
          <span className="text-sm text-muted-foreground">{outlets.data.length} outlet</span>
        </div>

        {outlets.data.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card p-8 text-center">
            <Store aria-hidden="true" className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              Belum ada outlet. Tambahkan outlet pertama untuk mulai beroperasi.
            </p>
          </div>
        ) : (
          <ul className="grid gap-3">
            {outlets.data.map((outlet) => {
              const address = formatAddress(outlet)

              return (
                <li
                  key={outlet.id}
                  className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-dagana-primary-soft text-dagana-primary">
                      <Store aria-hidden="true" className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold">{outlet.name}</p>
                      {outlet.phone ? (
                        <p className="text-sm text-muted-foreground">{outlet.phone}</p>
                      ) : null}
                      <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
                        <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                        <span>{address || 'Alamat belum dilengkapi.'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 sm:justify-end">
                    {access.can('outlets.update') ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        aria-label={`Ubah ${outlet.name}`}
                        onClick={() => openEdit(outlet)}
                      >
                        <Pencil aria-hidden="true" className="size-4" />
                        Ubah
                      </Button>
                    ) : null}
                    {access.can('outlets.delete') ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label={`Hapus ${outlet.name}`}
                        title={
                          canDelete
                            ? undefined
                            : 'Minimal satu outlet harus tetap tersedia untuk business ini.'
                        }
                        disabled={!canDelete}
                        onClick={() => setDeleteTarget(outlet)}
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
                        Hapus
                      </Button>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {dialogOpen ? (
        <OutletDialog
          outlet={editingOutlet}
          onClose={() => {
            setDialogOpen(false)
            setEditingOutlet(null)
          }}
          onSaved={handleSaved}
        />
      ) : null}

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
            deleteOutlet.reset()
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Hapus outlet?</AlertDialogTitle>
          <AlertDialogDescription>
            Outlet <span className="font-medium text-foreground">{deleteTarget?.name}</span> akan
            dihapus permanen. Akses pengguna ke outlet ini juga ikut dihapus.
          </AlertDialogDescription>

          {deleteOutlet.isError ? (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {apiErrorMessage(deleteOutlet.error, 'Outlet belum dapat dihapus. Coba lagi.')}
            </p>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button type="button" variant="outline">
                Batal
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                variant="destructive"
                disabled={deleteOutlet.isPending}
                onClick={(event) => {
                  event.preventDefault()
                  if (deleteTarget) deleteOutlet.mutate(deleteTarget.id)
                }}
              >
                {deleteOutlet.isPending ? 'Menghapus...' : 'Hapus permanen'}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
