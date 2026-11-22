import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  EllipsisVertical,
  Pencil,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'

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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ApiError, api } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { Member, MembershipStatus } from '@/types'

import { MemberDialog } from './MemberDialog'
import { RoleAccessSummary } from './RoleAccessSummary'
import { RoleBadge } from './RoleBadge'

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

      <Table className="min-w-[44rem]">
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="p-4">Anggota</TableHead>
            <TableHead className="p-4">Role</TableHead>
            <TableHead className="p-4">Status</TableHead>
            <TableHead className="p-4">Akses Outlet</TableHead>
            <TableHead className="p-4">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {memberList.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="p-8 text-center text-muted-foreground">
                Belum ada anggota tim dalam Business ini.
              </TableCell>
            </TableRow>
          ) : (
            memberList.map((member) => (
              <TableRow key={member.id} className="align-top">
                <TableCell className="p-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-foreground"
                      aria-hidden="true"
                    >
                      <Users className="size-4.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{member.user.name}</p>
                      <p className="truncate text-sm text-muted-foreground">{member.user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="p-4">
                  <RoleBadge role={member.role} />
                </TableCell>
                <TableCell className="p-4">
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
                </TableCell>
                <TableCell className="block max-w-56 p-4">
                  {isOwner(member) ? (
                    <span className="text-sm text-muted-foreground">Semua outlet</span>
                  ) : member.outlets.length === 0 ? (
                    <span className="text-sm text-muted-foreground">Tanpa akses outlet</span>
                  ) : (
                    <span className="text-sm">
                      {member.outlets.map((outlet) => outlet.name).join(', ')}
                    </span>
                  )}
                </TableCell>
                <TableCell className="p-4">
                  <div className="flex justify-start gap-2">
                    {canActOnMember(member) ? (
                      <>
                        {canUpdate ? (
                          <Button
                            type="button"
                            variant="original"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground"
                            aria-label={`Ubah ${member.user.name}`}
                            onClick={() => setDialog({ mode: 'update', member })}
                          >
                            <Pencil aria-hidden="true" />
                          </Button>
                        ) : null}
                        {canUpdate || canDelete ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="original"
                                size="icon"
                                className="text-muted-foreground hover:text-foreground"
                                aria-label={`Aksi lain untuk ${member.user.name}`}
                              >
                                <EllipsisVertical aria-hidden="true" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canUpdate ? (
                                <DropdownMenuItem
                                  onSelect={() =>
                                    setStatusChange({
                                      member,
                                      status: member.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                                    })
                                  }
                                >
                                  {member.status === 'ACTIVE' ? (
                                    <>
                                      <ShieldAlert className="text-destructive" />
                                      Nonaktifkan akses
                                    </>
                                  ) : (
                                    <>
                                      <ShieldCheck />
                                      Aktifkan kembali
                                    </>
                                  )}
                                </DropdownMenuItem>
                              ) : null}
                              {canUpdate && canDelete ? <DropdownMenuSeparator /> : null}
                              {canDelete ? (
                                <DropdownMenuItem
                                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                  onSelect={() => setDeleteTarget(member)}
                                >
                                  <Trash2 />
                                  Hapus permanen
                                </DropdownMenuItem>
                              ) : null}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : null}
                      </>
                    ) : (
                      <span className="text-xs mx-auto text-muted-foreground">—</span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <RoleAccessSummary roles={roleCatalog} />

      {dialog ? (
        <MemberDialog
          key={dialog.mode === 'update' ? `update-${dialog.member.id}` : 'create'}
          mode={dialog.mode}
          member={dialog.mode === 'update' ? dialog.member : undefined}
          outlets={outletList}
          roles={roleCatalog}
          isOwnerActor={membership?.role === 'OWNER'}
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
