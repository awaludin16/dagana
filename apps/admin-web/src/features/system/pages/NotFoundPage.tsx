import { EmptyState } from '@/components/states/EmptyState'
import { House } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <EmptyState
        title="Halaman tidak ditemukan"
        description="Kembali ke dasbor untuk melanjutkan operasional."
        icon={<House className="size-10" weight="duotone" />}
        action={
          <Button variant="default" asChild>
            <Link to="/">Kembali ke Dasbor</Link>
          </Button>
        }
      />
    </div>
  )
}
