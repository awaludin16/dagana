import { WarningCircle } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
  title?: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function ErrorState({ title = 'Terjadi kesalahan', description, action, className }: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-10 space-y-4', className)} role="alert">
      <WarningCircle className="size-10 text-destructive" weight="duotone" />
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{title}</h3>
        {description && <p className="text-sm text-muted-foreground max-w-sm">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
