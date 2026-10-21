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
  if (activeMemberships.length <= 1 && outlets.length <= 1 && !outletsError) return null

  return (
    <div className="flex min-w-0 items-center gap-2">
      {activeMemberships.length > 1 ? (
        <select
          aria-label="Pilih bisnis aktif"
          className="h-9 max-w-36 rounded-md border bg-background px-2 text-xs sm:max-w-48"
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
        <span className="max-w-32 truncate text-xs text-muted-foreground sm:max-w-48">
          {activeBusiness.name}
        </span>
      )}
      {outlets.length > 1 && (
        <select
          aria-label="Pilih outlet aktif"
          className="h-9 max-w-32 rounded-md border bg-background px-2 text-xs sm:max-w-40"
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
      {outletsError && (
        <button
          type="button"
          className="text-xs text-destructive underline underline-offset-2"
          onClick={retryOutlets}
          aria-label="Gagal memuat outlet. Coba lagi"
        >
          Coba lagi
        </button>
      )}
    </div>
  )
}
