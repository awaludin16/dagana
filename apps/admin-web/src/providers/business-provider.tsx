import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/use-auth'
import type { Business, Membership, Outlet } from '@/types/auth.types'

export interface BusinessState {
  activeBusiness: Business | null
  activeOutlet: Outlet | null
  setActiveOutlet: (outletId: string | number | null) => void
  memberships: Membership[]
  outlets: Outlet[]
  outletsError: boolean
  retryOutlets: () => void
  hasBusinessContext: boolean
  can: (permission: string) => boolean
}

const BusinessContext = createContext<BusinessState | undefined>(undefined)

interface BusinessProviderProps {
  children: ReactNode
}

export function BusinessProvider({ children }: BusinessProviderProps) {
  const { activeMembership, memberships, permissions } = useAuth()
  const [activeOutletId, setActiveOutletId] = useState<string | number | null>(null)

  const activeBusiness = useMemo(() => activeMembership?.business || null, [activeMembership])
  const businessId = activeBusiness?.id

  const businessOutletsQuery = useQuery({
    queryKey: ['business-outlets', businessId],
    queryFn: async () => {
      if (!businessId) {
        throw new Error('Business context is required to load outlets')
      }
      const response = await api.get<{ data: Outlet[] }>(
        `/businesses/${businessId}/outlets`,
      )
      return response.data.data
    },
    enabled: !!businessId && !!activeMembership?.business_wide_outlet_access,
  })
  const refetchOutlets = businessOutletsQuery.refetch
  const retryOutlets = useCallback(() => {
    void refetchOutlets()
  }, [refetchOutlets])

  const outlets = useMemo(
    () => {
      const availableOutlets = activeMembership?.business_wide_outlet_access
        ? businessOutletsQuery.data || []
        : activeMembership?.outlets || activeMembership?.outlet_access || []
      return availableOutlets.filter((outlet) => outlet.status !== 'disabled')
    },
    [activeMembership, businessOutletsQuery.data],
  )

  const activeOutlet = useMemo(() => {
    return (
      outlets.find((o) => String(o.id) === String(activeOutletId)) ||
      outlets[0] ||
      null
    )
  }, [outlets, activeOutletId])

  const hasBusinessContext = useMemo(() => !!activeBusiness, [activeBusiness])

  const can = useCallback((permission: string) => permissions.includes(permission), [permissions])

  const value = useMemo<BusinessState>(() => ({
    activeBusiness,
    activeOutlet,
    setActiveOutlet: setActiveOutletId,
    memberships,
    outlets,
    outletsError: businessOutletsQuery.isError,
    retryOutlets,
    hasBusinessContext,
    can,
  }), [
    activeBusiness,
    activeOutlet,
    setActiveOutletId,
    memberships,
    outlets,
    businessOutletsQuery.isError,
    retryOutlets,
    hasBusinessContext,
    can,
  ])

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>
}

export function useBusiness() {
  const ctx = useContext(BusinessContext)
  if (!ctx) {
    throw new Error('useBusiness must be used within BusinessProvider')
  }
  return ctx
}
