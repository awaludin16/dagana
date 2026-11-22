// Backend membatasi rentang 92 hari dan per_page maks 100 (api-design §12).
export const MAX_REPORT_DAYS = 92
export const REPORT_PER_PAGE = 50

export function toISODate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function defaultFrom(): string {
  const date = new Date()
  date.setDate(date.getDate() - 6)
  return toISODate(date)
}

export function rangeDays(from: string, to: string): number {
  return Math.floor((Date.parse(to) - Date.parse(from)) / 86_400_000) + 1
}

export function formatDayLabel(date: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${date}T00:00:00`))
}
