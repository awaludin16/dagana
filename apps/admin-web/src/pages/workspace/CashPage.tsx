import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'

import { useAccess } from '@/auth/useAccess'
import { ErrorState, LoadingState } from '@/components/PageFeedback'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/FormField'
import {
  cashSessionStatusClass,
  cashSessionStatusLabel,
  formatSignedRupiah,
  movementTypeLabel,
  varianceClass,
  varianceLabel,
} from '@/lib/cash-format'
import { api } from '@/lib/api'
import { apiErrorMessage } from '@/lib/form-errors'
import { formatOrderDate, formatRupiah } from '@/lib/order-format'
import type { CashMovement, CashMovementInput, CashSession } from '@/types'

const LEDGER_PER_PAGE = 50

// Nominal rupiah penuh: buang nol berlebih dan pecahan; backend validasi ulang sebagai integer.
function parseRupiah(value: string): number | null {
  const parsed = Number.parseInt(value.replace(/\D/g, ''), 10)
  return Number.isNaN(parsed) ? null : parsed
}

export function CashPage() {
  const access = useAccess()
  const queryClient = useQueryClient()
  const outlets = access.membership?.outlets ?? []

  const [outletFilter, setOutletFilter] = useState('')
  const [openError, setOpenError] = useState<string | null>(null)

  const openSessions = useQuery({
    queryKey: ['cash-sessions', 'open', outletFilter],
    queryFn: () =>
      api.cashSessions({
        status: 'OPEN',
        outlet_id: outletFilter ? Number(outletFilter) : undefined,
        per_page: 50,
      }),
  })

  const closedSessions = useQuery({
    queryKey: ['cash-sessions', 'closed', outletFilter],
    queryFn: () =>
      api.cashSessions({
        status: 'CLOSED',
        outlet_id: outletFilter ? Number(outletFilter) : undefined,
        per_page: 20,
      }),
  })

  function refreshSessions() {
    void queryClient.invalidateQueries({ queryKey: ['cash-sessions'] })
  }

  if (openSessions.isPending || closedSessions.isPending) {
    return <LoadingState label="Memuat status kas..." />
  }

  if (openSessions.isError) {
    return (
      <ErrorState
        message={apiErrorMessage(
          openSessions.error,
          'Status kas belum dapat dimuat. Periksa koneksi lalu coba lagi.',
        )}
        onRetry={() => void openSessions.refetch()}
      />
    )
  }

  if (closedSessions.isError) {
    return (
      <ErrorState
        message={apiErrorMessage(
          closedSessions.error,
          'Riwayat kas belum dapat dimuat. Periksa koneksi lalu coba lagi.',
        )}
        onRetry={() => void closedSessions.refetch()}
      />
    )
  }

  const open = openSessions.data.data

  return (
    <section className="space-y-6">
      <header className="space-y-2 border-b pb-6">
        <p className="text-sm font-medium text-primary">Operasional</p>
        <h1 className="text-page-title tracking-tight">Kas</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Buka, pantau, dan tutup Cash Session. Expected cash, variance, dan saldo selalu dihitung
          server.
        </p>
      </header>

      {outlets.length > 1 && (
        <div className="max-w-xs">
          <label htmlFor="cash-outlet-filter" className="text-sm font-medium">
            Filter outlet
          </label>
          <select
            id="cash-outlet-filter"
            value={outletFilter}
            onChange={(event) => setOutletFilter(event.target.value)}
            className="mt-1.5 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none transition focus-visible:ring-[3px] focus-visible:ring-ring/40"
          >
            <option value="">Semua outlet</option>
            {outlets.map((outlet) => (
              <option key={outlet.id} value={outlet.id}>
                {outlet.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {openError && (
        <div
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm"
          role="alert"
        >
          {openError}
        </div>
      )}

      {access.can('cash.open') && (
        <OpenSessionForm
          outlets={outlets}
          defaultOutletId={outletFilter ? Number(outletFilter) : outlets[0]?.id}
          onOpened={refreshSessions}
          onError={(message) => {
            setOpenError(message)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
      )}

      <div className="space-y-3">
        <h2 className="text-section-title">Session aktif</h2>
        {open.length === 0 ? (
          <div
            className="rounded-xl border bg-card p-6 text-sm text-muted-foreground"
            role="status"
          >
            Belum ada Cash Session aktif{outletFilter ? ' untuk outlet ini' : ''}. Buka session
            untuk mulai mencatat arus kas.
          </div>
        ) : (
          open.map((session) => (
            <ActiveSessionCard
              key={session.id}
              session={session}
              outletName={outlets.find((outlet) => outlet.id === session.outlet_id)?.name}
              onChanged={refreshSessions}
            />
          ))
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-section-title">Riwayat & rekonsiliasi</h2>
        {closedSessions.data.data.length === 0 ? (
          <div
            className="rounded-xl border bg-card p-6 text-sm text-muted-foreground"
            role="status"
          >
            Belum ada session yang ditutup.
          </div>
        ) : (
          <ul className="space-y-3" aria-label="Daftar session kas yang ditutup">
            {closedSessions.data.data.map((session) => (
              <ClosedSessionItem
                key={session.id}
                session={session}
                outletName={outlets.find((outlet) => outlet.id === session.outlet_id)?.name}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

function OpenSessionForm({
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
          value={openingCash}
          onChange={(event) => setOpeningCash(event.target.value)}
        />
      </div>
      <Button type="submit" className="min-h-11" disabled={mutation.isPending}>
        {mutation.isPending ? 'Membuka session...' : 'Buka session'}
      </Button>
    </form>
  )
}

function ActiveSessionCard({
  session,
  outletName,
  onChanged,
}: {
  session: CashSession
  outletName?: string
  onChanged: () => void
}) {
  const access = useAccess()
  const [submitError, setSubmitError] = useState<string | null>(null)

  return (
    <article
      className="space-y-5 rounded-xl border bg-card p-4 sm:p-5"
      aria-label="Session kas aktif"
    >
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div className="space-y-1">
          <h3 className="text-section-title">Session #{session.id}</h3>
          <p className="text-sm text-muted-foreground">
            {outletName ?? `Outlet ${session.outlet_id}`} · Dibuka{' '}
            {formatOrderDate(session.opened_at)}
          </p>
        </div>
        <Badge className={cashSessionStatusClass(session.status)}>
          {cashSessionStatusLabel(session.status)}
        </Badge>
      </div>

      <dl className="grid gap-3 border-t pt-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Kas awal</dt>
          <dd className="mt-1 font-semibold tabular-nums">{formatRupiah(session.opening_cash)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Expected cash (server)</dt>
          <dd className="mt-1 font-semibold tabular-nums">{formatRupiah(session.expected_cash)}</dd>
        </div>
      </dl>

      {submitError && (
        <div
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm"
          role="alert"
        >
          {submitError}
        </div>
      )}

      <MovementForm session={session} onChanged={onChanged} onError={setSubmitError} />

      <SessionLedger session={session} />

      {access.can('cash.close') && (
        <CloseSessionForm session={session} onChanged={onChanged} onError={setSubmitError} />
      )}
    </article>
  )
}

const MOVEMENT_OPTIONS: { value: CashMovementInput['type']; label: string }[] = [
  { value: 'CASH_IN', label: 'Kas masuk' },
  { value: 'CASH_OUT', label: 'Kas keluar' },
  { value: 'REFUND', label: 'Refund' },
  { value: 'ADJUSTMENT', label: 'Penyesuaian' },
]

function MovementForm({
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
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
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

function SessionLedger({ session }: { session: CashSession }) {
  const ledger = useQuery({
    queryKey: ['cash-movements', session.id],
    queryFn: () => api.cashMovements(session.id, { per_page: LEDGER_PER_PAGE }),
  })

  if (ledger.isPending) return <LoadingState label="Memuat arus kas..." />
  if (ledger.isError) {
    return (
      <ErrorState
        message={apiErrorMessage(ledger.error, 'Arus kas belum dapat dimuat.')}
        onRetry={() => void ledger.refetch()}
      />
    )
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold">Arus kas (ledger server)</h4>
      {ledger.data.data.length === 0 ? (
        <p className="rounded-lg border bg-card p-3 text-sm text-muted-foreground" role="status">
          Belum ada aktivitas kas pada session ini.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border bg-card" aria-label="Ledger arus kas">
          {ledger.data.data.map((movement: CashMovement) => (
            <li key={movement.id} className="flex items-center justify-between gap-3 p-3 text-sm">
              <div className="min-w-0">
                <p className="font-medium">{movementTypeLabel(movement.type)}</p>
                <p className="truncate text-muted-foreground">
                  {formatOrderDate(movement.created_at)}
                  {movement.reason ? ` · ${movement.reason}` : ''}
                </p>
              </div>
              <p className="shrink-0 font-medium tabular-nums">
                {formatSignedRupiah(movement.amount)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function CloseSessionForm({
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
          value={actualCash}
          onChange={(event) => setActualCash(event.target.value)}
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

function ClosedSessionItem({ session, outletName }: { session: CashSession; outletName?: string }) {
  const variance = session.variance ?? 0

  return (
    <li className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div className="space-y-1">
          <h3 className="text-section-title">Session #{session.id}</h3>
          <p className="text-sm text-muted-foreground">
            {outletName ?? `Outlet ${session.outlet_id}`} · Ditutup{' '}
            {formatOrderDate(session.closed_at)}
          </p>
        </div>
        <Badge className={cashSessionStatusClass(session.status)}>
          {cashSessionStatusLabel(session.status)}
        </Badge>
      </div>

      <dl className="grid gap-3 border-t pt-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-muted-foreground">Kas awal</dt>
          <dd className="mt-1 font-medium tabular-nums">{formatRupiah(session.opening_cash)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Expected cash</dt>
          <dd className="mt-1 font-medium tabular-nums">{formatRupiah(session.expected_cash)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Actual cash</dt>
          <dd className="mt-1 font-medium tabular-nums">
            {session.actual_cash === null ? 'Tidak tersedia' : formatRupiah(session.actual_cash)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Variance ({varianceLabel(variance)})</dt>
          <dd className={`mt-1 font-semibold tabular-nums ${varianceClass(variance)}`}>
            {formatSignedRupiah(variance)}
          </dd>
        </div>
      </dl>

      {session.variance_note && (
        <p className="border-t pt-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Catatan operator:</span>{' '}
          {session.variance_note}
        </p>
      )}
    </li>
  )
}
