import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'

import { FormField } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { apiErrorMessage } from '@/lib/form-errors'
import { formatRupiahInput } from '@/lib/order-format'

import { parseRupiah } from './utils'

export function OpenSessionForm({
  outlets,
  defaultOutletId,
  onOpened,
  onError,
}: {
  outlets: { id: number; name: string }[]
  defaultOutletId: number | undefined
  onOpened: () => void
  onError: (message: string) => void
}) {
  const [outletId, setOutletId] = useState(defaultOutletId ? String(defaultOutletId) : '')
  const [openingCash, setOpeningCash] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (input: { outlet_id: number; opening_cash: number }) => api.openCashSession(input),
    onSuccess: () => {
      setOpeningCash('')
      setFieldError(null)
      onOpened()
    },
    onError: (error) => {
      onError(apiErrorMessage(error, 'Session gagal dibuka. Periksa data lalu coba lagi.'))
    },
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onError('')
    const amount = parseRupiah(openingCash)
    if (!outletId) {
      setFieldError('Pilih outlet terlebih dahulu.')
      return
    }
    if (amount === null) {
      setFieldError('Masukkan nominal kas awal berupa angka rupiah penuh.')
      return
    }
    setFieldError(null)
    mutation.mutate({ outlet_id: Number(outletId), opening_cash: amount })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border bg-card p-4 sm:p-5"
      aria-label="Buka Cash Session baru"
    >
      <div className="space-y-1">
        <h2 className="text-section-title">Buka session baru</h2>
        <p className="text-sm text-muted-foreground">
          Satu session aktif per operator per outlet. Kas awal dicatat sebagai titik awal ledger.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="open-outlet" className="text-sm font-medium">
            Outlet
          </label>
          <select
            id="open-outlet"
            value={outletId}
            onChange={(event) => setOutletId(event.target.value)}
            className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none transition focus-visible:ring-[3px] focus-visible:ring-ring/40"
          >
            <option value="">Pilih outlet</option>
            {outlets.map((outlet) => (
              <option key={outlet.id} value={outlet.id}>
                {outlet.name}
              </option>
            ))}
          </select>
          {fieldError && (
            <p className="text-sm text-destructive" role="alert">
              {fieldError}
            </p>
          )}
        </div>
        <FormField
          id="opening-cash"
          name="opening_cash"
          label="Kas awal (Rp)"
          inputMode="numeric"
          placeholder="0"
          hint="Angka rupiah penuh tanpa pecahan."
          value={formatRupiahInput(openingCash)}
          onChange={(event) => setOpeningCash(formatRupiahInput(event.target.value))}
        />
      </div>
      <Button type="submit" className="min-h-11" disabled={mutation.isPending}>
        {mutation.isPending ? 'Membuka session...' : 'Buka session'}
      </Button>
    </form>
  )
}
