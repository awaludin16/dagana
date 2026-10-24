import { useBusiness } from '@/providers/business-provider'
import { useAuth } from '@/hooks/use-auth'

export function BusinessOutletSelector() {
  const {
    activeBusiness,
    activeOutlet,
    outlets,
    outletsError,
    retryOutlets,
    setActiveOutlet,
  } = useBusiness()
  const { activeMembership, memberships, setActiveMembership } = useAuth()
  if (!activeBusiness) return null
  const activeMemberships = memberships.filter((membership) => membership.status === 'active')

  return (
    <div className="flex min-w-0 max-w-full flex-wrap items-center justify-end gap-2">
      {activeMemberships.length > 1 ? (
        <select
          aria-label="Pilih bisnis aktif"
          className="h-9 max-w-36 truncate rounded-md border border-input bg-background px-2 text-sm sm:max-w-48"
          value={activeMembership?.id ?? ''}
          onChange={(event) => setActiveMembership(event.target.value)}
        >
          {activeMemberships.map((membership) => (
            <option key={membership.id} value={membership.id}>
              {membership.business?.name ?? 'Bisnis'}
            </option>
          ))}
        </select>
      ) : (
        <span className="max-w-32 truncate text-sm font-medium text-foreground sm:max-w-48">
          {activeBusiness.name}
        </span>
      )}
      {outlets.length > 1 && (
        <select
          aria-label="Pilih outlet aktif"
          className="h-9 max-w-32 truncate rounded-md border border-input bg-background px-2 text-sm sm:max-w-40"
          value={activeOutlet?.id ?? ''}
          onChange={(event) => setActiveOutlet(event.target.value || null)}
        >
          {outlets.map((outlet) => (
            <option key={outlet.id} value={outlet.id}>
              {outlet.name}
            </option>
          ))}
        </select>
      )}
      {outlets.length === 1 && (
        <span className="max-w-32 truncate text-sm text-muted-foreground sm:max-w-40">
          {outlets[0]?.name}
        </span>
      )}
      {outletsError && (
        <button
          type="button"
          className="rounded text-xs text-destructive underline underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          onClick={retryOutlets}
          aria-label="Gagal memuat outlet. Coba lagi"
        >
          Coba lagi
        </button>
      )}
    </div>
  )
}
