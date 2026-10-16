import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProductTable } from '../components/ProductTable'
import { products } from '../mocks/products'
import { Plus, MagnifyingGlass } from '@phosphor-icons/react'
import { EmptyState } from '@/components/states/EmptyState'
import { Package } from '@phosphor-icons/react'

export function ProductsPage() {
  const [search, setSearch] = useState('')

  const filtered = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase())
  )

  if (products.length === 0) {
    return (
      <EmptyState
        title="Belum ada produk"
        description="Tambahkan menu pertama untuk mulai berjualan."
        icon={<Package className="size-10" weight="duotone" />}
        action={<Button variant="default">Tambah Produk</Button>}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Produk</h1>
          <p className="text-sm text-muted-foreground">Kelola menu dan harga produk.</p>
        </div>
        <Button variant="default" className="gap-2">
          <Plus className="size-4" />
          Tambah Produk
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative w-full sm:max-w-xs">
          <MagnifyingGlass className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Cari produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      <ProductTable products={filtered} />
      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">Tidak ada produk yang cocok dengan pencarian.</p>
      )}
    </div>
  )
}
