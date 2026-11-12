import {
  BookOpen,
  ChartColumn,
  CheckCircle2,
  Package,
  QrCode,
  ShoppingBasket,
  Store,
  Wallet,
} from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { CSSProperties, RefObject } from 'react'
import { Link } from 'react-router'

import { useSession } from '@/auth/SessionContext'
import { BrandLogo } from '@/components/Logo'
import { Button } from '@/components/ui/button'

const CURRENT_YEAR = new Date().getFullYear()

const features = [
  {
    icon: ShoppingBasket,
    title: 'POS & pemesanan',
    body: 'Alur jualan yang cepat dan minim langkah, dari pemilihan menu sampai transaksi selesai.',
  },
  {
    icon: Wallet,
    title: 'Payment & Cash Session',
    body: 'Catat pembayaran, buka-tutup sesi kas, dan rekonsiliasi harian dalam satu tempat.',
  },
  {
    icon: BookOpen,
    title: 'Katalog menu',
    body: 'Kelola menu dan harga untuk setiap outlet dalam satu Business.',
  },
  {
    icon: Package,
    title: 'Inventory dasar',
    body: 'Pantau stok bahan bila dibutuhkan. Tidak wajib diaktifkan untuk mulai berjualan.',
  },
  {
    icon: QrCode,
    title: 'QR Ordering',
    body: 'Channel pemesanan mandiri yang opsional, memakai aturan bisnis yang sama dengan POS.',
  },
  {
    icon: ChartColumn,
    title: 'Laporan penjualan',
    body: 'Ringkasan penjualan yang mudah dipahami pemilik usaha, bukan spreadsheet berulang.',
  },
]

const steps = [
  'Daftar dan buat Business serta Outlet pertama.',
  'Tambahkan menu ke katalog.',
  'Buka Cash Session.',
  'Jualan, terima pembayaran, lalu tutup sesi.',
  'Lihat laporan penjualan Anda.',
]

const segments = [
  {
    title: 'Warung & usaha solo',
    body: 'Owner menjalankan satu outlet sendiri atau dengan sedikit karyawan. Owner langsung bisa menjadi operator POS.',
  },
  {
    title: 'Usaha kecil bertumbuh',
    body: 'Punya beberapa karyawan dan 1 sampai 3 outlet. Atur hak akses, inventory, dan QR Ordering saat benar-benar dibutuhkan.',
  },
  {
    title: 'Jaringan multi-outlet',
    body: 'Kelola banyak outlet dalam satu Business dengan laporan yang tetap mudah dibaca.',
  },
]

// Reveals memakai IntersectionObserver; tanpa IO (test/environment) konten
// langsung tampil supaya tidak ada konten yang tersembunyi permanen.
function useReveal() {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))

    if (typeof IntersectionObserver === 'undefined') {
      for (const element of elements) element.classList.add('is-visible')
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    )
    for (const element of elements) observer.observe(element)
    return () => observer.disconnect()
  }, [])
}

function useScrollProgress() {
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    const update = () => {
      frame = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      const progress = max > 0 ? Math.min(window.scrollY / max, 1) : 0
      document.documentElement.style.setProperty('--sc-progress', progress.toFixed(4))
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])
}

function useHeroParallax(heroRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return
    if (typeof window.matchMedia !== 'function') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    const update = () => {
      frame = 0
      const depth = Math.min(window.scrollY, hero.offsetHeight)
      hero.style.setProperty('--sc-depth', depth.toFixed(1))
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [heroRef])
}

