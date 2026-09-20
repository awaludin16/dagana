import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select } from '../components/ui/select'
import { Skeleton } from '../components/ui/skeleton'
import { Textarea } from '../components/ui/textarea'
import { type ApiFieldErrors, extractFieldErrors } from '../lib/api'
import {
  createProduct,
  getProduct,
  listCategories,
  updateProduct,
  type Product,
  type ProductInput,
  type ProductStatus,
  type VariantInput,
} from '../lib/catalog'
import { cn } from '../lib/utils'

interface VariantDraft {
  sku: string
  barcode: string
  unit: string
  price: string
  cost_price: string
}

function emptyVariant(): VariantDraft {
  return { sku: '', barcode: '', unit: 'pcs', price: '', cost_price: '' }
}

function FieldError({ text }: { text: string | undefined }) {
  if (!text) return null
  return <p className="text-xs text-destructive">{text}</p>
}

function variantToInput(v: VariantDraft): VariantInput {
  return {
    sku: v.sku.trim(),
    barcode: v.barcode.trim() || undefined,
    unit: v.unit.trim() || 'pcs',
    price: Number(v.price),
    cost_price: v.cost_price ? Number(v.cost_price) : 0,
  }
}

function ProductForm({ product, productId }: { product?: Product; productId?: string }) {
  const isEdit = Boolean(productId)
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [name, setName] = useState(product?.name ?? '')
  const [categoryId, setCategoryId] = useState(product?.category_id ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? '')
  const [status, setStatus] = useState<ProductStatus>(product?.status ?? 'ACTIVE')
  const [variants, setVariants] = useState<VariantDraft[]>(
    product && product.variants.length > 0
      ? product.variants.map((v) => ({
          sku: v.sku,
          barcode: v.barcode ?? '',
          unit: v.unit,
          price: v.price,
          cost_price: v.cost_price,
        }))
      : [emptyVariant()],
  )
  const [fieldErrors, setFieldErrors] = useState<ApiFieldErrors>({})

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: listCategories,
  })

  const mutation = useMutation({
    mutationFn: (payload: ProductInput) =>
      isEdit && productId ? updateProduct(productId, payload) : createProduct(payload),
    onSuccess: () => {
      toast.success(isEdit ? 'Produk diperbarui.' : 'Produk dibuat.')
      qc.invalidateQueries({ queryKey: ['products'] })
      navigate('/products')
    },
    onError: (error) => {
      const errors = extractFieldErrors(error)
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors)
      } else {
        setFieldErrors({})
        toast.error(
          isEdit ? 'Gagal memperbarui produk. Coba lagi.' : 'Gagal membuat produk. Coba lagi.',
        )
      }
    },
  })

  const submitDisabled = useMemo(
    () => mutation.isPending || variants.some((v) => !v.sku.trim() || v.price === ''),
    [mutation.isPending, variants],
  )

  function updateVariant(index: number, patch: Partial<VariantDraft>) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)))
  }

  function removeVariant(index: number) {
    setVariants((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const errors: ApiFieldErrors = {}
    if (!name.trim()) errors.name = ['Nama produk wajib diisi.']
    variants.forEach((v, index) => {
      if (!v.sku.trim()) errors[`variants.${index}.sku`] = ['SKU wajib diisi.']
      if (v.price === '' || Number.isNaN(Number(v.price))) {
        errors[`variants.${index}.price`] = ['Harga wajib diisi angka.']
      }
    })

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})
    mutation.mutate({
      name: name.trim(),
      category_id: categoryId || undefined,
      description: description.trim() || undefined,
      image_url: imageUrl.trim() || undefined,
      ...(isEdit ? { status } : {}),
      variants: variants.map(variantToInput),
    })
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {isEdit ? 'Edit Produk' : 'Tambah Produk'}
          </h1>
          <Button variant="ghost" asChild size="sm">
            <Link to="/products">
              <ArrowLeft aria-hidden />
              Kembali
            </Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {isEdit
            ? 'Perbarui detail, varian, dan harga produk.'
            : 'Lengkapi produk dengan setidaknya satu varian.'}
        </p>
      </header>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <Card className="divide-y divide-border">
          <section className="space-y-4 p-6">
            <h2 className="text-sm font-semibold text-foreground">Informasi Produk</h2>
            <div className="space-y-2">
              <Label htmlFor="name">Nama produk</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="cth. Kopi Susu Gula Aren"
                aria-invalid={Boolean(fieldErrors.name)}
              />
              <FieldError text={fieldErrors.name?.[0]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <Select id="category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Tanpa kategori</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              <FieldError text={fieldErrors.category_id?.[0]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image-url">URL gambar (opsional)</Label>
              <Input
                id="image-url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://…"
                aria-invalid={Boolean(fieldErrors.image_url)}
              />
              <FieldError text={fieldErrors.image_url?.[0]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi (opsional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Catatan singkat tentang produk…"
              />
            </div>
          </section>

          <section className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Varian & Harga</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setVariants((prev) => [...prev, emptyVariant()])}
              >
                <Plus aria-hidden />
                Tambah varian
              </Button>
            </div>

            <FieldError text={fieldErrors.variants?.[0]} />

            <div className="space-y-4">
              {variants.map((variant, index) => (
                <div key={index} className="rounded-lg border bg-card p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Varian {index + 1}</span>
                    {variants.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeVariant(index)}
                      >
                        <Trash2 aria-hidden />
                        Hapus
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                    <div className="space-y-2 sm:col-span-3">
                      <Label htmlFor={`variant-${index}-sku`}>SKU</Label>
                      <Input
                        id={`variant-${index}-sku`}
                        value={variant.sku}
                        onChange={(e) => updateVariant(index, { sku: e.target.value })}
                        placeholder="cth. KPG-001"
                        className="font-mono"
                        aria-invalid={Boolean(fieldErrors[`variants.${index}.sku`])}
                      />
                      <FieldError text={fieldErrors[`variants.${index}.sku`]?.[0]} />
                    </div>
                    <div className="space-y-2 sm:col-span-3">
                      <Label htmlFor={`variant-${index}-barcode`}>Barcode</Label>
                      <Input
                        id={`variant-${index}-barcode`}
                        value={variant.barcode}
                        onChange={(e) => updateVariant(index, { barcode: e.target.value })}
                        placeholder="Opsional"
                        className="font-mono"
                        aria-invalid={Boolean(fieldErrors[`variants.${index}.barcode`])}
                      />
                      <FieldError text={fieldErrors[`variants.${index}.barcode`]?.[0]} />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor={`variant-${index}-unit`}>Unit</Label>
                      <Input
                        id={`variant-${index}-unit`}
                        value={variant.unit}
                        onChange={(e) => updateVariant(index, { unit: e.target.value })}
                        placeholder="pcs"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor={`variant-${index}-price`}>Harga jual</Label>
                      <Input
                        id={`variant-${index}-price`}
                        type="number"
                        min="0"
                        step="any"
                        value={variant.price}
                        onChange={(e) => updateVariant(index, { price: e.target.value })}
                        placeholder="0"
                        className={cn('tabular-nums', !variant.price && 'text-muted-foreground')}
                        aria-invalid={Boolean(fieldErrors[`variants.${index}.price`])}
                      />
                      <FieldError text={fieldErrors[`variants.${index}.price`]?.[0]} />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor={`variant-${index}-cost`}>Harga modal</Label>
                      <Input
                        id={`variant-${index}-cost`}
                        type="number"
                        min="0"
                        step="any"
                        value={variant.cost_price}
                        onChange={(e) => updateVariant(index, { cost_price: e.target.value })}
                        placeholder="0"
                        className="tabular-nums"
                      />
                      <FieldError text={fieldErrors[`variants.${index}.cost_price`]?.[0]} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {isEdit && (
            <section className="space-y-3 p-6">
              <h2 className="text-sm font-semibold text-foreground">Status</h2>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={status === 'ACTIVE' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatus('ACTIVE')}
                >
                  Aktif
                </Button>
                <Button
                  type="button"
                  variant={status === 'INACTIVE' ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setStatus('INACTIVE')}
                >
                  Nonaktif
                </Button>
              </div>
            </section>
          )}

          <footer className="flex items-center justify-end gap-2 p-6">
            <Button type="button" variant="outline" asChild>
              <Link to="/products">Batal</Link>
            </Button>
            <Button type="submit" disabled={submitDisabled}>
              <Save aria-hidden />
              {mutation.isPending ? 'Menyimpan…' : 'Simpan produk'}
            </Button>
          </footer>
        </Card>
      </form>
    </div>
  )
}

export default function ProductFormPage() {
  const { productId } = useParams<{ productId: string }>()
  const isEdit = Boolean(productId)

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => getProduct(productId!),
    enabled: isEdit,
  })

  if (isEdit && isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  return <ProductForm key={product?.id ?? 'new'} product={product} productId={productId} />
}