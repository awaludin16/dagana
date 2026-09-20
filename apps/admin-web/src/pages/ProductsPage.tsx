import { useQuery } from '@tanstack/react-query'
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

  if (isLoading) return <p className="text-slate-500">Memuat produk…</p>
  if (isError) return <p className="text-rose-600">Gagal memuat produk.</p>

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Produk</h1>
        <p className="text-sm text-slate-500">Daftar produk tenant aktif (Phase 1 menyusul).</p>
      </header>

      {data!.length === 0 ? (
        <p className="text-sm text-slate-400">Belum ada produk. Jalankan seeder demo untuk contoh.</p>
      ) : (
        <table className="w-full rounded-xl bg-white shadow-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase text-slate-400">
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3 text-right">Harga</th>
            </tr>
          </thead>
          <tbody>
            {data!.map((product) =>
              product.variants.map((variant) => (
                <tr key={variant.id} className="border-b last:border-0">
                  <td className="px-4 py-3">{product.name}</td>
                  <td className="px-4 py-3 font-mono text-sm">{variant.sku}</td>
                  <td className="px-4 py-3 text-sm">{variant.unit}</td>
                  <td className="px-4 py-3 text-right text-sm">
                    Rp {Number(variant.price).toLocaleString('id-ID')}
                  </td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}