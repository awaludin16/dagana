import { isAxiosError } from 'axios'

interface ApiErrorBody {
  message?: string
  errors?: Record<string, string[]>
}

/** Pesan kesalahan pertama dari respons API, atau fallback yang dapat dilakukan user. */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError<ApiErrorBody>(error)) {
    const fieldMessages = Object.values(error.response?.data?.errors ?? {}).flat()
    return fieldMessages[0] ?? error.response?.data?.message ?? fallback
  }
  return error instanceof Error && error.message ? error.message : fallback
}
