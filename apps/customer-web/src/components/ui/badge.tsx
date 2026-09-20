import { cva, type VariantProps } from 'class-variance-authority'
import type * as React from 'react'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-muted text-muted-foreground',
        outline: 'border text-foreground',
        destructive: 'bg-destructive text-destructive-foreground',
        success: 'bg-success/15 text-success',
        warning: 'bg-warning/15 text-warning',
        info: 'bg-info/10 text-info',
      },
    },
    defaultVariants: {
      variant: 'secondary',
    },
  },
)

export interface BadgeProps
  extends React.ComponentProps<'span'>,
    VariantProps<typeof badgeVariants> {
  /** Tampilkan titik indikator di depan teks (untuk live/status). */
  dot?: boolean
}

function Badge({ className, variant, dot = false, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && <span aria-hidden className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

export { Badge, badgeVariants }