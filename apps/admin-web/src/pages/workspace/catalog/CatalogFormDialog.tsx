import { zodResolver } from '@hookform/resolvers/zod'
import { ImageIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

import { FormField } from '@/components/FormField'
import { ProductStatus } from '@/components/ProductPresentation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { apiErrorMessage, applyApiErrors, getFieldError } from '@/lib/form-errors'
import { formatRupiah, formatRupiahInput } from '@/lib/order-format'
import {
  categorySchema,
  productSchema,
  type CategoryFormValues,
  type ProductFormValues,
} from '@/lib/validation'
import type { Category, CategoryInput, Product, ProductInput } from '@/types'

import { StockCell } from './StockCell'

type CategoryDialogProps = {
  kind: 'category'
  item?: Category
  isSaving: boolean
  onClose: () => void
  onSubmit: (input: CategoryInput) => Promise<void>
}

type ProductDialogProps = {
  kind: 'product'
  item?: Product
  categories: Category[]
  initialStockOutletId?: number
  outletId?: number
  outletName?: string
  canUpdate: boolean
  canUpdateStock: boolean
  isSaving: boolean
  onClose: () => void
  onSubmit: (input: ProductInput, images: ProductImageChanges) => Promise<void>
  onEditStock: (item: Product) => void
  onDeactivate: (item: Product) => void
  onActivate: (item: Product) => void
}

export type ProductImageChanges = {
  imageFile?: File
  removeImage: boolean
}

export function CatalogFormDialog(props: CategoryDialogProps | ProductDialogProps) {
  if (props.kind === 'category') return <CategoryFormDialog {...props} />
  return <ProductFormDialog {...props} />
}

function CategoryFormDialog({ item, isSaving, onClose, onSubmit }: CategoryDialogProps) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: item?.name ?? '', is_active: item?.is_active ?? true },
  })

  async function save(values: CategoryFormValues) {
    try {
      await onSubmit(values)
    } catch (error) {
      if (!applyApiErrors(error, form.setError)) {
        form.setError('root.server', {
          message: apiErrorMessage(error, 'Kategori belum dapat disimpan. Coba lagi.'),
        })
      }
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !isSaving && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? 'Ubah kategori' : 'Tambah kategori'}</DialogTitle>
          <DialogDescription>Kelompokkan menu tanpa pengaturan tambahan.</DialogDescription>
        </DialogHeader>
        <form className="space-y-5" onSubmit={form.handleSubmit(save)} noValidate>
          {form.formState.errors.root?.server ? (
            <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {form.formState.errors.root.server.message}
            </p>
          ) : null}
          <FormField
            id="category-name"
            label="Nama kategori"
            autoComplete="off"
            {...form.register('name')}
            error={getFieldError(form.formState.errors, 'name')}
          />
          <label htmlFor="category-is-active" className="flex min-h-11 items-center gap-3 text-sm">
            <input
              id="category-is-active"
              type="checkbox"
              className="size-4 accent-primary focus-visible:ring-2 focus-visible:ring-ring"
              {...form.register('is_active')}
            />
            Kategori aktif
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Batal
            </Button>
            <Button type="submit" disabled={isSaving} className="min-h-11">
              {isSaving ? 'Menyimpan...' : 'Simpan kategori'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ProductFormDialog({
  item,
  categories,
  initialStockOutletId,
  outletId,
  outletName,
  canUpdate,
  canUpdateStock,
  isSaving,
  onClose,
  onSubmit,
  onEditStock,
  onDeactivate,
  onActivate,
}: ProductDialogProps) {
  const [editing, setEditing] = useState(!item)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const imageInput = useRef<HTMLInputElement>(null)

  const showInitialStock = !item && initialStockOutletId !== undefined
  const available = item?.is_available ?? true
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: item?.name ?? '',
      price: item?.price ?? 0,
      category_id: item?.category_id ?? null,
      is_active: item?.is_active ?? true,
      is_available: available,
      initial_stock: null,
      initial_stock_outlet_id: showInitialStock ? initialStockOutletId : null,
    },
  })

  useEffect(() => {
    if (!imageFile) {
      setPreview(null)
      return
    }

    const url = URL.createObjectURL(imageFile)
    setPreview(url)

    return () => URL.revokeObjectURL(url)
  }, [imageFile])

  const currentImage = preview ?? (removeImage ? null : (item?.image_url ?? null))

  function chooseImage(file: File | null) {
    setImageError(null)
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setImageError('Format gambar harus JPEG, PNG, atau WebP.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError('Ukuran gambar maksimal 5 MB.')
      return
    }

    setRemoveImage(false)
    setImageFile(file)
  }

  function clearImage() {
    setImageError(null)
    setImageFile(null)
    setRemoveImage(true)
    if (imageInput.current) imageInput.current.value = ''
  }

  async function save(values: ProductFormValues) {
    try {
      await onSubmit(
        {
          name: values.name,
          price: values.price,
          category_id: values.category_id,
          is_active: values.is_active,
          is_available: values.is_available,
          ...(showInitialStock && values.initial_stock != null
            ? {
                initial_stock: values.initial_stock,
                initial_stock_outlet_id: initialStockOutletId,
              }
            : {}),
        },
        { imageFile: imageFile ?? undefined, removeImage: item ? removeImage : false },
      )
    } catch (error) {
      if (!applyApiErrors(error, form.setError)) {
        form.setError('root.server', {
          message: apiErrorMessage(error, 'Menu belum dapat disimpan. Coba lagi.'),
        })
      }
    }
  }

  if (item && !editing) {
    return (
      <Dialog open onOpenChange={(open) => !open && !isSaving && onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detail menu</DialogTitle>
            <DialogDescription>Periksa informasi menu sebelum mengubahnya.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={`Gambar ${item.name}`}
                className="aspect-video w-full rounded-lg border object-cover"
              />
            ) : (
              <div className="flex aspect-[3/1] items-center justify-center rounded-lg border bg-muted text-muted-foreground">
                <ImageIcon aria-hidden="true" className="size-8" />
                <span className="sr-only">Menu ini belum memiliki gambar.</span>
              </div>
            )}
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Nama menu</dt>
                <dd className="font-medium">{item.name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Harga</dt>
                <dd className="tabular-nums">{formatRupiah(item.price)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Kategori</dt>
                <dd>{item.category?.name ?? 'Tanpa kategori'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd className="mt-1">
                  <ProductStatus item={item} outletSelected={outletId !== undefined} />
                </dd>
              </div>
              {outletId !== undefined ? (
                <div>
                  <dt className="text-muted-foreground">Stok di {outletName ?? 'outlet ini'}</dt>
                  <dd className="mt-1 flex flex-wrap items-center gap-2">
                    <StockCell item={item} />
                    {item.low_stock_threshold != null ? (
                      <span className="text-muted-foreground">
                        Batas menipis: {item.low_stock_threshold}
                      </span>
                    ) : null}
                  </dd>
                </div>
              ) : null}
            </dl>
            <div className="flex flex-wrap gap-2">
              {outletId !== undefined && canUpdateStock ? (
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  onClick={() => onEditStock(item)}
                >
                  Ubah stok
                </Button>
              ) : null}
              {canUpdate ? (
                <>
                  <Button type="button" className="min-h-11" onClick={() => setEditing(true)}>
                    Ubah menu
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11"
                    onClick={() => (item.is_active ? onDeactivate(item) : onActivate(item))}
                  >
                    {item.is_active ? 'Nonaktifkan' : 'Aktifkan kembali'}
                  </Button>
                </>
              ) : null}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="min-h-11">
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !isSaving && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? 'Ubah menu' : 'Tambah menu'}</DialogTitle>
          <DialogDescription>
            Harga menggunakan Rupiah utuh dan berlaku untuk semua outlet.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-5" onSubmit={form.handleSubmit(save)} noValidate>
          {form.formState.errors.root?.server ? (
            <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {form.formState.errors.root.server.message}
            </p>
          ) : null}
          <FormField
            id="product-name"
            label="Nama menu"
            autoComplete="off"
            {...form.register('name')}
            error={getFieldError(form.formState.errors, 'name')}
          />
          <FormField
            id="product-price"
            label="Harga (Rp)"
            inputMode="numeric"
            autoComplete="off"
            value={formatRupiahInput(String(form.watch('price') ?? ''))}
            onChange={(event) => {
              // Empty string jadi NaN agar tetap gagal validasi "Harga wajib diisi."
              const digits = event.target.value.replace(/\D/g, '')
              form.setValue('price', digits === '' ? Number.NaN : Number(digits))
            }}
            error={getFieldError(form.formState.errors, 'price')}
            hint="Masukkan angka Rupiah utuh, tanpa desimal."
          />
          <div className="space-y-2">
            <label htmlFor="product-image" className="text-sm font-medium">
              Gambar menu
            </label>
            <div className="flex flex-wrap items-center gap-3">
              {currentImage ? (
                <img
                  src={currentImage}
                  alt="Pratinjau gambar menu"
                  className="size-20 rounded-lg border object-cover"
                />
              ) : (
                <div className="flex size-20 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
                  <ImageIcon aria-hidden="true" className="size-6" />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <input
                  ref={imageInput}
                  id="product-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="block w-full max-w-64 text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
                  onChange={(event) => chooseImage(event.target.files?.[0] ?? null)}
                />
                {currentImage ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11"
                    onClick={clearImage}
                    disabled={isSaving}
                  >
                    Hapus gambar
                  </Button>
                ) : null}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              JPEG, PNG, atau WebP. Maksimal 5 MB dan dimensi 4096 x 4096 piksel.
            </p>
            {imageError ? (
              <p role="alert" className="text-sm text-destructive">
                {imageError}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="product-category" className="text-sm font-medium">
              Kategori
            </label>
            <select
              id="product-category"
              className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
              value={form.watch('category_id') ?? ''}
              onChange={(event) =>
                form.setValue(
                  'category_id',
                  event.target.value === '' ? null : Number(event.target.value),
                  { shouldValidate: true, shouldDirty: true },
                )
              }
              aria-invalid={Boolean(form.formState.errors.category_id)}
              aria-describedby={
                form.formState.errors.category_id ? 'product-category-error' : undefined
              }
            >
              <option value="">Tanpa kategori</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                  {category.is_active ? '' : ' (nonaktif)'}
                </option>
              ))}
            </select>
            {form.formState.errors.category_id ? (
              <p id="product-category-error" role="alert" className="text-sm text-destructive">
                Kategori tidak valid.
              </p>
            ) : null}
          </div>
          {showInitialStock ? (
            <FormField
              id="product-initial-stock"
              label="Stok awal (opsional)"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              value={form.watch('initial_stock') ?? ''}
              onChange={(event) =>
                form.setValue(
                  'initial_stock',
                  event.target.value === '' ? null : Number(event.target.value),
                  { shouldValidate: true, shouldDirty: true },
                )
              }
              error={
                getFieldError(form.formState.errors, 'initial_stock') ??
                getFieldError(form.formState.errors, 'initial_stock_outlet_id') ??
                undefined
              }
              hint="Kosongkan bila stok tidak dipantau. Batas menipis otomatis 10 porsi."
            />
          ) : null}
          <div className="grid gap-2 sm:grid-cols-2">
            <label htmlFor="product-is-active" className="flex min-h-11 items-center gap-3 text-sm">
              <input
                id="product-is-active"
                type="checkbox"
                className="size-4 accent-primary focus-visible:ring-2 focus-visible:ring-ring"
                {...form.register('is_active')}
              />
              Menu aktif
            </label>
            <label
              htmlFor="product-is-available"
              className="flex min-h-11 items-center gap-3 text-sm"
            >
              <input
                id="product-is-available"
                type="checkbox"
                className="size-4 accent-primary focus-visible:ring-2 focus-visible:ring-ring"
                {...form.register('is_available')}
              />
              {item ? 'Tersedia untuk semua outlet' : 'Tersedia untuk dijual'}
            </label>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={item ? () => setEditing(false) : onClose}
              disabled={isSaving}
            >
              {item ? 'Kembali' : 'Batal'}
            </Button>
            <Button type="submit" disabled={isSaving} className="min-h-11">
              {isSaving ? 'Menyimpan...' : 'Simpan menu'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
