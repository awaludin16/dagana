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
    <section className={cn('flex flex-col items-center justify-center space-y-4 py-10 text-center', className)} role="alert">
      <WarningCircle className="size-10 text-destructive" weight="duotone" aria-hidden="true" />
      <div className="space-y-1">
        <h2 className="text-base font-semibold">{title}</h2>
        {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </section>
  )
}
