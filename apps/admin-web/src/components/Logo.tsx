import daganaIcon from '@/assets/dagana-icon.png'
import daganaLogo from '@/assets/dagana-logo.png'
import { cn } from '@/lib/utils'

// Logo brand resmi dari docs/design-system: mode 'full' memakai dagana-logo.png
// (icon + wordmark), mode 'icon' memakai dagana-icon.png untuk ruang sempit.
export function BrandLogo({
  mode = 'full',
  className,
}: {
  mode?: 'full' | 'icon'
  className?: string
}) {
  return (
    <img
      src={mode === 'full' ? daganaLogo : daganaIcon}
      alt="Dagana"
      className={cn('w-auto', className)}
    />
  )
}
