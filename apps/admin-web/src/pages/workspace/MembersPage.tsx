import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  LoaderCircle,
  Pencil,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router'

import { useAccess } from '@/auth/useAccess'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ApiError, api } from '@/lib/api'
import { apiErrorMessage, applyApiErrors, getFieldError, hasFieldErrors } from '@/lib/form-errors'
import { cn } from '@/lib/utils'
import { memberSchema, type MemberFormValues } from '@/lib/validation'
import type { Member, MembershipStatus, Outlet, Role, RoleCatalog } from '@/types'

const ROLE_LABELS: Record<Role, string> = {
  OWNER: 'Owner',
  MANAGER: 'Manager',
  CASHIER: 'Kasir',
}

const ASSIGNABLE_ROLES: Exclude<Role, 'OWNER'>[] = ['MANAGER', 'CASHIER']

type MemberDialogState = { mode: 'create' } | { mode: 'update'; member: Member }

export function MembersPage() {
  const access = useAccess()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [dialog, setDialog] = useState<MemberDialogState | null>(null)
  const [statusChange, setStatusChange] = useState<{
    member: Member
    status: MembershipStatus
  } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const membership = access.membership
  const canReadMembers = access.can('members.read')
  const canInvite = access.can('members.invite')
  const canUpdate = access.can('members.update')
  const canDelete = access.can('members.delete')
  const myMembershipId = membership?.id

  const outlets = useQuery({
    queryKey: ['outlets'],
    queryFn: api.outlets,
    enabled: canReadMembers,
  })

  const roles = useQuery({
    queryKey: ['roles'],
    queryFn: api.roles,
    enabled: canReadMembers,
  })

  const members = useQuery({
    queryKey: ['members'],
    queryFn: api.members,
    enabled: canReadMembers,
  })

  const updateStatus = useMutation({
    mutationFn: ({ member, status }: { member: Member; status: MembershipStatus }) =>
      api.updateMember(member.id, { status }),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['members'] })
      await queryClient.invalidateQueries({ queryKey: ['me'] })
      setStatusChange(null)
      setNotice(
        variables.status === 'ACTIVE'
          ? 'Akses anggota berhasil diaktifkan kembali.'
          : 'Akses anggota berhasil dinonaktifkan.',
      )
    },
  })

  const deleteMember = useMutation({
    mutationFn: api.deleteMember,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['members'] })
      await queryClient.invalidateQueries({ queryKey: ['me'] })
      setDeleteTarget(null)
      setNotice('Anggota berhasil dihapus permanen.')
    },
  })

  async function handleSaved(message: string) {
    setDialog(null)
    setNotice(message)
    await queryClient.invalidateQueries({ queryKey: ['members'] })
  }

  if (access.isPending) return <LoadingState label="Memuat data anggota tim..." />
  if (access.isError) {
    return (
      <ErrorState
        message="Data anggota tim belum dapat dimuat. Periksa koneksi lalu coba lagi."
        onRetry={() => void access.refetch()}
      />
    )
  }

  if (!canReadMembers) {
    return (
      <section
        className="mx-auto max-w-2xl rounded-xl border border-destructive/30 bg-destructive/5 p-5"
        role="alert"
      >
        <div className="flex items-start gap-3">
          <ShieldAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div className="space-y-2">
            <p className="text-sm">Anda tidak memiliki izin untuk mengelola anggota tim.</p>
            <p className="text-sm text-muted-foreground">
              Hubungi Owner bisnis untuk meminta akses manajemen anggota.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="mt-4 min-h-11"
          onClick={() => navigate('/outlets', { replace: true })}
        >
          Kembali ke Outlet
        </Button>
      </section>
    )
  }

  if (outlets.isPending || roles.isPending || members.isPending) {
    return <LoadingState label="Memuat data anggota tim..." />
  }

  if (outlets.isError || roles.isError || members.isError) {
    return (
      <ErrorState
        message="Data anggota tim belum dapat dimuat. Periksa koneksi lalu coba lagi."
        onRetry={() => {
          void outlets.refetch()
          void roles.refetch()
          void members.refetch()
        }}
      />
    )
  }

  const memberList = members.data
  const outletList = outlets.data
  const roleCatalog = roles.data
  const isOwner = (member: Member) => member.role === 'OWNER'
  const canActOnMember = (member: Member) => !isOwner(member) && member.id !== myMembershipId

  return (
    <section className="space-y-7">
      <header className="flex flex-col justify-between gap-5 border-b pb-7 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">Manajemen Tim</p>
          <h1 className="text-page-title tracking-tight">Anggota Tim</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Kelola employee, role preset, dan cakupan outlet masing-masing anggota. Owner tetap
            dapat mengoperasikan POS tanpa harus membuat employee.
          </p>
        </div>
        {canInvite ? (
          <Button
            type="button"
            onClick={() => setDialog({ mode: 'create' })}
            className="h-11 gap-2 px-5"
          >
            <UserPlus aria-hidden="true" className="size-4" />
            Tambah Anggota
          </Button>
        ) : null}
      </header>

      {notice ? (
        <p
          role="status"
          className="rounded-lg border border-dagana-success/20 bg-dagana-success-container px-4 py-3 text-sm text-dagana-success"
        >
          {notice}
        </p>
      ) : null}

      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                <th className="p-4 font-medium">Anggota</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Akses Outlet</th>
                <th className="p-4 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {memberList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    Belum ada anggota tim dalam Business ini.
                  </td>
                </tr>
              ) : (
                memberList.map((member) => (
                  <tr key={member.id} className="align-top">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span
                          className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-foreground"
                          aria-hidden="true"
                        >
                          <Users className="size-4.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{member.user.name}</p>
                          <p className="truncate text-sm text-muted-foreground">
                            {member.user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <RoleBadge role={member.role} />
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={member.status === 'ACTIVE' ? 'secondary' : 'destructive'}
                        className={cn(
                          'rounded-full',
                          member.status === 'ACTIVE' &&
                            'bg-dagana-success-container text-dagana-success',
                        )}
                      >
                        {member.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </td>
                    <td className="max-w-56 p-4">
                      {isOwner(member) ? (
                        <span className="text-sm text-muted-foreground">Semua outlet</span>
                      ) : member.outlets.length === 0 ? (
                        <span className="text-sm text-muted-foreground">Tanpa akses outlet</span>
                      ) : (
                        <span className="text-sm">
                          {member.outlets.map((outlet) => outlet.name).join(', ')}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        {canActOnMember(member) && canUpdate ? (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setDialog({ mode: 'update', member })}
                            >
                              <Pencil aria-hidden="true" className="size-4" />
                              Ubah
                            </Button>
                            <Button
                              type="button"
                              variant={member.status === 'ACTIVE' ? 'destructive' : 'outline'}
                              size="sm"
                              onClick={() =>
                                setStatusChange({
                                  member,
                                  status: member.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                                })
                              }
                            >
                              {member.status === 'ACTIVE' ? 'Nonaktifkan' : 'Aktifkan'}
                            </Button>
                          </>
                        ) : null}
                        {canActOnMember(member) && canDelete ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            aria-label={`Hapus ${member.user.name}`}
                            onClick={() => setDeleteTarget(member)}
                          >
                            <Trash2 aria-hidden="true" className="size-4" />
                            Hapus
                          </Button>
                        ) : null}
                        {!canActOnMember(member) ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <RoleAccessSummary roles={roleCatalog} />

      {dialog ? (
        <MemberDialog
          key={dialog.mode === 'update' ? `update-${dialog.member.id}` : 'create'}
          mode={dialog.mode}
          member={dialog.mode === 'update' ? dialog.member : undefined}
          outlets={outletList}
          onClose={() => setDialog(null)}
          onSaved={handleSaved}
        />
      ) : null}

      <AlertDialog
        open={Boolean(statusChange)}
        onOpenChange={(open) => !open && setStatusChange(null)}
      >
        <AlertDialogContent>
          <AlertDialogTitle>
            {statusChange?.status === 'ACTIVE'
              ? 'Aktifkan kembali anggota?'
              : 'Nonaktifkan akses anggota?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {statusChange?.status === 'ACTIVE' ? (
              <>
                Akses <strong>{statusChange.member.user.name}</strong> akan diaktifkan kembali
                dengan role dan cakupan outlet yang tersimpan.
              </>
            ) : (
              <>
                Akses <strong>{statusChange?.member.user.name}</strong> akan dicabut dan token
                aktifnya dihentikan. Data historis tetap tersimpan dan anggota dapat diaktifkan
                kembali.
              </>
            )}
          </AlertDialogDescription>
          {updateStatus.isError ? (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3.5 py-3 text-sm text-destructive"
            >
              {updateStatus.error instanceof ApiError && updateStatus.error.status === 403
                ? 'Anda tidak memiliki izin untuk mengubah status anggota ini.'
                : updateStatus.error.message}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button type="button" variant="outline" className="min-h-11 px-5">
                Batal
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                variant={statusChange?.status === 'ACTIVE' ? 'default' : 'destructive'}
                className="min-h-11 px-5"
                disabled={updateStatus.isPending}
                onClick={(event) => {
                  event.preventDefault()
                  if (statusChange) updateStatus.mutate(statusChange)
                }}
              >
                {updateStatus.isPending
                  ? 'Memproses...'
                  : statusChange?.status === 'ACTIVE'
                    ? 'Ya, aktifkan'
                    : 'Ya, nonaktifkan'}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
            deleteMember.reset()
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Hapus anggota permanen?</AlertDialogTitle>
          <AlertDialogDescription>
            Anggota <strong>{deleteTarget?.user.name}</strong> akan dihapus permanen beserta akses
            outlet dan token aktifnya. Riwayat transaksi tetap menyimpan atribusi pengguna.
          </AlertDialogDescription>
          {deleteMember.isError ? (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3.5 py-3 text-sm text-destructive"
            >
              {deleteMember.error instanceof ApiError && deleteMember.error.status === 403
                ? 'Anda tidak memiliki izin untuk menghapus anggota ini.'
                : deleteMember.error.message}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button type="button" variant="outline" className="min-h-11 px-5">
                Batal
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                variant="destructive"
                className="min-h-11 px-5"
                disabled={deleteMember.isPending}
                onClick={(event) => {
                  event.preventDefault()
                  if (deleteTarget) deleteMember.mutate(deleteTarget.id)
                }}
              >
                {deleteMember.isPending ? 'Menghapus...' : 'Hapus permanen'}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}

function RoleBadge({ role }: { role: Role }) {
  const tone =
    role === 'OWNER'
      ? 'border-dagana-primary bg-dagana-primary-soft text-dagana-primary'
      : role === 'MANAGER'
        ? 'border-dagana-warning bg-dagana-warning-container text-dagana-warning'
        : 'border-dagana-info bg-dagana-info-container text-dagana-info'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        tone,
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  )
}

function RoleAccessSummary({ roles }: { roles: RoleCatalog[] }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck aria-hidden="true" className="size-5 text-primary" />
        <div>
          <h2 className="text-section-title">Ringkasan role &amp; hak akses</h2>
          <p className="text-sm text-muted-foreground">
            Hak akses berikut berasal dari backend. Role adalah preset, bukan kustomisasi bebas.
          </p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {roles.map((role) => (
          <article key={role.role} className="rounded-xl border bg-card p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <RoleBadge role={role.role} />
              <span className="text-xs text-muted-foreground">{role.permissions.length} izin</span>
            </div>
            <ul className="flex flex-wrap gap-1.5">
              {role.permissions.map((permission) => (
                <li
                  key={permission}
                  className="rounded-md bg-muted px-2 py-1 font-mono text-[0.6875rem] text-muted-foreground"
                >
                  {permission === '*' ? 'semua izin' : permission}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}

type MemberDialogProps = {
  mode: 'create' | 'update'
  member?: Member
  outlets: Outlet[]
  onClose: () => void
  onSaved: (message: string) => Promise<void>
}

function MemberDialog({ mode, member, outlets, onClose, onSaved }: MemberDialogProps) {
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
    },
    mode: 'onBlur',
  })
  const outletIds = useWatch({ control, name: 'outlet_ids' }) ?? []
  const outletError = getFieldError(errors, 'outlet_ids.0') ?? getFieldError(errors, 'outlet_ids')
  const roleError = getFieldError(errors, 'role')

  const mutation = useMutation({
    mutationFn: (values: MemberFormValues) =>
      isCreate
        ? api.createMember({
            name: values.name,
            email: values.email,
            password: values.password,
            role: values.role,
            outlet_ids: values.outlet_ids,
          })
        : api.updateMember(member!.id, {
            role: values.role,
            outlet_ids: values.outlet_ids,
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
