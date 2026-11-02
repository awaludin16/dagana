import { AlertCircle, LoaderCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function LoadingState({ label = 'Memuat data...' }: { label?: string }) {
  return (
    <div
      className="flex min-h-48 items-center justify-center gap-3 text-sm text-muted-foreground"
      role="status"
    >
      <LoaderCircle aria-hidden="true" className="size-5 animate-spin motion-reduce:animate-none" />
      {label}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5" role="alert">
      <div className="flex items-start gap-3">
        <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-destructive" />
        <div className="space-y-3">
          <p className="text-sm">{message}</p>
          <Button type="button" variant="outline" onClick={onRetry}>
            Coba lagi
          </Button>
        </div>
      </div>
    </div>
  )
}