// Nav hanya menampilkan aksi sesi bila statusnya sudah pasti, supaya tidak
// ada tautan yang memantul antara /login dan /.
function SessionActions({ className }: { className?: string }) {
  const { isAuthenticated, isPending } = useSession()

  if (isPending) return <span className={className} />

  if (isAuthenticated) {
    return (
      <Button asChild className={className}>
        <Link to="/dashboard">Buka aplikasi</Link>
      </Button>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`}>
      <Button asChild variant="ghost">
        <Link to="/login">Masuk</Link>
      </Button>
      <Button asChild>
        <Link to="/register">Mulai sekarang</Link>
      </Button>
    </div>
  )
}

export function LandingPage() {
  const heroRef = useRef<HTMLElement>(null)
  useReveal()
  useScrollProgress()
  useHeroParallax(heroRef)

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link to="/" className="inline-flex min-h-11 items-center gap-2 rounded-sm">
            <BrandLogo mode="icon" className="h-8" />
            <span className="text-lg font-semibold tracking-tight">dagana</span>
          </Link>
          <nav aria-label="Navigasi utama" className="hidden items-center gap-6 text-sm md:flex">
            <a
              className="rounded-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              href="#fitur"
            >
              Fitur
            </a>
            <a
              className="rounded-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              href="#cara-kerja"
            >
              Cara kerja
            </a>
            <a
              className="rounded-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              href="#untuk-siapa"
            >
              Untuk siapa
            </a>
          </nav>
          <SessionActions />
        </div>
        {/* Signature: garis kemajuan bacaan berwarna brand di bawah header. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-gradient-to-r from-dagana-primary to-dagana-amber"
          style={{ transform: 'scaleX(var(--sc-progress, 0))' }}
        />
      </header>

      <main className="flex-1">
        {/* Hero berlapis: bidang gradasi, chip mengapung, dan mock POS bergerak
            dengan kecepatan berbeda saat scroll (depth dari perbedaan gerak). */}
        <section
          ref={heroRef}
          className="relative overflow-hidden"
          style={{ '--sc-depth': 0 } as CSSProperties}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(56rem 36rem at 82% -12%, rgba(23, 107, 82, 0.12), transparent 62%), radial-gradient(38rem 28rem at -6% 108%, rgba(232, 162, 58, 0.10), transparent 62%)',
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 top-16 size-72 rounded-full bg-dagana-primary-soft/70 blur-3xl"
            style={{ transform: 'translateY(calc(var(--sc-depth) * -0.12px))' }}
          />

          <div className="relative mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
            <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="animate-hero space-y-6">
                <p className="inline-flex items-center gap-2 rounded-full border border-dagana-primary/20 bg-dagana-primary-soft/60 px-3 py-1 text-caption font-semibold text-dagana-primary">
                  <Store aria-hidden="true" className="size-3.5" />
                  F&B Business Operating Platform
                </p>
                <h1 className="max-w-xl text-balance text-display tracking-tight sm:text-4xl sm:leading-[1.15] lg:text-5xl lg:leading-[1.12]">
                  Platform operasional untuk usaha F&B Anda
                </h1>
                <p className="max-w-xl text-body-large text-muted-foreground sm:text-lg">
                  POS, pembayaran, kas, dan laporan berjalan di satu tempat. Catatan penjualan
                  selalu seiring dengan uang di kasir.
                </p>
                <ul className="max-w-xl space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-dagana-success"
                    />
                    Transaksi pertama bisa dicapai dengan setup minimal.
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-dagana-success"
                    />
                    Owner langsung bisa jualan tanpa menyiapkan banyak hal dulu.
                  </li>
                </ul>
                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <Button asChild className="sm:w-auto" size="lg">
                    <Link to="/register">Mulai sekarang</Link>
                  </Button>
                  <Button asChild className="sm:w-auto" size="lg" variant="outline">
                    <Link to="/login">Masuk</Link>
                  </Button>
                </div>
                <p className="text-caption text-muted-foreground">
                  Mulai sendiri. Jualan langsung. Berkembang tanpa pindah sistem.
                </p>
              </div>

              {/* Bidang subjek: mock POS dengan bidang foreground mengapung.
                  Data contoh umum untuk ilustrasi, bukan data merchant. */}
              <div className="relative animate-hero">
                <div
                  className="relative mx-auto w-full max-w-sm rounded-xl border bg-card p-5 shadow-lg shadow-dagana-primary/10"
                  style={{ transform: 'translateY(calc(var(--sc-depth) * -0.04px))' }}
                  role="img"
                  aria-label="Ilustrasi tampilan POS Dagana dengan daftar pesanan dan tombol pembayaran"
                >
                  <div className="flex items-center justify-between border-b pb-4">
                    <span className="text-label">POS · Outlet pertama</span>
                    <span className="rounded-full bg-dagana-success-container px-2 py-0.5 text-caption font-semibold text-dagana-success">
                      Sesi kas aktif
                    </span>
                  </div>
                  <ul className="space-y-3 py-4">
                    {[
                      { name: 'Kopi susu', qty: 1, price: 'Rp18.000' },
                      { name: 'Roti bakar', qty: 1, price: 'Rp25.000' },
                    ].map((item) => (
                      <li key={item.name} className="flex items-center justify-between text-sm">
                        <span>
                          {item.qty}× {item.name}
                        </span>
                        <span className="font-medium">{item.price}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between border-t pt-4">
                    <span className="text-label">Total</span>
                    <span className="text-lg font-bold">Rp43.000</span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <span className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground">
                      Tunai
                    </span>
                    <span className="inline-flex min-h-11 items-center justify-center rounded-md border bg-background text-sm font-medium">
                      QRIS
                    </span>
                  </div>
                </div>

                {/* Bidang foreground: chip mengapung dengan laju parallax berbeda. */}
                <div
                  className="animate-float absolute -right-2 top-8 hidden items-center gap-2 rounded-lg border bg-card px-3 py-2 text-caption font-medium shadow-sm sm:flex"
                  style={{ transform: 'translateY(calc(var(--sc-depth) * -0.09px))' }}
                >
                  <span className="grid size-6 place-items-center rounded-full bg-dagana-success-container text-dagana-success">
                    <CheckCircle2 aria-hidden="true" className="size-3.5" />
                  </span>
                  Pembayaran tunai tercatat
                </div>
                <div
                  className="animate-float-slow absolute -left-4 bottom-6 hidden items-center gap-2 rounded-lg border bg-card px-3 py-2 text-caption font-medium shadow-sm sm:flex"
                  style={{ transform: 'translateY(calc(var(--sc-depth) * -0.16px))' }}
                >
                  <span className="grid size-6 place-items-center rounded-full bg-dagana-primary-soft text-dagana-primary">
                    <Wallet aria-hidden="true" className="size-3.5" />
                  </span>
                  Sesi kas selesai, selisih Rp0
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="fitur" className="border-t bg-muted/40">
          <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
            <div data-reveal className="max-w-2xl space-y-3">
              <h2 className="text-page-title tracking-tight">Fitur inti Dagana</h2>
              <p className="text-body-large text-muted-foreground">
                Semua fitur memakai aturan bisnis dan data yang sama, sehingga POS, QR Ordering,
                dan laporan tidak pernah bertentangan.
              </p>
            </div>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <li
                  key={feature.title}
                  data-reveal
                  style={{ transitionDelay: `${(index % 3) * 70}ms` }}
                  className="reveal rounded-lg border bg-card p-5 transition-transform duration-150 hover:-translate-y-0.5"
                >
                  <span className="grid size-10 place-items-center rounded-lg bg-dagana-primary-soft text-dagana-primary">
                    <feature.icon aria-hidden="true" className="size-5" />
                  </span>
                  <h3 className="mt-4 text-card-title">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="cara-kerja" className="border-t">
          <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
            <div data-reveal className="max-w-2xl space-y-3">
              <h2 className="text-page-title tracking-tight">Cara kerja: jualan hari pertama</h2>
              <p className="text-body-large text-muted-foreground">
                Tidak ada rangkaian setup administrasi sebelum Anda bisa melayani pembeli.
              </p>
            </div>
            <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {steps.map((step, index) => (
                <li
                  key={step}
                  data-reveal
                  style={{ transitionDelay: `${index * 60}ms` }}
                  className="reveal relative rounded-lg border bg-card p-5"
                >
                  <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-dagana-primary to-dagana-primary-hover text-sm font-bold text-primary-foreground">
                    {index + 1}
                  </span>
                  <p className="mt-3 text-sm leading-6">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="untuk-siapa" className="border-t bg-muted/40">
          <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
            <div data-reveal className="max-w-2xl space-y-3">
              <h2 className="text-page-title tracking-tight">Untuk siapa</h2>
              <p className="text-body-large text-muted-foreground">
                Dirancang untuk usaha kuliner: warung, kedai, food stall, coffee shop, bakery
                kecil, dan restoran kecil.
              </p>
            </div>
            <ul className="mt-10 grid gap-4 sm:grid-cols-3">
              {segments.map((segment, index) => (
                <li
                  key={segment.title}
                  data-reveal
                  style={{ transitionDelay: `${index * 80}ms` }}
                  className="reveal rounded-lg border bg-card p-5 transition-transform duration-150 hover:-translate-y-0.5"
                >
                  <h3 className="text-card-title">{segment.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{segment.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Peak: panel gradien brand sebagai penutup, span paling lega. */}
        <section className="border-t pb-20 pt-16 lg:pb-24 lg:pt-24">
          <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
            <div
              data-reveal
              className="reveal relative overflow-hidden rounded-2xl bg-gradient-to-br from-dagana-primary-hover via-dagana-primary to-dagana-primary-hover px-6 py-16 text-center text-primary-foreground sm:px-12 lg:py-20"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -left-20 -top-24 size-72 rounded-full bg-white/10 blur-3xl"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-28 -right-16 size-80 rounded-full bg-dagana-amber/20 blur-3xl"
              />
              <div className="relative mx-auto max-w-2xl space-y-6">
                <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                  Mulai sendiri. Jualan langsung. Berkembang tanpa pindah sistem.
                </h2>
                <p className="text-body-large text-primary-foreground/80">
                  Buat Business dan Outlet pertama Anda, lalu capai transaksi pertama hari itu
                  juga.
                </p>
                <Button asChild size="lg" variant="secondary" className="mx-auto">
                  <Link to="/register">Mulai sekarang</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-4 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:px-8">
          <p>© {CURRENT_YEAR} Dagana. F&B Business Operating Platform</p>
          <div className="flex items-center gap-5">
            <Link to="/login" className="rounded-sm underline-offset-4 hover:underline">
              Masuk
            </Link>
            <Link to="/register" className="rounded-sm underline-offset-4 hover:underline">
              Daftar
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
