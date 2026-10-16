import { EmptyState } from '@/components/states/EmptyState'
import { ClipboardText } from '@phosphor-icons/react'

export function OrdersPage() {
  return (
    <EmptyState
      title="Belum ada pesanan"
      description="Pesanan akan muncul saat transaksi terjadi."
      icon={<ClipboardText className="size-10" weight="duotone" />}
    />
  )
}
