import { Tags } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function EmptyState({
  label,
  onReset,
  canReset,
}: {
  label: string
  onReset: () => void
  canReset: boolean
}) {
  return (
    <div className="rounded-lg border border-dashed px-5 py-12 text-center">
      <Tags aria-hidden="true" className="mx-auto size-8 text-muted-foreground" />
      <p className="mt-3 text-sm text-muted-foreground">{label}</p>
      {canReset ? (
        <Button type="button" variant="outline" className="mt-4" onClick={onReset}>
          Hapus filter
        </Button>
      ) : null}
    </div>
  )
}
