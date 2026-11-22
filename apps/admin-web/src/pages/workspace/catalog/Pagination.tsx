import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function Pagination({
  currentPage,
  lastPage,
  total,
  onChange,
}: {
  currentPage: number
  lastPage: number
  total: number
  onChange: (page: number) => void
}) {
  return (
    <nav
      aria-label="Pagination katalog"
      className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-muted-foreground">
        Halaman {currentPage} dari {lastPage} · {total} data
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          disabled={currentPage <= 1}
          onClick={() => onChange(currentPage - 1)}
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
          Sebelumnya
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          disabled={currentPage >= lastPage}
          onClick={() => onChange(currentPage + 1)}
        >
          Berikutnya
          <ChevronRight aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </nav>
  )
}
