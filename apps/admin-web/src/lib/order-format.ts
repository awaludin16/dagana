export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(value)
}

// Input nominal rupiah: ambil digit saja lalu tampilkan dengan pemisah ribuan titik.
export function formatRupiahInput(value: string): string {
  const digits = value.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export function formatOrderDate(value: string | null): string {
  if (!value) return 'Waktu tidak tersedia'

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function orderStatusLabel(status: string): string {
  switch (status) {
    case 'PAID':
      return 'Lunas'
    case 'PENDING':
      return 'Menunggu pembayaran'
    case 'CANCELLED':
      return 'Dibatalkan'
    default:
      return 'Status tidak dikenali'
  }
}

export function paymentStatusLabel(status: string): string {
  switch (status) {
    case 'PAID':
      return 'Terkonfirmasi'
    case 'PENDING':
      return 'Menunggu konfirmasi'
    case 'FAILED':
      return 'Gagal'
    case 'REFUNDED':
      return 'Dikembalikan'
    case 'PARTIALLY_REFUNDED':
      return 'Dikembalikan sebagian'
    default:
      return 'Status tidak dikenali'
  }
}

export function paymentMethodLabel(method: string): string {
  switch (method) {
    case 'cash':
      return 'Tunai'
    case 'qr_payment':
      return 'Pembayaran QR'
    case 'bank_transfer':
      return 'Transfer bank'
    case 'debit':
      return 'Kartu debit'
    case 'credit':
      return 'Kartu kredit'
    default:
      return 'Metode tidak dikenali'
  }
}

export function orderSourceLabel(source: string): string {
  switch (source) {
    case 'POS':
      return 'POS'
    case 'QR':
      return 'QR'
    case 'ADMIN':
      return 'Admin'
    default:
      return 'Sumber tidak dikenali'
  }
}

export function orderStatusClass(status: string): string {
  switch (status) {
    case 'PAID':
      return 'border-dagana-success/20 bg-dagana-success-container text-dagana-success'
    case 'PENDING':
      return 'border-dagana-warning/20 bg-dagana-warning-container text-dagana-warning'
    case 'CANCELLED':
      return 'border-dagana-danger/20 bg-dagana-danger-container text-dagana-danger'
    default:
      return 'border-dagana-info/20 bg-dagana-info-container text-dagana-info'
  }
}

export function paymentStatusClass(status: string): string {
  switch (status) {
    case 'PAID':
      return 'border-dagana-success/20 bg-dagana-success-container text-dagana-success'
    case 'PENDING':
      return 'border-dagana-warning/20 bg-dagana-warning-container text-dagana-warning'
    case 'FAILED':
    case 'REFUNDED':
    case 'PARTIALLY_REFUNDED':
      return 'border-dagana-danger/20 bg-dagana-danger-container text-dagana-danger'
    default:
      return 'border-dagana-info/20 bg-dagana-info-container text-dagana-info'
  }
}
