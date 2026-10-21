import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/use-auth'
import type { BusinessPayload } from '@/types/organization.types'

export function OnboardingPage() {
  const { refetch } = useAuth()
  const navigate = useNavigate()
  const [businessName, setBusinessName] = useState('')
  const [outletName, setOutletName] = useState('')
  const [outletAddress, setOutletAddress] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSaving(true)

    const payload: BusinessPayload = { name: businessName.trim() }
    if (outletName.trim()) {
      payload.outlet = {
        name: outletName.trim(),
        ...(outletAddress.trim() && { address: outletAddress.trim() }),
      }
    }

    try {
      await api.post('/businesses', payload)
      await refetch()
      toast.success('Bisnis berhasil dibuat')
      navigate('/', { replace: true })
    } catch {
      setError('Bisnis belum dapat dibuat. Periksa data dan koneksi, lalu coba lagi.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl items-center px-4 py-8">
      <section className="w-full space-y-6 rounded-lg border bg-card p-6 shadow-sm">
        <header className="space-y-2">
          <p className="text-sm font-medium text-primary">Langkah pertama</p>
          <h1 className="text-2xl font-semibold tracking-tight">Siapkan bisnis Anda</h1>
          <p className="text-sm text-muted-foreground">
            Buat business dan, jika siap, outlet pertama. Karyawan dapat ditambahkan nanti.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="business-name">Nama bisnis</Label>
            <Input
              id="business-name"
              autoComplete="organization"
              maxLength={150}
              required
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
              placeholder="Contoh: Kedai Pagi"
            />
          </div>
          <fieldset className="space-y-4 rounded-md border p-4">
            <legend className="px-1 text-sm font-medium">Outlet pertama (opsional)</legend>
            <div className="space-y-2">
              <Label htmlFor="outlet-name">Nama outlet</Label>
              <Input
                id="outlet-name"
                maxLength={150}
                value={outletName}
                onChange={(event) => setOutletName(event.target.value)}
                placeholder="Contoh: Kedai Pagi - Sudirman"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="outlet-address">Alamat outlet (opsional)</Label>
              <Input
                id="outlet-address"
                autoComplete="street-address"
                maxLength={255}
                value={outletAddress}
                onChange={(event) => setOutletAddress(event.target.value)}
                placeholder="Alamat"
                disabled={!outletName.trim()}
              />
            </div>
          </fieldset>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={isSaving}>
            {isSaving ? 'Menyimpan...' : 'Simpan dan lanjut'}
          </Button>
        </form>
      </section>
    </main>
  )
}
