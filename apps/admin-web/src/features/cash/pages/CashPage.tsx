import { EmptyState } from '@/components/states/EmptyState'
import { Coins } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

export function CashPage() {
  return (
    <EmptyState
      title="Kas Belum Dibuka"
      description="Buka kas terlebih dahulu untuk menerima pembayaran tunai."
      icon={<Coins className="size-10" weight="duotone" />}
      action={<Button variant="default">Buka Kas</Button>}
    />
  )
}
