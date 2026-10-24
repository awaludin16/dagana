import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { CatalogMenu } from '@/types/catalog.types'

interface ProductTableProps {
  products: CatalogMenu[]
  canUpdate: boolean
  canArchive: boolean
  onEdit: (product: CatalogMenu) => void
  onToggleAvailability: (product: CatalogMenu) => void
  onToggleStatus: (product: CatalogMenu) => void
}

export function ProductTable({
  products,
  canUpdate,
  canArchive,
  onEdit,
  onToggleAvailability,
  onToggleStatus,
}: ProductTableProps) {
  return (
    <>
      <div className="space-y-2 sm:hidden">
        {products.map((product) => (
          <article key={product.id} className="space-y-3 rounded-lg border bg-card p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-medium">{product.name}</h3>
                <p className="text-sm text-muted-foreground">{product.category?.name ?? 'Tanpa kategori'}</p>
              </div>
              <Badge variant={product.status === 'active' ? 'secondary' : 'outline'}>
                {product.status === 'active' ? 'Aktif' : 'Nonaktif'}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-semibold tabular-nums">
                Rp {product.price.toLocaleString('id-ID')}
              </span>
              <Badge variant={product.is_available ? 'secondary' : 'outline'}>
                {product.is_available ? 'Tersedia' : 'Tidak tersedia'}
              </Badge>
            </div>
            {(canUpdate || canArchive) && (
              <div className="flex flex-wrap gap-2 border-t pt-2">
                {canUpdate && (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="min-h-11 sm:min-h-0"
                      onClick={() => onEdit(product)}
                    >
                      Ubah
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="min-h-11 sm:min-h-0"
                      onClick={() => onToggleAvailability(product)}
                    >
                      {product.is_available ? 'Tandai habis' : 'Tersedia'}
                    </Button>
                  </>
                )}
                {canArchive && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="min-h-11 sm:min-h-0"
                    onClick={() => onToggleStatus(product)}
                  >
                    {product.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                  </Button>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
      <div className="hidden rounded-lg border sm:block">
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>Harga</TableHead>
            <TableHead>Ketersediaan</TableHead>
            <TableHead>Status</TableHead>
            {(canUpdate || canArchive) && <TableHead>Aksi</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>{product.category?.name ?? '-'}</TableCell>
              <TableCell className="tabular-nums">
                Rp {product.price.toLocaleString('id-ID')}
              </TableCell>
              <TableCell>
                {product.is_available ? (
                  <Badge variant="secondary">Tersedia</Badge>
                ) : (
                  <Badge variant="outline">Tidak tersedia</Badge>
                )}
              </TableCell>
              <TableCell>
                {product.status === 'active' ? (
                  <Badge variant="secondary">Aktif</Badge>
                ) : (
                  <Badge variant="outline">Nonaktif</Badge>
                )}
              </TableCell>
              {(canUpdate || canArchive) && (
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    {canUpdate && (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => onEdit(product)}
                        >
                          Ubah
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => onToggleAvailability(product)}
                        >
                          {product.is_available ? 'Tandai habis' : 'Tersedia'}
                        </Button>
                      </>
                    )}
                    {canArchive && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onToggleStatus(product)}
                      >
                        {product.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
        </Table>
      </div>
    </>
  )
}
