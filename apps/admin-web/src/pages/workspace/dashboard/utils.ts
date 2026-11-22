import { tableFeatures } from '@tanstack/react-table'

import type { Order } from '@/types'

// Owner Dashboard (PRD): Today's Sales, Transactions, Cash Status,
// Recent Orders, primary action "Mulai Jualan". Semua angka dari endpoint
// reporting/list yang sudah ada; frontend tidak menghitung ulang agregasi.
export const TREND_DAYS = 7
export const WIDGET_PER_PAGE = 50
export const EMPTY_ORDERS: Order[] = []

// TanStack Table v9: fitur bersifat opt-in; tabel terbaru tidak butuh sorting.
export const tableFeatureSet = tableFeatures({})

// shortcut: tanggal trend dihitung sekali saat modul dimuat; sesi lintas tengah
// malam butuh reload halaman untuk memperbarui "hari ini".
export const TODAY = toISODate(new Date())
export const WEEK_AGO = toISODateDaysAgo(TREND_DAYS - 1)

export const compactNumber = new Intl.NumberFormat('id-ID', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

export function toISODate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function toISODateDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return toISODate(date)
}

export function formatDayLabel(date: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${date}T00:00:00`))
}

export function timeGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 11) return 'Selamat pagi'
  if (hour < 15) return 'Selamat siang'
  if (hour < 19) return 'Selamat sore'
  return 'Selamat malam'
}

export function outletLabel(outlets: { id: number; name: string }[], outletId: number): string {
  return outlets.find((outlet) => outlet.id === outletId)?.name ?? `Outlet ${outletId}`
}
