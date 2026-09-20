// Format angka & tanggal mengikuti lokalisasi id-ID (design system §9.7).

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

const numberFormat = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 })

const dateFormat = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const timeFormat = new Intl.DateTimeFormat('id-ID', {
  hour: '2-digit',
  minute: '2-digit',
})

const dateTimeFormat = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

/** 18000 → "Rp 18.000" */
export function formatRupiah(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  return rupiah.format(Number(value))
}

/** 1234.5 → "1.234,5" */
export function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  return numberFormat.format(Number(value))
}

/** `2026-09-20T10:30:00` → "20 Sep 2026" */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—'
  return dateFormat.format(toDate(value))
}

/** `2026-09-20T10:30:00` → "10.30" */
export function formatTime(value: string | Date | null | undefined): string {
  if (!value) return '—'
  return timeFormat.format(toDate(value))
}

/** `2026-09-20T10:30:00` → "20 Sep 2026, 10.30" */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—'
  return dateTimeFormat.format(toDate(value))
}

/** "baru saja", "5 mnt lalu", "2 jam lalu", "3 hari lalu", lalu fallback tanggal. */
export function formatRelative(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const diffMinutes = Math.floor((Date.now() - toDate(value).getTime()) / 60_000)
  if (diffMinutes < 1) return 'baru saja'
  if (diffMinutes < 60) return `${diffMinutes} mnt lalu`
  const hours = Math.floor(diffMinutes / 60)
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} hari lalu`
  return formatDate(value)
}

function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value)
}