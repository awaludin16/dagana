import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  label: string
  variant?: 'success' | 'warning' | 'danger' | 'neutral'
  className?: string
}

const variants = {
  success: 'bg-success/3 text-success ring-success/20',
  warning: 'bg-warning/3 text-warning ring-warning/20',
  danger: 'bg-error/3 text-error ring-error/20',
  neutral: 'bg-muted text-muted-foreground ring-border',
}

export function StatusBadge({ label, variant = 'neutral', className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset',
        variants[variant],
        className
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {label}
    </span>
  )
}
