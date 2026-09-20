import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Gabungkan class names dengan penyelesaian konflik ala Tailwind
 * (konvensi shadcn/ui). Wajib dipakai untuk className dinamis.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}