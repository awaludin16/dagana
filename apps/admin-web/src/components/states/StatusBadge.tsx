import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  label: string
  variant?: 'success' | 'warning' | 'danger' | 'neutral'
  className?: string
}

const variants = {
  success: 'bg-pill-success text-pill-success-ink ring-pill-success-border',
  warning: 'bg-pill-warning text-pill-warning-ink ring-pill-warning-border',
  danger: 'bg-pill-danger text-pill-danger-ink ring-pill-danger-border',
  neutral: 'bg-pill-neutral text-pill-neutral-ink ring-pill-neutral-border',
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
