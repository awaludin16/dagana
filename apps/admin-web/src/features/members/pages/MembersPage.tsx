import { useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { StatusBadge } from "@/components/states/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useBusiness } from "@/providers/business-provider";
import { useAuth } from "@/hooks/use-auth";
import type {
  ApiCollection,
  ApiPaginatedCollection,
  MemberInvitation,
  ManagedMembership,
  MemberPayload,
  RolePreset,
} from "@/types/organization.types";

interface MemberEditorProps {
  member?: ManagedMembership;
  roles: RolePreset[];
  permissions: string[];
  actorPermissions: string[];
  outlets: Array<{ id: string | number; name: string }>;
  canManagePermissions: boolean;
  isSaving: boolean;
  onSave: (payload: MemberPayload) => void;
  onCancel: () => void;
}

const permissionGroupNames: Record<string, string> = {
  business: "Bisnis",
  outlets: "Outlet",
  members: "Anggota",
  roles: "Peran",
  permissions: "Izin",
  categories: "Kategori",
  products: "Produk",
  orders: "Pesanan",
  payments: "Pembayaran",
  cash: "Kas",
  inventory: "Inventaris",
  reports: "Laporan",
  qr: "Pemesanan QR",
  kitchen: "Dapur",
  billing: "Tagihan",
  audit: "Audit",
  settings: "Pengaturan",
};

function permissionLabel(permission: string) {
  const [resource, action] = permission.split(".");
  const labels: Record<string, string> = {
    read: "Lihat",
    create: "Buat",
    update: "Ubah",
    archive: "Arsipkan",
    disable: "Nonaktifkan",
    invite: "Tambah anggota",
    manage_membership: "Kelola izin anggota",
    cash_in: "Kas masuk",
    cash_out: "Kas keluar",
    close: "Tutup kas",
    open: "Buka kas",
    reconcile: "Rekonsiliasi",
    stock_opname: "Stock opname",
    refund: "Refund",
    cancel: "Batalkan",
    export: "Ekspor",
    manage_settings: "Kelola pengaturan",
    update_status: "Ubah status",
    adjust: "Sesuaikan stok",
  };
  const group = resource
    ? (permissionGroupNames[resource] ?? resource)
    : permission;
  const actionLabel = action ? (labels[action] ?? action) : "";
  return actionLabel ? `${group} — ${actionLabel}` : permission;
}

function requestErrorMessage(error: unknown, fallback: string) {
  if (
    !isAxiosError<{ message?: string; errors?: Record<string, string[]> }>(
      error,
    )
  ) {
    return fallback;
  }

  const status = error.response?.status;
  if (status === 403)
    return "Anda tidak memiliki izin untuk melakukan tindakan ini.";
  if (status === 404) return "Data bisnis atau anggota tidak lagi tersedia.";
  if (status === 409) {
    return "Operasi berbenturan dengan status data saat ini. Periksa undangan atau Owner aktif.";
  }
  if (status === 503) {
    return "Undangan tersimpan, tetapi email belum berhasil dikirim. Coba kirim ulang.";
  }
  if (status === 422) {
    const fieldMessage = Object.values(error.response?.data?.errors ?? {})
      .flat()
      .at(0);
    if (fieldMessage?.toLowerCase().includes("already a member")) {
      return "Pengguna tersebut sudah menjadi anggota business ini.";
    }
    return fieldMessage ?? "Periksa kembali data yang dimasukkan.";
  }
  return fallback;
}

function MemberEditor({
  member,
  roles,
  permissions,
  actorPermissions,
  outlets,
  canManagePermissions,
  isSaving,
  onSave,
  onCancel,
}: MemberEditorProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(member?.role ?? roles[0]?.value ?? "");
  const [outletIds, setOutletIds] = useState(
    () =>
      member?.outlets
        .filter((outlet) => outlet.status !== "disabled")
        .map((outlet) => String(outlet.id)) ?? [],
  );

  const selectedRole = roles.find((preset) => preset.value === role);

  const [grants, setGrants] = useState(member?.permission_grants ?? []);
  const [denials, setDenials] = useState(member?.permission_denials ?? []);

  const selectableRoles = useMemo(() => {
    const assignable = roles.filter((preset) =>
      preset.permissions.every((permission) =>
        actorPermissions.includes(permission),
      ),
    );
    if (member && !assignable.some((preset) => preset.value === member.role)) {
      const current = roles.find((preset) => preset.value === member.role);
      if (current) return [current, ...assignable];
    }
    return assignable;
  }, [roles, actorPermissions, member]);

  const currentPermissionOverridesAreManageable = [
    ...(member?.permission_grants ?? []),
    ...(member?.permission_denials ?? []),
  ].every((permission) => actorPermissions.includes(permission));
  const canEditOverrides =
    canManagePermissions &&
    currentPermissionOverridesAreManageable &&
    role !== "owner";

  const groupedPermissions = useMemo(() => {
    const groups = new Map<string, string[]>();
    for (const permission of permissions) {
      const group = permission.split(".")[0] ?? "other";
      groups.set(group, [...(groups.get(group) ?? []), permission]);
    }
    return [...groups.entries()];
  }, [permissions]);

  const toggleOutlet = (id: string | number) => {
    const value = String(id);
    setOutletIds((current) =>
      current.includes(value)
        ? current.filter((outletId) => outletId !== value)
        : [...current, value],
    );
  };

  const permissionIsEnabled = (permission: string) =>
    grants.includes(permission) ||
    (!denials.includes(permission) &&
      selectedRole?.permissions.includes(permission) === true);

  const effectivePermissionsCount =
    permissions.filter(permissionIsEnabled).length;

  const setPermissionEnabled = (permission: string, enabled: boolean) => {
    const roleDefault = selectedRole?.permissions.includes(permission) === true;
    if (enabled === roleDefault) {
      setGrants((current) => current.filter((value) => value !== permission));
      setDenials((current) => current.filter((value) => value !== permission));
    } else if (enabled) {
      setGrants((current) =>
        current.includes(permission) ? current : [...current, permission],
      );
      setDenials((current) => current.filter((value) => value !== permission));
    } else {
      setDenials((current) =>
        current.includes(permission) ? current : [...current, permission],
      );
      setGrants((current) => current.filter((value) => value !== permission));
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: MemberPayload = {};

    if (!member) {
      payload.email = email.trim();
      payload.role = role;
      if (role !== "owner") payload.outlet_ids = outletIds.map(Number);
      if (canEditOverrides) {
        payload.permission_grants = grants;
        payload.permission_denials = denials;
      }
      onSave(payload);
      return;
    }

    if (role !== member.role) payload.role = role;
    if (role !== "owner") payload.outlet_ids = outletIds.map(Number);
    if (canEditOverrides) {
      const grantsChanged =
        grants.length !== member.permission_grants.length ||
        grants.some((value) => !member.permission_grants.includes(value));
      const denialsChanged =
        denials.length !== member.permission_denials.length ||
        denials.some((value) => !member.permission_denials.includes(value));
      if (grantsChanged || denialsChanged) {
        payload.permission_grants = grants;
        payload.permission_denials = denials;
      }
    }
    onSave(payload);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-md border bg-background p-4"
    >
      {!member && (
        <div className="space-y-2">
          <Label htmlFor="member-email">Email undangan</Label>
          <Input
            id="member-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="nama@email.com"
          />
          <p className="text-xs text-muted-foreground">
            Penerima membuat akun sendiri atau masuk dengan email ini. Akses
            aktif setelah undangan diterima.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor={`member-role-${member?.id ?? "new"}`}>Peran</Label>
        <select
          id={`member-role-${member?.id ?? "new"}`}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          value={role}
          onChange={(event) => {
            setRole(event.target.value);
            setGrants([]);
            setDenials([]);
          }}
          required
        >
          {selectableRoles.map((preset) => (
            <option key={preset.value} value={preset.value}>
              {preset.label}
              {member?.role === preset.value &&
              !preset.permissions.every((permission) =>
                actorPermissions.includes(permission),
              )
                ? " (saat ini)"
                : ""}
            </option>
          ))}
        </select>
        {selectableRoles.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Tidak ada peran yang dapat diberikan berdasarkan izin Anda.
          </p>
        )}
      </div>

      {role !== "owner" && outlets.length > 0 && (
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Akses outlet</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {outlets.map((outlet) => (
              <label
                key={outlet.id}
                className="flex min-h-10 items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={outletIds.includes(String(outlet.id))}
                  onChange={() => toggleOutlet(outlet.id)}
                  className="size-4 accent-primary"
                />
                {outlet.name}
              </label>
            ))}
          </div>
          {outletIds.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Pilih outlet yang dapat diakses anggota ini.
            </p>
          )}
        </fieldset>
      )}
      {role !== "owner" && outlets.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Belum ada outlet yang dapat diberikan. Anggota tidak akan memiliki
          akses outlet.
        </p>
      )}

      {canManagePermissions &&
        role !== "owner" &&
        currentPermissionOverridesAreManageable && (
          <details className="rounded-md border p-3">
            <summary className="cursor-pointer text-sm font-medium">
              Izin efektif: {effectivePermissionsCount} aktif · {grants.length}{" "}
              tambahan · {denials.length} dicabut
            </summary>
            <p className="my-3 text-xs text-muted-foreground">
              Jumlah aktif mencakup izin bawaan peran dan penyesuaian. Toggle
              mengikuti izin bawaan peran. Mengubah peran akan mengembalikan
              toggle ke nilai default peran baru; penyesuaian hanya berlaku
              untuk izin yang Anda miliki.
            </p>
            <div className="space-y-3">
              {groupedPermissions.map(([group, groupPermissions]) => (
                <fieldset key={group} className="space-y-2 border-t pt-3">
                  <legend className="text-sm font-medium">
                    {permissionGroupNames[group] ?? group}
                  </legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {groupPermissions
                      .filter((permission) =>
                        actorPermissions.includes(permission),
                      )
                      .map((permission) => (
                        <div
                          key={permission}
                          className="flex items-center justify-between gap-3 rounded-md bg-muted/50 p-3"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-medium">
                              {permissionLabel(permission)}
                            </p>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              {grants.includes(permission) ||
                              denials.includes(permission)
                                ? "Penyesuaian khusus"
                                : selectedRole?.permissions.includes(permission)
                                  ? "Bawaan peran · Aktif"
                                  : "Bawaan peran · Nonaktif"}
                            </p>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={permissionIsEnabled(permission)}
                            aria-label={`${permissionLabel(permission)}: ${permissionIsEnabled(permission) ? "aktif" : "nonaktif"}`}
                            onClick={() =>
                              setPermissionEnabled(
                                permission,
                                !permissionIsEnabled(permission),
                              )
                            }
                            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none ${
                              permissionIsEnabled(permission)
                                ? "bg-primary"
                                : "bg-muted-foreground/40"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block size-5 rounded-full bg-white shadow-sm transition-transform duration-200 motion-reduce:transition-none ${
                                permissionIsEnabled(permission)
                                  ? "translate-x-5"
                                  : "translate-x-0.5"
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                  </div>
                </fieldset>
              ))}
            </div>
          </details>
        )}
      {canManagePermissions &&
        role !== "owner" &&
        !currentPermissionOverridesAreManageable && (
          <p className="text-sm text-muted-foreground">
            Izin khusus tertentu berada di luar kewenangan Anda. Perubahan izin
            dinonaktifkan; minta Owner untuk mengelolanya.
          </p>
        )}

      <div className="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
        >
          Batal
        </Button>
        <Button
          type="submit"
          disabled={isSaving || selectableRoles.length === 0}
        >
          {isSaving
            ? "Menyimpan..."
            : member
              ? "Simpan perubahan"
              : "Kirim undangan"}
        </Button>
      </div>
    </form>
  );
}

export function MembersPage() {
  const { activeBusiness, can, outlets, outletsError, retryOutlets } =
    useBusiness();
  const { activeMembership, permissions: actorPermissions } = useAuth();
  const queryClient = useQueryClient();
  const [isInviting, setIsInviting] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [membersPage, setMembersPage] = useState(1);
  const [invitationsPage, setInvitationsPage] = useState(1);
  const businessId = activeBusiness?.id;
  const queryKey = ["business-members", businessId, membersPage];
  const invitationsQueryKey = [
    "business-invitations",
    businessId,
    invitationsPage,
  ];

  const membersQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await api.get<ApiPaginatedCollection<ManagedMembership>>(
        `/businesses/${businessId}/members`,
        { params: { page: membersPage, per_page: 10 } },
      );
      return response.data;
    },
    enabled: !!businessId && can("members.read"),
  });
  const invitationsQuery = useQuery({
    queryKey: invitationsQueryKey,
    queryFn: async () => {
      const response = await api.get<ApiPaginatedCollection<MemberInvitation>>(
        `/businesses/${businessId}/invitations`,
        { params: { page: invitationsPage, per_page: 10 } },
      );
      return response.data;
    },
    enabled: !!businessId && can("members.read"),
  });
  const rolesQuery = useQuery({
    queryKey: ["role-presets"],
    queryFn: async () => {
      const response = await api.get<ApiCollection<RolePreset>>("/roles");
      return response.data.data;
    },
    enabled: can("members.invite") || can("members.update"),
  });
  const permissionsQuery = useQuery({
    queryKey: ["permission-catalog"],
    queryFn: async () => {
      const response =
        await api.get<ApiCollection<{ value: string }>>("/permissions");
      return response.data.data.map((permission) => permission.value);
    },
    enabled: can("permissions.manage_membership"),
  });

  const invalidateMembers = () => queryClient.invalidateQueries({ queryKey });

  const inviteMutation = useMutation({
    mutationFn: (payload: MemberPayload) =>
      api.post(`/businesses/${businessId}/invitations`, payload),
    onSuccess: async () => {
      setIsInviting(false);
      setMutationError(null);
      toast.success(
        "Undangan dikirim. Akses aktif setelah penerima menyetujuinya.",
      );
      await Promise.all([
        invalidateMembers(),
        queryClient.invalidateQueries({
          queryKey: ["business-invitations", businessId],
        }),
      ]);
    },
    onError: (error) => {
      setMutationError(
        requestErrorMessage(error, "Undangan belum dapat dikirim. Coba lagi."),
      );
      if (isAxiosError(error) && error.response?.status === 503) {
        setIsInviting(false);
        void queryClient.invalidateQueries({
          queryKey: ["business-invitations", businessId],
        });
      }
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({
      memberId,
      payload,
    }: {
      memberId: string | number;
      payload: MemberPayload;
    }) => api.patch(`/businesses/${businessId}/members/${memberId}`, payload),
    onSuccess: async () => {
      setEditingId(null);
      setMutationError(null);
      toast.success("Data anggota berhasil diperbarui");
      await invalidateMembers();
    },
    onError: (error) =>
      setMutationError(
        requestErrorMessage(
          error,
          "Perubahan anggota belum dapat disimpan. Coba lagi.",
        ),
      ),
  });
  const statusMutation = useMutation({
    mutationFn: ({
      member,
      enable,
    }: {
      member: ManagedMembership;
      enable: boolean;
    }) =>
      api.post(
        `/businesses/${businessId}/members/${member.id}/${enable ? "enable" : "disable"}`,
      ),
    onSuccess: async (_, variables) => {
      setMutationError(null);
      toast.success(
        variables.enable ? "Anggota diaktifkan" : "Anggota dinonaktifkan",
      );
      await invalidateMembers();
    },
    onError: (error) =>
      setMutationError(
        requestErrorMessage(
          error,
          "Status anggota belum dapat diubah. Coba lagi.",
        ),
      ),
  });
  const invitationActionMutation = useMutation({
    mutationFn: ({
      invitation,
      action,
    }: {
      invitation: MemberInvitation;
      action: "resend" | "cancel";
    }) =>
      api.post(
        `/businesses/${businessId}/invitations/${invitation.id}/${action}`,
      ),
    onSuccess: async (_, variables) => {
      setMutationError(null);
      toast.success(
        variables.action === "resend"
          ? "Undangan dikirim ulang"
          : "Undangan dibatalkan",
      );
      await queryClient.invalidateQueries({
        queryKey: ["business-invitations", businessId],
      });
    },
    onError: (error) => {
      setMutationError(
        requestErrorMessage(
          error,
          "Undangan belum dapat diperbarui. Coba lagi.",
        ),
      );
      if (isAxiosError(error) && error.response?.status === 503) {
        void queryClient.invalidateQueries({
          queryKey: ["business-invitations", businessId],
        });
      }
    },
  });

  if (!activeBusiness) {
    return (
      <EmptyState
        title="Pilih business"
        description="Pilih konteks business untuk melihat anggota."
      />
    );
  }

  if (
    membersQuery.isPending ||
    invitationsQuery.isPending ||
    ((can("members.invite") || can("members.update")) &&
      rolesQuery.isPending) ||
    (can("permissions.manage_membership") && permissionsQuery.isPending)
  ) {
    return (
      <div className="space-y-4" aria-label="Memuat anggota">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  const queryError =
    membersQuery.error ||
    invitationsQuery.error ||
    rolesQuery.error ||
    permissionsQuery.error;
  if (queryError) {
    return (
      <ErrorState
        title="Data anggota belum dapat dimuat"
        description={requestErrorMessage(
          queryError,
          "Periksa koneksi lalu coba lagi.",
        )}
        action={
          <Button
            variant="outline"
            onClick={() => {
              void membersQuery.refetch();
              void invitationsQuery.refetch();
              void rolesQuery.refetch();
              if (can("permissions.manage_membership")) {
                void permissionsQuery.refetch();
              }
            }}
          >
            Coba lagi
          </Button>
        }
      />
    );
  }

  const members = membersQuery.data?.data ?? [];
  const invitations = invitationsQuery.data?.data ?? [];
  const roles = rolesQuery.data ?? [];
  const permissions = permissionsQuery.data ?? [];
  const outletAccessUnavailable =
    activeMembership?.business_wide_outlet_access === true && outletsError;
  const isMutating =
    inviteMutation.isPending ||
    updateMutation.isPending ||
    statusMutation.isPending ||
    invitationActionMutation.isPending;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Anggota</h1>
          <p className="text-sm text-muted-foreground">
            Atur peran, akses outlet, dan izin anggota {activeBusiness.name}.
          </p>
        </div>
        {can("members.invite") && !isInviting && !outletAccessUnavailable && (
          <Button
            onClick={() => {
              setMutationError(null);
              setIsInviting(true);
            }}
          >
            Undang anggota
          </Button>
        )}
      </header>

      {mutationError && (
        <p
          className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          role="alert"
        >
          {mutationError}
        </p>
      )}
      {outletAccessUnavailable && (
        <div
          className="flex flex-col gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <span>
            Daftar outlet belum berhasil dimuat. Pengaturan akses anggota
            sementara dinonaktifkan.
          </span>
          <Button variant="outline" onClick={retryOutlets}>
            Coba lagi
          </Button>
        </div>
      )}

      {isInviting && !outletAccessUnavailable && (
        <section className="space-y-4 rounded-lg border bg-card p-4 sm:p-6">
          <div>
            <h2 className="font-semibold">Undang anggota</h2>
            <p className="text-sm text-muted-foreground">
              Anggota membuat akun sendiri atau masuk; akses business aktif
              setelah undangan diterima.
            </p>
          </div>
          <MemberEditor
            roles={roles}
            permissions={permissions}
            actorPermissions={actorPermissions}
            outlets={outlets}
            canManagePermissions={can("permissions.manage_membership")}
            isSaving={inviteMutation.isPending}
            onSave={(payload) => inviteMutation.mutate(payload)}
            onCancel={() => setIsInviting(false)}
          />
        </section>
      )}

      {members.length === 0 ? (
        <EmptyState
          title="Belum ada anggota"
          description="Anda dapat menjalankan bisnis sendiri. Undang anggota saat operasional membutuhkannya."
          action={
            can("members.invite") && !isInviting && !outletAccessUnavailable ? (
              <Button onClick={() => setIsInviting(true)}>
                Undang anggota
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {members.map((member) => {
            const isEditing = String(editingId) === String(member.id);
            const canEdit = can("members.update");
            const canDisable =
              can("members.disable") && member.status === "active";
            const canEnable =
              can("members.update") && member.status === "disabled";

            return (
              <article
                key={member.id}
                className="space-y-4 rounded-lg border bg-card p-4 sm:p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold">{member.user.name}</h2>
                      <StatusBadge
                        label={
                          member.status === "active" ? "Aktif" : "Nonaktif"
                        }
                        variant={
                          member.status === "active" ? "success" : "neutral"
                        }
                      />
                    </div>
                    <p className="break-all text-sm text-muted-foreground">
                      {member.user.email}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-secondary px-2 py-1 text-secondary-foreground">
                        {member.role_label}
                      </span>
                      <span className="rounded-full bg-muted px-2 py-1 text-muted-foreground">
                        {member.permissions.length} izin aktif
                      </span>
                      <span className="rounded-full bg-muted px-2 py-1 text-muted-foreground">
                        {member.business_wide_outlet_access
                          ? "Semua outlet"
                          : member.outlets.length > 0
                            ? member.outlets
                                .map((outlet) => outlet.name)
                                .join(", ")
                            : "Belum ada akses outlet"}
                      </span>
                    </div>
                  </div>
                  {!isEditing && (
                    <div className="flex flex-wrap gap-2">
                      {canEdit && !outletAccessUnavailable && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setMutationError(null);
                            setEditingId(member.id);
                          }}
                        >
                          Ubah
                        </Button>
                      )}
                      {canDisable && (
                        <Button
                          variant="outlineDestructive"
                          disabled={statusMutation.isPending}
                          onClick={() => {
                            if (
                              window.confirm(
                                `Nonaktifkan ${member.user.name}? Akses business akan dicabut sampai anggota diaktifkan kembali.`,
                              )
                            ) {
                              setMutationError(null);
                              statusMutation.mutate({ member, enable: false });
                            }
                          }}
                        >
                          Nonaktifkan
                        </Button>
                      )}
                      {canEnable && (
                        <Button
                          variant="outline"
                          disabled={statusMutation.isPending}
                          onClick={() =>
                            statusMutation.mutate({ member, enable: true })
                          }
                        >
                          Aktifkan
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                {isEditing && !outletAccessUnavailable && (
                  <MemberEditor
                    key={member.id}
                    member={member}
                    roles={roles}
                    permissions={permissions}
                    actorPermissions={actorPermissions}
                    outlets={outlets}
                    canManagePermissions={can("permissions.manage_membership")}
                    isSaving={updateMutation.isPending}
                    onSave={(payload) =>
                      updateMutation.mutate({ memberId: member.id, payload })
                    }
                    onCancel={() => setEditingId(null)}
                  />
                )}
              </article>
            );
          })}
        </div>
      )}
      {membersQuery.data && membersQuery.data.meta.last_page > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Halaman {membersQuery.data.meta.current_page} dari{" "}
            {membersQuery.data.meta.last_page}
            {" · "}
            {membersQuery.data.meta.total} anggota
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={membersPage <= 1}
              onClick={() =>
                setMembersPage((current) => Math.max(1, current - 1))
              }
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              disabled={membersPage >= membersQuery.data.meta.last_page}
              onClick={() => setMembersPage((current) => current + 1)}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      )}

      <section className="space-y-3" aria-label="Undangan anggota">
        <div>
          <h2 className="font-semibold">Undangan</h2>
          <p className="text-sm text-muted-foreground">
            Undangan berlaku selama tujuh hari.
          </p>
        </div>
        {invitations.length === 0 ? (
          <p className="rounded-md border bg-card p-4 text-sm text-muted-foreground">
            Belum ada undangan.
          </p>
        ) : (
          invitations.map((invitation) => (
            <article
              key={invitation.id}
              className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="break-all font-medium">{invitation.email}</h3>
                  <StatusBadge
                    label={
                      invitation.status === "pending"
                        ? "Menunggu"
                        : invitation.status === "expired"
                          ? "Kedaluwarsa"
                          : invitation.status === "accepted"
                            ? "Diterima"
                            : "Dibatalkan"
                    }
                    variant={
                      invitation.status === "accepted"
                        ? "success"
                        : invitation.status === "pending"
                          ? "warning"
                          : "neutral"
                    }
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {invitation.role_label} · Email{" "}
                  {invitation.delivery_status === "sent"
                    ? "terkirim"
                    : invitation.delivery_status === "failed"
                      ? "gagal dikirim"
                      : "belum dikirim"}
                </p>
              </div>
              {can("members.invite") && (
                <div className="flex gap-2">
                  {(invitation.status === "pending" ||
                    invitation.status === "expired") && (
                    <Button
                      variant="outline"
                      disabled={invitationActionMutation.isPending}
                      onClick={() =>
                        invitationActionMutation.mutate({
                          invitation,
                          action: "resend",
                        })
                      }
                    >
                      Kirim ulang
                    </Button>
                  )}
                  {invitation.status === "pending" && (
                    <Button
                      variant="outlineDestructive"
                      disabled={invitationActionMutation.isPending}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Batalkan undangan untuk ${invitation.email}? Tautan undangan tidak akan bisa digunakan.`,
                          )
                        ) {
                          invitationActionMutation.mutate({
                            invitation,
                            action: "cancel",
                          });
                        }
                      }}
                    >
                      Batalkan
                    </Button>
                  )}
                </div>
              )}
            </article>
          ))
        )}
        {invitationsQuery.data && invitationsQuery.data.meta.last_page > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Halaman {invitationsQuery.data.meta.current_page} dari{" "}
              {invitationsQuery.data.meta.last_page}
              {" · "}
              {invitationsQuery.data.meta.total} undangan
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={invitationsPage <= 1}
                onClick={() =>
                  setInvitationsPage((current) => Math.max(1, current - 1))
                }
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                disabled={
                  invitationsPage >= invitationsQuery.data.meta.last_page
                }
                onClick={() => setInvitationsPage((current) => current + 1)}
              >
                Berikutnya
              </Button>
            </div>
          </div>
        )}
      </section>
      {isMutating && (
        <p className="sr-only" role="status">
          Menyimpan perubahan anggota
        </p>
      )}
    </div>
  );
}
