import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EmptyState } from '@/components/states/EmptyState'
import { Coins } from '@phosphor-icons/react'
import { cashSession } from '../mocks/cash'
import { useState } from 'react'

export function CashPage() {
  const [opening, setOpening] = useState('500000')

  if (!cashSession) {
    return (
      <div className="mx-auto max-w-md space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-lg font-semibold tracking-tight">Buka Kas</h1>
          <p className="text-sm text-muted-foreground">Masukkan saldo awal sesuai uang fisik.</p>
        </div>
        <div className="space-y-4 rounded-lg border bg-card p-4">
          <div className="space-y-2">
            <Label htmlFor="opening">Saldo awal</Label>
            <Input
              id="opening"
              type="number"
              inputMode="numeric"
              value={opening}
              onChange={(e) => setOpening(e.target.value)}
              className="tabular-nums"
            />
            <p className="text-xs text-muted-foreground">
              Rp {Number(opening || 0).toLocaleString('id-ID')}
            </p>
          </div>
          <Button variant="default" className="w-full">
            Buka Kas
          </Button>
        </div>
      </div>
    )
  }

  return (
    <EmptyState
      title="Kas Belum Dibuka"
      description="Buka kas terlebih dahulu untuk menerima pembayaran tunai."
      icon={<Coins className="size-10" weight="duotone" />}
      action={<Button variant="default">Buka Kas</Button>}
    />
  )
}
