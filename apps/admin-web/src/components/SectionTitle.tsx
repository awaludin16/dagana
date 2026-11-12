import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

// Judul section dengan chip ikon warna brand, dipakai lintas halaman workspace.
export function SectionTitle({
  icon: Icon,
  children,
  className,
}: {
  icon: LucideIcon
  children: string
  className?: string
}) {
  return (
    <h2 className={cn('flex items-center gap-2 text-section-title', className)}>
      <span
        aria-hidden="true"
        className="grid size-7 shrink-0 place-items-center rounded-lg bg-dagana-primary-soft text-dagana-primary"
      >
        <Icon className="size-4" />
      </span>
      {children}
    </h2>
  )
}
