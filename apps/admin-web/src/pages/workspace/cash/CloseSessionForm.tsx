import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'

import { FormField } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { apiErrorMessage } from '@/lib/form-errors'
import { formatRupiah, formatRupiahInput } from '@/lib/order-format'
import type { CashSession } from '@/types'

import { parseRupiah } from './utils'

export function CloseSessionForm({
  session,
  onChanged,
  onError,
}: {
  session: CashSession
  onChanged: () => void
  onError: (message: string) => void
}) {
  const [actualCash, setActualCash] = useState('')
  const [note, setNote] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (input: { actual_cash: number; variance_note?: string }) =>
      api.closeCashSession(session.id, input),
    onSuccess: () => {
      setActualCash('')
      setNote('')
      setFieldError(null)
      onChanged()
    },
    onError: (error) => {
      onError(
        apiErrorMessage(error, 'Session gagal ditutup. Pastikan actual cash benar lalu coba lagi.'),
      )
    },
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onError('')
    const amount = parseRupiah(actualCash)
    if (amount === null) {
      setFieldError('Masukkan uang fisik berupa angka rupiah penuh.')
      return
    }
    setFieldError(null)
    mutation.mutate({ actual_cash: amount, variance_note: note || undefined })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-dagana-warning/40 bg-dagana-warning-container/30 p-4"
      aria-label="Tutup Cash Session"
    >
      <div className="space-y-1">
        <h4 className="text-sm font-semibold">Tutup session</h4>
        <p className="text-sm text-muted-foreground">
          Hitung uang fisik di laci. Expected cash saat ini{' '}
          <span className="font-semibold tabular-nums">{formatRupiah(session.expected_cash)}</span>{' '}
          dari server; variance dihitung backend sebagai actual − expected.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id={`actual-cash-${session.id}`}
          name={`actual-cash-${session.id}`}
          label="Uang fisik di laci (Rp)"
          inputMode="numeric"
          placeholder="0"
          value={formatRupiahInput(actualCash)}
          onChange={(event) => setActualCash(formatRupiahInput(event.target.value))}
        />
        <FormField
          id={`variance-note-${session.id}`}
          name={`variance-note-${session.id}`}
          label="Catatan selisih (opsional)"
          placeholder="contoh: uang dipakai membeli gas"
          maxLength={1000}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </div>
      {fieldError && (
        <p className="text-sm text-destructive" role="alert">
          {fieldError}
        </p>
      )}
      <Button type="submit" className="min-h-11" disabled={mutation.isPending}>
        {mutation.isPending ? 'Menutup session...' : 'Tutup session'}
      </Button>
    </form>
  )
}
