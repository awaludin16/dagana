import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { LoaderCircle } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'

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
import { api } from '@/lib/api'
import { apiErrorMessage, applyApiErrors, getFieldError, hasFieldErrors } from '@/lib/form-errors'
import { permissionLabel, PERMISSION_GROUPS } from '@/lib/permission-labels'
import { cn } from '@/lib/utils'
import { memberSchema, type MemberFormValues } from '@/lib/validation'
import type { Member, Outlet, RoleCatalog } from '@/types'

import { ASSIGNABLE_ROLES, ROLE_LABELS } from './constants'
import { PermissionToggle } from './PermissionToggle'

type MemberDialogProps = {
  mode: 'create' | 'update'
  member?: Member
  outlets: Outlet[]
  roles: RoleCatalog[]
  isOwnerActor: boolean
  onClose: () => void
  onSaved: (message: string) => Promise<void>
}

export function MemberDialog({
  mode,
  member,
  outlets,
  roles,
  isOwnerActor,
  onClose,
  onSaved,
}: MemberDialogProps) {
  const isCreate = mode === 'create'
  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      mode: isCreate ? 'create' : 'update',
      name: member?.user.name ?? '',
      email: member?.user.email ?? '',
      password: '',
      role: member?.role === 'MANAGER' ? 'MANAGER' : 'CASHIER',
      outlet_ids: member?.outlets.map((outlet) => outlet.id) ?? [],
      extra_permissions: member?.extra_permissions ?? [],
    },
    mode: 'onBlur',
  })
  const outletIds = useWatch({ control, name: 'outlet_ids' }) ?? []
  const outletError = getFieldError(errors, 'outlet_ids.0') ?? getFieldError(errors, 'outlet_ids')
  const roleError = getFieldError(errors, 'role')
  const selectedRole = useWatch({ control, name: 'role' })
  const extraPermissions = useWatch({ control, name: 'extra_permissions' }) ?? []
  const presetPermissions = roles.find((preset) => preset.role === selectedRole)?.permissions ?? []
  const permissionError =
    getFieldError(errors, 'extra_permissions.0') ?? getFieldError(errors, 'extra_permissions')

  const mutation = useMutation({
    mutationFn: (values: MemberFormValues) =>
      isCreate
        ? api.createMember({
            name: values.name,
            email: values.email,
            password: values.password,
            role: values.role,
            outlet_ids: values.outlet_ids,
            extra_permissions: values.extra_permissions,
          })
        : api.updateMember(member!.id, {
            role: values.role,
            outlet_ids: values.outlet_ids,
            extra_permissions: values.extra_permissions,
          }),
    onSuccess: async () => {
      await onSaved(isCreate ? 'Anggota baru berhasil ditambahkan.' : 'Perubahan anggota disimpan.')
    },
  })

  function toggleOutlet(id: number) {
    const next = outletIds.includes(id)
      ? outletIds.filter((outletId) => outletId !== id)
      : [...outletIds, id]

    setValue('outlet_ids', next, { shouldDirty: true, shouldValidate: true })
  }

  function togglePermission(permission: string) {
    const next = extraPermissions.includes(permission)
      ? extraPermissions.filter((item) => item !== permission)
      : [...extraPermissions, permission]

    setValue('extra_permissions', next, { shouldDirty: true })
  }

  const submit = handleSubmit((values) => {
    mutation.mutate(values, {
      onError: (error) => {
        applyApiErrors(error, setError)
      },
    })
  })

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isCreate ? 'Tambah anggota tim' : 'Ubah role & akses outlet'}</DialogTitle>
          <DialogDescription>
            {isCreate
              ? 'Buat akun employee baru, tentukan role preset, dan pilih outlet yang dapat diakses.'
              : `Perbarui role preset dan cakupan outlet untuk ${member?.user.name}.`}
          </DialogDescription>
        </DialogHeader>

        {mutation.isError && !hasFieldErrors(mutation.error) ? (
          <p
            role="alert"
            className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3.5 py-3 text-sm text-destructive"
          >
            {apiErrorMessage(mutation.error, 'Perubahan anggota belum dapat disimpan. Coba lagi.')}
          </p>
        ) : null}

        <form className="space-y-5" onSubmit={submit} noValidate aria-busy={mutation.isPending}>
          {isCreate ? (
            <>
              <FormField
                {...register('name')}
                id="member-name"
                label="Nama lengkap"
                required
                maxLength={255}
                disabled={mutation.isPending}
                error={getFieldError(errors, 'name')}
              />
              <FormField
                {...register('email')}
                id="member-email"
                label="Email"
                type="email"
                autoComplete="email"
                required
                maxLength={255}
                disabled={mutation.isPending}
                error={getFieldError(errors, 'email')}
              />
              <FormField
                {...register('password')}
                id="member-password"
                label="Kata sandi awal"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                disabled={mutation.isPending}
                hint="Minimal 8 karakter. Sampaikan kepada anggota untuk masuk pertama kali."
                error={getFieldError(errors, 'password')}
              />
            </>
          ) : (
            <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">
              <p className="font-medium">{member?.user.name}</p>
              <p className="text-muted-foreground">{member?.user.email}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="member-role" className="text-sm font-medium">
              Role preset
            </label>
            <select
              {...register('role')}
              id="member-role"
              disabled={mutation.isPending}
              aria-invalid={Boolean(roleError)}
              aria-describedby={roleError ? 'member-role-message' : undefined}
              className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none transition focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:bg-muted/50 disabled:text-muted-foreground"
            >
              {ASSIGNABLE_ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
            {roleError ? (
              <p id="member-role-message" role="alert" className="text-sm text-destructive">
                {roleError}
              </p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              Hanya role preset Owner, Manager, dan Kasir. Owner ditetapkan saat Business dibuat.
            </p>
          </div>

          <div className="space-y-1.5">
            <span className="text-sm font-medium">Akses outlet</span>
            <div
              className="grid gap-2 sm:grid-cols-2"
              aria-describedby={outletError ? 'member-outlets-message' : undefined}
            >
              {outlets.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada outlet.</p>
              ) : (
                outlets.map((outlet) => (
                  <label
                    key={outlet.id}
                    className={cn(
                      'flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-sm transition',
                      outletIds.includes(outlet.id)
                        ? 'border-dagana-primary bg-dagana-primary-soft'
                        : 'border-input bg-background hover:bg-muted/50',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={outletIds.includes(outlet.id)}
                      disabled={mutation.isPending}
                      onChange={() => toggleOutlet(outlet.id)}
                      className="size-4 rounded border-input text-dagana-primary focus:ring-ring"
                    />
                    {outlet.name}
                  </label>
                ))
              )}
            </div>
            {outletError ? (
              <p id="member-outlets-message" role="alert" className="text-sm text-destructive">
                {outletError}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium">Izin tambahan</span>
              <span className="text-xs text-muted-foreground">
                {extraPermissions.length} izin tambahan
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Izin bawaan role {ROLE_LABELS[selectedRole]} aktif otomatis dan tidak dapat dicabut
              (ditampilkan terkunci).{' '}
              {isOwnerActor
                ? 'Tekan tombol untuk memberikan atau mencabut izin lain sesuai kebutuhan anggota ini.'
                : 'Hanya Owner yang dapat mengatur izin tambahan.'}
            </p>
            <div className="max-h-72 space-y-3 overflow-y-auto rounded-lg border bg-muted/30 p-3">
              {PERMISSION_GROUPS.map((group) => (
                <fieldset key={group.title} className="space-y-1.5" disabled={mutation.isPending}>
                  <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.title}
                  </legend>
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {group.items.map((permission) => {
                      const isPreset = presetPermissions.includes(permission)
                      const checked = isPreset || extraPermissions.includes(permission)

                      return (
                        <PermissionToggle
                          key={permission}
                          label={permissionLabel(permission)}
                          checked={checked}
                          locked={isPreset}
                          disabled={mutation.isPending || !isOwnerActor}
                          onToggle={() => togglePermission(permission)}
                        />
                      )
                    })}
                  </div>
                </fieldset>
              ))}
            </div>
            {permissionError ? (
              <p role="alert" className="text-sm text-destructive">
                {permissionError}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="min-h-11 px-5">
              Batal
            </Button>
            <Button type="submit" className="min-h-11 px-5" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="size-4 animate-spin motion-reduce:animate-none"
                />
              ) : null}
              {mutation.isPending ? 'Memproses...' : isCreate ? 'Buat Anggota' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
