import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <section className={cn('flex flex-col items-center justify-center space-y-4 py-10 text-center', className)}>
      {icon && <div className="text-muted-foreground" aria-hidden="true">{icon}</div>}
      <div className="space-y-1">
        <h2 className="text-base font-semibold">{title}</h2>
        {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </section>
  )
}
