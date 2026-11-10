// Label arus kas mengikuti type ledger backend; nominal sudah bertanda dari server.

export function movementTypeLabel(type: string): string {
  switch (type) {
    case 'CASH_SALE':
      return 'Penjualan tunai'
    case 'CASH_IN':
      return 'Kas masuk'
    case 'CASH_OUT':
      return 'Kas keluar'
    case 'REFUND':
      return 'Refund'
    case 'ADJUSTMENT':
      return 'Penyesuaian'
    default:
      return 'Aktivitas tidak dikenali'
  }
}

export function cashSessionStatusLabel(status: string): string {
  switch (status) {
    case 'OPEN':
      return 'Aktif'
    case 'CLOSED':
      return 'Ditutup'
    default:
      return 'Status tidak dikenali'
  }
}

export function cashSessionStatusClass(status: string): string {
  switch (status) {
    case 'OPEN':
      return 'border-dagana-success/20 bg-dagana-success-container text-dagana-success'
    case 'CLOSED':
      return 'border-dagana-info/20 bg-dagana-info-container text-dagana-info'
    default:
      return 'border-dagana-info/20 bg-dagana-info-container text-dagana-info'
  }
}

export function varianceLabel(variance: number): string {
  if (variance === 0) return 'Tepat'
  return variance > 0 ? 'Kelebihan' : 'Kekurangan'
}

export function varianceClass(variance: number): string {
  if (variance === 0) return 'text-dagana-success'
  return variance > 0 ? 'text-dagana-warning' : 'text-dagana-danger'
}

export function formatSignedRupiah(amount: number): string {
  const sign = amount > 0 ? '+' : ''
  return `${sign}${new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)}`
}
