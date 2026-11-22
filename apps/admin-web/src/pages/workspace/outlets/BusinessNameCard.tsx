import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Building2 } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { FormField } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { apiErrorMessage, applyApiErrors, getFieldError, hasFieldErrors } from '@/lib/form-errors'
import { businessNameSchema, type BusinessNameFormValues } from '@/lib/validation'

export function BusinessNameCard({
  businessId,
  initialName,
  canEdit,
}: {
  businessId: number | null
  initialName: string
  canEdit: boolean
}) {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<BusinessNameFormValues>({
    resolver: zodResolver(businessNameSchema),
    defaultValues: { name: initialName },
    mode: 'onBlur',
  })

  const updateBusiness = useMutation({
    mutationFn: (values: BusinessNameFormValues) =>
      api.updateBusiness(businessId!, { name: values.name }),
    onSuccess: (business) => {
      queryClient.setQueryData(['business', businessId], business)
      reset({ name: business.name })
    },
  })

  const submit = handleSubmit((values) => {
    updateBusiness.mutate(values, {
      onError: (error) => {
        applyApiErrors(error, setError)
      },
    })
  })

  return (
    <form
      onSubmit={submit}
      noValidate
      aria-busy={updateBusiness.isPending}
      className="rounded-xl border bg-card p-5 sm:p-6"
    >
      <div className="mb-4 flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-dagana-primary-soft text-dagana-primary">
          <Building2 aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">Nama business</h2>
          <p className="text-sm text-muted-foreground">
            Nama ini dipakai di seluruh aplikasi. Business tidak menyimpan alamat atau telepon.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <FormField
          {...register('name')}
          id="business-name"
          label="Nama business"
          maxLength={255}
          disabled={!canEdit || updateBusiness.isPending}
          error={getFieldError(errors, 'name')}
          containerClassName="flex-1"
        />
        {canEdit ? (
          <Button type="submit" variant="outline" disabled={updateBusiness.isPending || !isDirty}>
            {updateBusiness.isPending ? 'Menyimpan...' : 'Simpan nama'}
          </Button>
        ) : null}
      </div>

      {updateBusiness.isSuccess ? (
        <p className="mt-3 text-sm text-muted-foreground" role="status">
          Nama business tersimpan.
        </p>
      ) : null}
      {updateBusiness.isError && !hasFieldErrors(updateBusiness.error) ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {apiErrorMessage(updateBusiness.error, 'Nama business belum dapat disimpan. Coba lagi.')}
        </p>
      ) : null}
    </form>
  )
}
