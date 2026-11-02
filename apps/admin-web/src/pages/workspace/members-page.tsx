import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, ShieldAlert, ShieldCheck, UserPlus, Users } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'

import { useSession } from '@/auth/session-context'
import { FormField } from '@/components/form-field'
import { ErrorState, LoadingState } from '@/components/page-feedback'
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
import { cn } from '@/lib/utils'
import type { Member, Outlet, Role, RoleCatalog } from '@/types'

const ROLE_LABELS: Record<Role, string> = {
  OWNER: 'Owner',
  MANAGER: 'Manager',
  CASHIER: 'Kasir',
}

const ASSIGNABLE_ROLES: Exclude<Role, 'OWNER'>[] = ['MANAGER', 'CASHIER']

type MemberDialogState = { mode: 'create' } | { mode: 'update'; member: Member }

export function MembersPage() {
  const { token } = useSession()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [dialog, setDialog] = useState<MemberDialogState | null>(null)
  const [removing, setRemoving] = useState<Member | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const me = useQuery({
    queryKey: ['me', token],
    queryFn: () => api.profile(token!),
    enabled: Boolean(token),
  })

  const membership = me.data?.membership
  const permissions = membership?.permissions ?? []
  const canReadMembers = permissions.includes('members.read')
  const canInvite = permissions.includes('members.invite')
  const canUpdate = permissions.includes('members.update')
  const canRemove = permissions.includes('members.remove')
  const myMembershipId = membership?.id

  const outlets = useQuery({
    queryKey: ['outlets', token],
    queryFn: () => api.outlets(token!),
    enabled: Boolean(token) && canReadMembers,
  })

  const roles = useQuery({
    queryKey: ['roles', token],
    queryFn: () => api.roles(token!),
    enabled: Boolean(token) && canReadMembers,
  })

  const members = useQuery({
    queryKey: ['members', token],
    queryFn: () => api.members(token!),
    enabled: Boolean(token) && canReadMembers,
  })

  const removeMember = useMutation({
    mutationFn: (id: number) => api.removeMember(token!, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['members', token] })
      await queryClient.invalidateQueries({ queryKey: ['me', token] })
      setRemoving(null)
      setNotice('Akses anggota berhasil dinonaktifkan.')
    },
  })

  async function handleSaved(message: string) {
    setDialog(null)
    setNotice(message)
    await queryClient.invalidateQueries({ queryKey: ['members', token] })
  }

  if (me.isPending) return <LoadingState label="Memuat data anggota tim..." />
  if (me.isError) {
    return (
      <ErrorState
        message="Data anggota tim belum dapat dimuat. Periksa koneksi lalu coba lagi."
        onRetry={() => void me.refetch()}
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
          onClick={() => navigate('/business', { replace: true })}
        >
          Kembali ke Business
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
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setDialog({ mode: 'update', member })}
                          >
                            <Pencil aria-hidden="true" className="size-4" />
                            Ubah
                          </Button>
                        ) : null}
                        {canActOnMember(member) && canRemove ? (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => setRemoving(member)}
                          >
                            Nonaktifkan
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

      <AlertDialog open={Boolean(removing)} onOpenChange={(open) => !open && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Nonaktifkan akses anggota?</AlertDialogTitle>
          <AlertDialogDescription>
            Akses <strong>{removing?.user.name}</strong> akan dicabut dan seluruh cakupan outlet
            dihapus. Data historis tetap tersimpan.
          </AlertDialogDescription>
          {removeMember.isError ? (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3.5 py-3 text-sm text-destructive"
            >
              {removeMember.error instanceof ApiError && removeMember.error.status === 403
                ? 'Anda tidak memiliki izin untuk menonaktifkan anggota ini.'
                : removeMember.error.message}
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
                disabled={removeMember.isPending}
                onClick={(event) => {
                  event.preventDefault()
                  if (removing) removeMember.mutate(removing.id)
                }}
              >
                {removeMember.isPending ? 'Memproses...' : 'Ya, nonaktifkan'}
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
  const { token } = useSession()
  const isCreate = mode === 'create'
  const [form, setForm] = useState({
    name: member?.user.name ?? '',
    email: member?.user.email ?? '',
    password: '',
    role: (member?.role === 'MANAGER' ? 'MANAGER' : 'CASHIER') as Exclude<Role, 'OWNER'>,
    outletIds: member?.outlets.map((outlet) => outlet.id) ?? [],
  })
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (input: Parameters<typeof api.createMember>[1]) =>
      isCreate
        ? api.createMember(token!, input)
        : api.updateMember(token!, member!.id, {
            role: input.role,
            outlet_ids: input.outlet_ids,
          }),
    onSuccess: async () => {
      await onSaved(isCreate ? 'Anggota baru berhasil ditambahkan.' : 'Perubahan anggota disimpan.')
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        setErrors(error.errors)
        setErrorMessage(
          error.status === 403
            ? 'Anda tidak memiliki izin untuk melakukan tindakan ini.'
            : error.message,
        )
      } else if (error instanceof Error) {
        setErrorMessage(error.message)
      }
    },
  })

  function toggleOutlet(id: number) {
    setForm((current) => ({
      ...current,
      outletIds: current.outletIds.includes(id)
        ? current.outletIds.filter((outletId) => outletId !== id)
        : [...current.outletIds, id],
    }))
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrors({})
    setErrorMessage(null)

    if (isCreate && !form.name.trim()) {
      setErrors({ name: ['Nama wajib diisi.'] })
      return
    }
    if (isCreate && !form.email.trim()) {
      setErrors({ email: ['Email wajib diisi.'] })
      return
    }
    if (isCreate && form.password.length < 8) {
      setErrors({ password: ['Kata sandi minimal 8 karakter.'] })
      return
    }
    if (form.outletIds.length === 0) {
      setErrors({ outlet_ids: ['Pilih minimal satu outlet.'] })
      return
    }

    mutation.mutate({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      role: form.role,
      outlet_ids: form.outletIds,
    })
  }

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

        {errorMessage ? (
          <p
            role="alert"
            className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3.5 py-3 text-sm text-destructive"
          >
            {errorMessage}
          </p>
        ) : null}

        <form className="space-y-5" onSubmit={submit}>
          {isCreate ? (
            <>
              <FormField
                name="name"
                label="Nama lengkap"
                value={form.name}
                required
                maxLength={255}
                error={errors.name?.[0]}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
              />
              <FormField
                name="email"
                label="Email"
                type="email"
                autoComplete="email"
                value={form.email}
                required
                maxLength={255}
                error={errors.email?.[0]}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
              />
              <FormField
                name="password"
                label="Kata sandi awal"
                type="password"
                autoComplete="new-password"
                value={form.password}
                required
                minLength={8}
                hint="Minimal 8 karakter. Sampaikan kepada anggota untuk masuk pertama kali."
                error={errors.password?.[0]}
                onChange={(event) =>
                  setForm((current) => ({ ...current, password: event.target.value }))
                }
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
              id="member-role"
              value={form.role}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  role: event.target.value as Exclude<Role, 'OWNER'>,
                }))
              }
              className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none transition focus-visible:ring-[3px] focus-visible:ring-ring/40"
            >
              {ASSIGNABLE_ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
            {errors.role ? (
              <p role="alert" className="text-sm text-destructive">
                {errors.role[0]}
              </p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              Hanya role preset Owner, Manager, dan Kasir. Owner ditetapkan saat Business dibuat.
            </p>
          </div>

          <div className="space-y-1.5">
            <span className="text-sm font-medium">Akses outlet</span>
            <div className="grid gap-2 sm:grid-cols-2">
              {outlets.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada outlet.</p>
              ) : (
                outlets.map((outlet) => (
                  <label
                    key={outlet.id}
                    className={cn(
                      'flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-sm transition',
                      form.outletIds.includes(outlet.id)
                        ? 'border-dagana-primary bg-dagana-primary-soft'
                        : 'border-input bg-background hover:bg-muted/50',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={form.outletIds.includes(outlet.id)}
                      onChange={() => toggleOutlet(outlet.id)}
                      className="size-4 rounded border-input text-dagana-primary focus:ring-ring"
                    />
                    {outlet.name}
                  </label>
                ))
              )}
            </div>
            {errors.outlet_ids ? (
              <p role="alert" className="text-sm text-destructive">
                {errors.outlet_ids[0]}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="min-h-11 px-5">
              Batal
            </Button>
            <Button type="submit" className="min-h-11 px-5" disabled={mutation.isPending}>
              {mutation.isPending ? 'Memproses...' : isCreate ? 'Buat Anggota' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
