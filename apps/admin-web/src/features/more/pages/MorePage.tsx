import { EmptyState } from '@/components/states/EmptyState'
import { DotsThreeCircle } from '@phosphor-icons/react'

export function MorePage() {
  return (
    <EmptyState
      title="Lainnya"
      description="Karyawan, Pengaturan, Billing & Audit akan tersedia sesuai fase."
      icon={<DotsThreeCircle className="size-10" weight="duotone" />}
    />
  )
}
