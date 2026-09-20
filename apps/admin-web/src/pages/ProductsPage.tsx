import { useQuery } from '@tanstack/react-query'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import { Skeleton } from '../components/ui/skeleton'
import { api } from '../lib/api'

interface Variant {
  id: string
  sku: string
  barcode: string | null
  unit: string
  price: string
}

interface Product {
  id: string
  name: string
  description: string | null
  status: string
  variants: Variant[]
}

export default function ProductsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get<{ data: Product[] }>('/catalog/products').then((r) => r.data.data),
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        Gagal memuat produk.{' '}
        <button onClick={() => window.location.reload()} className="underline">
          Coba lagi
        </button>
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Produk</h1>
        <p className="text-sm text-muted-foreground">Daftar produk tenant aktif (Phase 1 menyusul).</p>
      </header>

      {data!.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Belum ada produk. Jalankan seeder demo untuk contoh.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-right">Harga</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data!.map((product) =>
              product.variants.map((variant) => (
                <TableRow key={variant.id}>
                  <TableCell className="font-medium text-foreground">{product.name}</TableCell>
                  <TableCell className="font-mono text-xs">{variant.sku}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{variant.unit}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-foreground">
                    Rp {Number(variant.price).toLocaleString('id-ID')}
                  </TableCell>
                </TableRow>
              )),
            )}
          </TableBody>
        </Table>
      )}
    </div>
  )
}