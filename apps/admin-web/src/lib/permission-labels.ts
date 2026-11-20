/**
 * Label ramah pengguna untuk permission katalog D-03.
 * UI tidak boleh menampilkan string mentah seperti 'business.read'.
 */
export const PERMISSION_LABELS: Record<string, string> = {
  'business.read': 'Lihat info bisnis',
  'business.update': 'Ubah info bisnis',
  'outlets.read': 'Lihat outlet',
  'outlets.create': 'Tambah outlet',
  'outlets.update': 'Ubah outlet',
  'outlets.delete': 'Hapus outlet',
  'members.read': 'Lihat anggota tim',
  'members.invite': 'Tambah anggota tim',
  'members.update': 'Kelola anggota tim',
  'members.delete': 'Hapus anggota tim',
  'categories.read': 'Lihat kategori menu',
  'categories.create': 'Tambah kategori menu',
  'categories.update': 'Ubah kategori menu',
  'categories.delete': 'Hapus kategori menu',
  'products.read': 'Lihat menu',
  'products.create': 'Tambah menu',
  'products.update': 'Ubah menu',
  'products.delete': 'Hapus menu',
  'orders.read': 'Lihat transaksi',
  'orders.create': 'Buat transaksi',
  'orders.update': 'Ubah transaksi',
  'orders.cancel': 'Batalkan transaksi',
  'payments.read': 'Lihat pembayaran',
  'payments.create': 'Catat & konfirmasi pembayaran',
  'payments.refund': 'Refund pembayaran',
  'cash.read': 'Lihat sesi kas',
  'cash.open': 'Buka sesi kas',
  'cash.cash_in': 'Catat kas masuk',
  'cash.cash_out': 'Catat kas keluar',
  'cash.close': 'Tutup sesi kas',
  'cash.reconcile': 'Rekonsiliasi & koreksi kas',
  'reports.read': 'Lihat laporan',
  'reports.export': 'Ekspor laporan',
  'qr.read': 'Lihat pesanan QR',
  'qr.manage': 'Kelola meja & QR',
  'kitchen.read': 'Lihat status dapur',
  'kitchen.update_status': 'Perbarui status dapur',
  'billing.read': 'Lihat billing',
  'billing.manage_settings': 'Kelola pengaturan billing',
  'audit.read': 'Lihat log audit',
  'settings.read': 'Lihat pengaturan',
  'settings.update': 'Ubah pengaturan',
}

export const permissionLabel = (permission: string) =>
  permission === '*' ? 'semua izin' : (PERMISSION_LABELS[permission] ?? permission)

type PermissionGroup = {
  title: string
  items: string[]
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    title: 'Bisnis & Outlet',
    items: ['business.read', 'business.update', 'outlets.read', 'outlets.create', 'outlets.update', 'outlets.delete'],
  },
  {
    title: 'Anggota Tim',
    items: ['members.read', 'members.invite', 'members.update', 'members.delete'],
  },
  {
    title: 'Menu & Kategori',
    items: ['categories.read', 'categories.create', 'categories.update', 'categories.delete', 'products.read', 'products.create', 'products.update', 'products.delete'],
  },
  {
    title: 'Transaksi & Pembayaran',
    items: ['orders.read', 'orders.create', 'orders.update', 'orders.cancel', 'payments.read', 'payments.create', 'payments.refund'],
  },
  {
    title: 'Kas',
    items: ['cash.read', 'cash.open', 'cash.cash_in', 'cash.cash_out', 'cash.close', 'cash.reconcile'],
  },
  {
    title: 'Laporan & Lainnya',
    items: ['reports.read', 'reports.export', 'qr.read', 'qr.manage', 'kitchen.read', 'kitchen.update_status', 'billing.read', 'billing.manage_settings', 'audit.read', 'settings.read', 'settings.update'],
  },
]
