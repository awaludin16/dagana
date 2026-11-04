import type { FieldErrors, FieldPath, FieldValues, UseFormSetError } from 'react-hook-form'

import { ApiError } from '@/lib/api'

export function getFieldError<T extends FieldValues>(
  errors: FieldErrors<T>,
  path: string,
): string | undefined {
  const node = path.split('.').reduce<unknown>((current, key) => {
    if (current === null || typeof current !== 'object') return undefined
    return (current as Record<string, unknown>)[key]
  }, errors)

  if (node && typeof node === 'object' && 'message' in node && typeof node.message === 'string') {
    return node.message
  }

  return undefined
}

export function applyApiErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
): boolean {
  if (!(error instanceof ApiError)) return false

  const entries = Object.entries(error.errors)
  for (const [field, messages] of entries) {
    setError(field as FieldPath<T>, { type: 'server', message: messages[0] })
  }

  return entries.length > 0
}

export function hasFieldErrors(error: unknown): boolean {
  return error instanceof ApiError && Object.keys(error.errors).length > 0
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Sesi Anda berakhir. Silakan masuk kembali.'
    if (error.status === 403) return 'Anda tidak memiliki izin untuk melakukan tindakan ini.'
    if (error.status === 429) return 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.'
    if (error.status === 422) return fallback
  }

  if (error instanceof Error && error.message) return error.message
  return fallback
}
