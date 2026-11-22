import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'

import { useAccess } from '@/auth/useAccess'
import { FormField } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { apiErrorMessage } from '@/lib/form-errors'
import { formatRupiahInput } from '@/lib/order-format'
import type { CashMovementInput, CashSession } from '@/types'

import { parseRupiah } from './utils'

const MOVEMENT_OPTIONS: { value: CashMovementInput['type']; label: string }[] = [
  { value: 'CASH_IN', label: 'Kas masuk' },
  { value: 'CASH_OUT', label: 'Kas keluar' },
  { value: 'REFUND', label: 'Refund' },
  { value: 'ADJUSTMENT', label: 'Penyesuaian' },
]

export function MovementForm({
  session,
  onChanged,
  onError,
}: {
  session: CashSession
  onChanged: () => void
  onError: (message: string) => void
}) {
  const access = useAccess()
  const queryClient = useQueryClient()
  const [type, setType] = useState<CashMovementInput['type'] | null>(null)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (input: CashMovementInput) => api.createCashMovement(session.id, input),
    onSuccess: () => {
      setAmount('')
      setReason('')
      setFieldError(null)
      onChanged()
      void queryClient.invalidateQueries({ queryKey: ['cash-movements', session.id] })
    },
    onError: (error) => {
      onError(apiErrorMessage(error, 'Aktivitas kas gagal dicatat. Coba lagi.'))
    },
  })

  const allowedOptions = MOVEMENT_OPTIONS.filter((option) => {
    if (option.value === 'CASH_IN') return access.can('cash.cash_in')
    if (option.value === 'CASH_OUT') return access.can('cash.cash_out')
    // REFUND dan ADJUSTMENT memakai cash.reconcile (D-31).
    return access.can('cash.reconcile')
  })

  const activeType = allowedOptions.some((option) => option.value === type)
    ? (type as CashMovementInput['type'])
    : allowedOptions[0]?.value

  if (allowedOptions.length === 0 || activeType === undefined) return null

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onError('')
    const value = activeType === 'ADJUSTMENT' ? Number(amount) : parseRupiah(amount)
    if (value === null || !Number.isInteger(value) || value === 0) {
      setFieldError(
        activeType === 'ADJUSTMENT'
          ? 'Penyesuaian berupa angka bertanda (boleh minus) dan tidak boleh nol.'
          : 'Masukkan nominal berupa angka rupiah penuh lebih dari nol.',
      )
      return
    }
    setFieldError(null)
    mutation.mutate({ type: activeType, amount: value, reason: reason || undefined })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border bg-muted/30 p-4"
      aria-label="Catat aktivitas kas"
    >
      <h4 className="text-sm font-semibold">Catat aktivitas kas</h4>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label htmlFor={`movement-type-${session.id}`} className="text-sm font-medium">
            Jenis
          </label>
          <select
            id={`movement-type-${session.id}`}
            value={activeType}
            onChange={(event) => setType(event.target.value as CashMovementInput['type'])}
            className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none transition focus-visible:ring-[3px] focus-visible:ring-ring/40"
          >
            {allowedOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <FormField
          id={`movement-amount-${session.id}`}
          name={`movement-amount-${session.id}`}
          label={type === 'ADJUSTMENT' ? 'Nominal (± Rp)' : 'Nominal (Rp)'}
          inputMode={type === 'ADJUSTMENT' ? 'text' : 'numeric'}
          placeholder={type === 'ADJUSTMENT' ? 'contoh: -5000' : '0'}
          value={type === 'ADJUSTMENT' ? amount : formatRupiahInput(amount)}
          onChange={(event) =>
            // ADJUSTMENT boleh negatif ("-5000"), tidak dilewati formatter digit.
            setAmount(
              type === 'ADJUSTMENT' ? event.target.value : formatRupiahInput(event.target.value),
            )
          }
        />
        <FormField
          id={`movement-reason-${session.id}`}
          name={`movement-reason-${session.id}`}
          label="Keterangan (opsional)"
          value={reason}
          maxLength={1000}
          onChange={(event) => setReason(event.target.value)}
        />
      </div>
      {fieldError && (
        <p className="text-sm text-destructive" role="alert">
          {fieldError}
        </p>
      )}
      <Button type="submit" variant="outline" className="min-h-11" disabled={mutation.isPending}>
        {mutation.isPending ? 'Menyimpan...' : 'Catat aktivitas'}
      </Button>
    </form>
  )
}
