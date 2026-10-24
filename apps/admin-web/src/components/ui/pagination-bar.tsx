import { Button } from '@/components/ui/button'

interface PaginationBarProps {
  page: number
  lastPage: number
  total?: number
  perPage?: number
  noun: string
  onPageChange: (page: number) => void
  className?: string
}

export function PaginationBar({
  page,
  lastPage,
  total,
  perPage,
  noun,
  onPageChange,
  className,
}: PaginationBarProps) {
  if (lastPage <= 1) return null

  const range =
    typeof total === 'number' && typeof perPage === 'number'
      ? `· ${Math.min(total, (page - 1) * perPage + 1)}–${Math.min(page * perPage, total)} dari ${total} ${noun}`
      : `· ${total ?? ''} ${noun}`.trim()

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 text-sm ${className ?? ''}`}
    >
      <p className="text-muted-foreground">
        Halaman {page} dari {lastPage} {range}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-11"
          disabled={page <= 1}
          aria-label={`Halaman ${page - 1}`}
          onClick={() => onPageChange(page - 1)}
        >
          Sebelumnya
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-11"
          disabled={page >= lastPage}
          aria-label={`Halaman ${page + 1}`}
          onClick={() => onPageChange(page + 1)}
        >
          Berikutnya
        </Button>
      </div>
    </div>
  )
}
