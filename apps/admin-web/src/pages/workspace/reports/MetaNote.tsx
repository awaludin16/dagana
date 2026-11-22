import { formatNumber } from '@/lib/order-format'

export function MetaNote({ shown, total }: { shown: number; total: number }) {
  if (total <= shown) return null

  return (
    <p className="text-xs text-muted-foreground">
      Menampilkan {formatNumber(shown)} dari {formatNumber(total)} entri pertama pada periode ini.
    </p>
  )
}
