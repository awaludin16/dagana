import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

const summaryTones = {
  primary:
    'border-transparent bg-gradient-to-br from-dagana-primary to-dagana-primary-hover text-white',
  soft: 'border-transparent bg-dagana-primary-soft text-dagana-primary',
  info: 'border-transparent bg-dagana-info-container text-dagana-info',
} as const

// Kartu angka ringkasan beraksen warna brand; semua warna dari token tema.
export function SummaryCard({
  label,
  value,
  icon: Icon,
  tone = 'plain',
}: {
  label: string
  value: string
  icon: LucideIcon
  tone?: keyof typeof summaryTones | 'plain'
}) {
  if (tone === 'plain') {
    return (
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">{label}</p>
          <Icon aria-hidden="true" className="size-5 text-muted-foreground/70" />
        </div>
        <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      </div>
    )
  }

  return (
    <div className={cn('rounded-xl border p-4', summaryTones[tone])}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm opacity-80">{label}</p>
        <Icon aria-hidden="true" className="size-5 opacity-80" />
      </div>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
    </div>
  )
}
