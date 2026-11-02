import { useState, type FormEvent } from 'react'

import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api'

export type SettingsValues = {
  name: string
  phone: string | null
  address: string | null
}

type SettingsFormProps = {
  title: string
  description: string
  values: SettingsValues
  onSave: (values: SettingsValues) => Promise<void>
}

export function SettingsForm({ title, description, values, onSave }: SettingsFormProps) {
  const [form, setForm] = useState({
    name: values.name,
    phone: values.phone ?? '',
    address: values.address ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [message, setMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrors({})
    setMessage(null)
    setErrorMessage(null)

    if (!form.name.trim()) {
      setErrors({ name: ['Nama wajib diisi.'] })
      return
    }

    setIsSaving(true)

    try {
      await onSave({
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
      })
      setMessage('Perubahan berhasil disimpan.')
    } catch (error) {
      if (error instanceof ApiError) setErrors(error.errors)
      setErrorMessage(error instanceof Error ? error.message : 'Perubahan belum dapat disimpan.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="rounded-lg border bg-card p-5 sm:p-7">
      <div className="mb-6">
        <h2 className="text-section-title">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {errorMessage ? (
        <p
          role="alert"
          className="mb-5 rounded-lg border border-destructive/30 bg-destructive/5 px-3.5 py-3 text-sm text-destructive"
        >
          {errorMessage}
        </p>
      ) : null}
      {message ? (
        <p
          role="status"
          className="mb-5 rounded-lg border border-dagana-success/20 bg-dagana-success-container px-3.5 py-3 text-sm text-dagana-success"
        >
          {message}
        </p>
      ) : null}
      <form className="space-y-5" onSubmit={submit}>
        <FormField
          name={`${title}.name`}
          label="Nama"
          value={form.name}
          required
          maxLength={255}
          error={errors.name?.[0]}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
        />
        <FormField
          name={`${title}.phone`}
          label="Nomor telepon (opsional)"
          type="tel"
          autoComplete="tel"
          value={form.phone}
          maxLength={30}
          error={errors.phone?.[0]}
          onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
        />
        <div className="space-y-1.5">
          <label htmlFor={`${title}-address`} className="text-sm font-medium">
            Alamat (opsional)
          </label>
          <textarea
            id={`${title}-address`}
            name={`${title}.address`}
            value={form.address}
            maxLength={1000}
            rows={3}
            aria-invalid={Boolean(errors.address)}
            aria-describedby={errors.address ? `${title}-address-error` : undefined}
            onChange={(event) =>
              setForm((current) => ({ ...current, address: event.target.value }))
            }
            className={`w-full resize-y rounded-lg border bg-background px-3 py-2.5 text-sm leading-6 shadow-xs outline-none transition focus-visible:ring-[3px] focus-visible:ring-ring/40 ${errors.address ? 'border-destructive' : 'border-input'}`}
          />
          {errors.address?.[0] ? (
            <p id={`${title}-address-error`} role="alert" className="text-sm text-destructive">
              {errors.address[0]}
            </p>
          ) : null}
        </div>
        <div className="flex justify-end">
          <Button type="submit" className="min-h-11 px-5" disabled={isSaving}>
            {isSaving ? 'Menyimpan...' : 'Simpan perubahan'}
          </Button>
        </div>
      </form>
    </section>
  )
}
