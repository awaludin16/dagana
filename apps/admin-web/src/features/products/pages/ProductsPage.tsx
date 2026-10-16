import { EmptyState } from '@/components/states/EmptyState'
import { Button } from '@/components/ui/button'
import { Package } from '@phosphor-icons/react'

export function ProductsPage() {
  return (
    <EmptyState
      title="Belum ada produk"
      description="Tambahkan menu pertama untuk mulai berjualan."
      icon={<Package className="size-10" weight="duotone" />}
      action={<Button variant="default">Tambah Produk</Button>}
    />
  )
}
