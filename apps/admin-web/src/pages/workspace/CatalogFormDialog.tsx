import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { FormField } from '@/components/FormField'
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
import { formatRupiahInput } from '@/lib/order-format'
import {
  categorySchema,
  productSchema,
  type CategoryFormValues,
  type ProductFormValues,
} from '@/lib/validation'
import type { Category, CategoryInput, Product, ProductInput } from '@/types'

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
  isSaving: boolean
  onClose: () => void
  onSubmit: (input: ProductInput) => Promise<void>
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

function ProductFormDialog({ item, categories, isSaving, onClose, onSubmit }: ProductDialogProps) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: item?.name ?? '',
      price: item?.price ?? 0,
      category_id: item?.category_id ?? null,
      is_active: item?.is_active ?? true,
      is_available: item?.is_available ?? true,
    },
  })

  async function save(values: ProductFormValues) {
    try {
      await onSubmit(values)
    } catch (error) {
      if (!applyApiErrors(error, form.setError)) {
        form.setError('root.server', {
          message: apiErrorMessage(error, 'Menu belum dapat disimpan. Coba lagi.'),
        })
      }
    }
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
          <div className="space-y-1.5">
            <label htmlFor="product-category" className="text-sm font-medium">
              Kategori
            </label>
            <select
              id="product-category"
              className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
              {...form.register('category_id', {
                setValueAs: (value) => (value === '' ? null : Number(value)),
              })}
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
              Tersedia untuk dijual
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Batal
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
