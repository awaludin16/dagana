import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, LoaderCircle, MapPin, Pencil, Plus, Store, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { useAccess } from '@/auth/useAccess'
import { AddressFields } from '@/components/AddressFields'
import { FormField } from '@/components/FormField'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatAddress, normalizeAddress } from '@/lib/address'
import { api } from '@/lib/api'
import { apiErrorMessage, applyApiErrors, getFieldError, hasFieldErrors } from '@/lib/form-errors'
import {
  businessNameSchema,
  outletSchema,
  type BusinessNameFormValues,
  type OutletFormValues,
} from '@/lib/validation'
import { emptyAddress, type Outlet } from '@/types'

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

function BusinessNameCard({
  businessId,
  initialName,
  canEdit,
}: {
  businessId: number | null
  initialName: string
  canEdit: boolean
}) {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<BusinessNameFormValues>({
    resolver: zodResolver(businessNameSchema),
    defaultValues: { name: initialName },
    mode: 'onBlur',
  })

  const updateBusiness = useMutation({
    mutationFn: (values: BusinessNameFormValues) =>
      api.updateBusiness(businessId!, { name: values.name }),
    onSuccess: (business) => {
      queryClient.setQueryData(['business', businessId], business)
      reset({ name: business.name })
    },
  })

  const submit = handleSubmit((values) => {
    updateBusiness.mutate(values, {
      onError: (error) => {
        applyApiErrors(error, setError)
      },
    })
  })

  return (
    <form
      onSubmit={submit}
      noValidate
      aria-busy={updateBusiness.isPending}
      className="rounded-xl border bg-card p-5 sm:p-6"
    >
      <div className="mb-4 flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-dagana-primary-soft text-dagana-primary">
          <Building2 aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">Nama business</h2>
          <p className="text-sm text-muted-foreground">
            Nama ini dipakai di seluruh aplikasi. Business tidak menyimpan alamat atau telepon.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <FormField
          {...register('name')}
          id="business-name"
          label="Nama business"
          maxLength={255}
          disabled={!canEdit || updateBusiness.isPending}
          error={getFieldError(errors, 'name')}
          containerClassName="flex-1"
        />
        {canEdit ? (
          <Button type="submit" variant="outline" disabled={updateBusiness.isPending || !isDirty}>
            {updateBusiness.isPending ? 'Menyimpan...' : 'Simpan nama'}
          </Button>
        ) : null}
      </div>

      {updateBusiness.isSuccess ? (
        <p className="mt-3 text-sm text-muted-foreground" role="status">
          Nama business tersimpan.
        </p>
      ) : null}
      {updateBusiness.isError && !hasFieldErrors(updateBusiness.error) ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {apiErrorMessage(updateBusiness.error, 'Nama business belum dapat disimpan. Coba lagi.')}
        </p>
      ) : null}
    </form>
  )
}

function OutletDialog({
  outlet,
  onClose,
  onSaved,
}: {
  outlet: Outlet | null
  onClose: () => void
  onSaved: (message: string) => void
}) {
  const queryClient = useQueryClient()
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<OutletFormValues>({
    resolver: zodResolver(outletSchema),
    defaultValues: {
      name: outlet?.name ?? '',
      phone: outlet?.phone ?? '',
      address: { ...(outlet?.address ?? emptyAddress) },
    },
    mode: 'onBlur',
  })

  const save = useMutation({
    mutationFn: (values: OutletFormValues) => {
      const input = {
        name: values.name,
        phone: values.phone?.trim() || null,
        address: normalizeAddress(values.address),
      }

      return outlet ? api.updateOutlet(outlet.id, input) : api.createOutlet(input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outlets'] })
      onSaved(outlet ? 'Perubahan outlet disimpan.' : 'Outlet baru berhasil ditambahkan.')
    },
  })

  const submit = handleSubmit((values) => {
    save.mutate(values, {
      onError: (error) => {
        applyApiErrors(error, setError)
      },
    })
  })

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{outlet ? 'Ubah outlet' : 'Tambah outlet'}</DialogTitle>
          <DialogDescription>
            {outlet
              ? 'Perbarui nama, telepon, atau alamat outlet ini.'
              : 'Outlet baru akan langsung terhubung ke business Anda.'}
          </DialogDescription>
        </DialogHeader>

        {save.isError && !hasFieldErrors(save.error) ? (
          <p role="alert" className="mb-4 text-sm text-destructive">
            {apiErrorMessage(save.error, 'Outlet belum dapat disimpan. Periksa kembali data Anda.')}
          </p>
        ) : null}

        <form onSubmit={submit} noValidate aria-busy={save.isPending} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              {...register('name')}
              id="outlet-name"
              label="Nama outlet"
              required
              maxLength={255}
              placeholder="Contoh: Outlet Utama"
              containerClassName="sm:col-span-2"
              disabled={save.isPending}
              error={getFieldError(errors, 'name')}
            />
            <FormField
              {...register('phone')}
              id="outlet-phone"
              label="Nomor telepon (opsional)"
              type="tel"
              autoComplete="tel"
              maxLength={30}
              placeholder="08xxxxxxxxxx"
              disabled={save.isPending}
              error={getFieldError(errors, 'phone')}
            />
          </div>

          <Controller
            control={control}
            name="address"
            render={({ field }) => (
              <AddressFields
                idPrefix={outlet ? `outlet-${outlet.id}` : 'outlet-new'}
                value={field.value}
                errors={errors}
                disabled={save.isPending}
                onChange={field.onChange}
              />
            )}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={save.isPending}>
              Batal
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="size-4 animate-spin motion-reduce:animate-none"
                />
              ) : null}
              {save.isPending ? 'Menyimpan...' : outlet ? 'Simpan perubahan' : 'Tambah outlet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
