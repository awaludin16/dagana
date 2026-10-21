import type { ReactNode } from 'react'
import { useBusiness } from '@/providers/business-provider'
import { EmptyState } from '@/components/states/EmptyState'
import { ShieldCheck } from '@phosphor-icons/react'

interface RequirePermissionProps {
  permission: string
  children: ReactNode
  fallback?: ReactNode
}

export function RequirePermission({ permission, children, fallback }: RequirePermissionProps) {
  const { can } = useBusiness()
  if (can(permission)) {
    return <>{children}</>
  }
  if (fallback) {
    return <>{fallback}</>
  }
  return (
    <EmptyState
      title="Akses dibatasi"
      description="Anda tidak memiliki izin untuk mengakses halaman ini."
      icon={<ShieldCheck className="size-10" weight="duotone" />}
    />
  )
}
