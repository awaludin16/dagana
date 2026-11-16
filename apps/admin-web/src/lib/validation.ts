import { z } from 'zod'

const requiredText = (label: string, max = 255) =>
  z.string().trim().min(1, `${label} wajib diisi.`).max(max, `${label} maksimal ${max} karakter.`)

const addressSchema = z.object({
  street: requiredText('Jalan'),
  village: requiredText('Desa/Kelurahan'),
  district: requiredText('Kecamatan'),
  regency: requiredText('Kabupaten/Kota'),
  province: requiredText('Provinsi'),
  postal_code: z
    .string()
    .trim()
    .min(1, 'Kode pos wajib diisi.')
    .max(10, 'Kode pos maksimal 10 karakter.')
    .regex(/^\d+$/, 'Kode pos hanya boleh berisi angka.'),
})

export const loginSchema = z.object({
  email: requiredText('Email').email('Format email belum valid.'),
  password: z.string().min(1, 'Kata sandi wajib diisi.'),
})

export const registerSchema = z
  .object({
    name: requiredText('Nama lengkap'),
    email: requiredText('Email').email('Format email belum valid.'),
    password: z.string().min(8, 'Kata sandi minimal 8 karakter.'),
    password_confirmation: z.string().min(1, 'Ulangi kata sandi.'),
  })
  .refine((values) => values.password === values.password_confirmation, {
    path: ['password_confirmation'],
    message: 'Kata sandi belum sama.',
  })

export const businessNameSchema = z.object({
  name: requiredText('Nama business'),
})

export const categorySchema = z.object({
  name: requiredText('Nama kategori'),
  is_active: z.boolean(),
})

export const productSchema = z.object({
  name: requiredText('Nama menu'),
  price: z
    .number({ message: 'Harga wajib diisi.' })
    .int('Harga harus berupa Rupiah utuh.')
    .safe()
    .nonnegative('Harga tidak boleh negatif.'),
  category_id: z.number().int().positive().nullable(),
  is_active: z.boolean(),
  is_available: z.boolean(),
})

export const inventoryItemSchema = z.object({
  outlet_id: z.number({ message: 'Pilih outlet.' }).int().positive('Pilih outlet terlebih dahulu.'),
  name: requiredText('Nama item'),
  unit: requiredText('Satuan', 20),
  low_stock_threshold: z
    .number({ message: 'Ambang low stock harus berupa angka.' })
    .int('Ambang low stock harus bilangan bulat.')
    .min(0, 'Ambang low stock tidak boleh negatif.')
    .max(4294967295, 'Ambang low stock terlalu besar.')
    .nullable(),
  is_active: z.boolean(),
})

export const outletSchema = z.object({
  name: requiredText('Nama outlet'),
  phone: requiredText('Nomor telepon', 30),
  address: addressSchema,
})

export const onboardingSchema = z.object({
  business: z.object({ name: requiredText('Nama Business') }),
  outlet: outletSchema,
})

export const memberSchema = z
  .object({
    mode: z.enum(['create', 'update']),
    name: z.string().trim().max(255, 'Nama maksimal 255 karakter.'),
    email: z.string().trim().max(255, 'Email maksimal 255 karakter.'),
    password: z.string(),
    role: z.enum(['MANAGER', 'CASHIER'], { message: 'Pilih role Manager atau Kasir.' }),
    outlet_ids: z.array(z.number()).min(1, 'Pilih minimal satu outlet.'),
  })
  .superRefine((values, context) => {
    if (values.mode !== 'create') return

    if (!values.name) {
      context.addIssue({ code: 'custom', path: ['name'], message: 'Nama wajib diisi.' })
    }

    if (!values.email) {
      context.addIssue({ code: 'custom', path: ['email'], message: 'Email wajib diisi.' })
    } else if (!z.email().safeParse(values.email).success) {
      context.addIssue({ code: 'custom', path: ['email'], message: 'Format email belum valid.' })
    }

    if (values.password.length < 8) {
      context.addIssue({
        code: 'custom',
        path: ['password'],
        message: 'Kata sandi minimal 8 karakter.',
      })
    }
  })

export type LoginFormValues = z.infer<typeof loginSchema>
export type RegisterFormValues = z.infer<typeof registerSchema>
export type BusinessNameFormValues = z.infer<typeof businessNameSchema>
export type CategoryFormValues = z.infer<typeof categorySchema>
export type ProductFormValues = z.infer<typeof productSchema>
export type InventoryItemFormValues = z.infer<typeof inventoryItemSchema>
export type OutletFormValues = z.infer<typeof outletSchema>
export type OnboardingFormValues = z.infer<typeof onboardingSchema>
export type MemberFormValues = z.infer<typeof memberSchema>
