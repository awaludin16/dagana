// Nominal rupiah penuh: buang nol berlebih dan pecahan; backend validasi ulang sebagai integer.
export function parseRupiah(value: string): number | null {
  const parsed = Number.parseInt(value.replace(/\D/g, ''), 10)
  return Number.isNaN(parsed) ? null : parsed
}
