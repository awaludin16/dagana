import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

export function RegisterPage() {
  const { register, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const invitationToken = new URLSearchParams(location.search).get('inviteToken')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password !== passwordConfirmation) {
      setError('Konfirmasi kata sandi tidak sesuai.')
      return
    }
    try {
      await register(name, email, password, passwordConfirmation)
      toast.success('Berhasil mendaftar')
      navigate(
        invitationToken
          ? `/accept-invitation?token=${encodeURIComponent(invitationToken)}`
          : '/',
      )
    } catch (err) {
      setError('Gagal mendaftar. Cek kembali data Anda.')
    }
  }

  return (
    <main className="min-h-dvh flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 rounded-lg border bg-card p-6 shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className="text-lg font-semibold tracking-tight">Daftar Dagana</h1>
          <p className="text-sm text-muted-foreground">
            Mulai kelola operasional bisnis F&B Anda.
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama Anda"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@perusahaan.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Kata Sandi</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password_confirmation">Konfirmasi Kata Sandi</Label>
            <Input
              id="password_confirmation"
              type="password"
              autoComplete="new-password"
              required
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              placeholder="Ulangi kata sandi"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Memproses...' : 'Daftar'}
          </Button>
        </form>
        <p className="text-center text-xs text-muted-foreground">
          Sudah punya akun?{' '}
          <Link
            to={invitationToken ? `/login?inviteToken=${encodeURIComponent(invitationToken)}` : '/login'}
            className="underline underline-offset-4"
          >
            Masuk
          </Link>
        </p>
      </div>
    </main>
  )
}
