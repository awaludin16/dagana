import { z } from 'zod'

const requiredText = (label: string, max = 255) =>
  z.string().trim().min(1, `${label} wajib diisi.`).max(max, `${label} maksimal ${max} karakter.`)

const optionalText = (max = 255) =>
  z.string().trim().max(max, `Maksimal ${max} karakter.`).nullable()

const addressSchema = z.object({
  street: optionalText(),
  village: optionalText(),
  district: optionalText(),
  regency: optionalText(),
  province: optionalText(),
  postal_code: z
    .string()
    .trim()
    .max(10, 'Kode pos maksimal 10 karakter.')
    .regex(/^\d*$/, 'Kode pos hanya boleh berisi angka.')
    .nullable(),
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

export const outletSchema = z.object({
  name: requiredText('Nama outlet'),
  phone: optionalText(30),
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
export type OutletFormValues = z.infer<typeof outletSchema>
export type OnboardingFormValues = z.infer<typeof onboardingSchema>
export type MemberFormValues = z.infer<typeof memberSchema>
