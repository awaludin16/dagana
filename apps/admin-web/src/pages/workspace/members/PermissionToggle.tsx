import { cn } from '@/lib/utils'

export function PermissionToggle({
  label,
  checked,
  locked,
  disabled,
  onToggle,
}: {
  label: string
  checked: boolean
  locked: boolean
  disabled: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={`${checked && locked ? label : checked ? `Cabut ${label}` : `Beri ${label}`}${locked ? ' (bawaan role, terkunci)' : ''}`}
      disabled={disabled || locked}
      onClick={onToggle}
      className={cn(
        'flex min-h-11 items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-not-allowed',
        checked
          ? 'border-dagana-primary bg-dagana-primary-soft'
          : 'border-input bg-background hover:bg-muted/50',
        (disabled || locked) && 'opacity-70',
      )}
    >
      <span className="min-w-0">
        {label}
        {locked ? <span className="ml-2 text-xs text-muted-foreground">bawaan role</span> : null}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          'relative h-5 w-9 shrink-0 rounded-full transition',
          checked ? 'bg-dagana-primary' : 'bg-muted-foreground/30',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 size-4 rounded-full bg-white shadow transition-all',
            checked ? 'left-4.5' : 'left-0.5',
          )}
        />
      </span>
    </button>
  )
}
