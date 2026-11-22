import { cn } from '@/lib/utils'
import type { Role } from '@/types'

import { ROLE_LABELS } from './constants'

export function RoleBadge({ role }: { role: Role }) {
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
