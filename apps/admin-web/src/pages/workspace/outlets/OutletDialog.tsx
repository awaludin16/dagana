import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { LoaderCircle } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'

import { AddressFields } from '@/components/AddressFields'
import { FormField } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { normalizeAddress } from '@/lib/address'
import { api } from '@/lib/api'
import { apiErrorMessage, applyApiErrors, getFieldError, hasFieldErrors } from '@/lib/form-errors'
import { outletSchema, type OutletFormValues } from '@/lib/validation'
import { emptyAddress, type Outlet } from '@/types'

export function OutletDialog({
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
        phone: values.phone.trim(),
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
              label="Nomor telepon"
              required
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
