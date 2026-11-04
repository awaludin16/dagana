import { useQuery } from '@tanstack/react-query'
import type { FieldErrors, FieldValues } from 'react-hook-form'

import { FormField } from '@/components/FormField'
import { SearchableSelect } from '@/components/SearchableSelect'
import { getFieldError } from '@/lib/form-errors'
import { regions } from '@/lib/regions'
import { cn } from '@/lib/utils'
import type { Address } from '@/types'

type AddressFieldsProps<T extends FieldValues> = {
  idPrefix: string
  errorPrefix?: string
  value: Address
  onChange: (value: Address) => void
  errors: FieldErrors<T>
  disabled?: boolean
  className?: string
}

export function AddressFields<T extends FieldValues>({
  idPrefix,
  errorPrefix = 'address',
  value,
  onChange,
  errors,
  disabled = false,
  className,
}: AddressFieldsProps<T>) {
  const errorFor = (field: keyof Address) => getFieldError(errors, `${errorPrefix}.${field}`)

  const provinces = useQuery({
    queryKey: ['regions', 'provinces'],
    queryFn: regions.provinces,
    staleTime: Infinity,
  })
  const province = provinces.data?.find((item) => item.name === value.province)

  const regencies = useQuery({
    queryKey: ['regions', 'regencies', province?.id],
    queryFn: () => regions.regencies(province!.id),
    enabled: Boolean(province),
    staleTime: Infinity,
  })
  const regency = regencies.data?.find((item) => item.name === value.regency)

  const districts = useQuery({
    queryKey: ['regions', 'districts', regency?.id],
    queryFn: () => regions.districts(regency!.id),
    enabled: Boolean(regency),
    staleTime: Infinity,
  })
  const district = districts.data?.find((item) => item.name === value.district)

  const villages = useQuery({
    queryKey: ['regions', 'villages', district?.id],
    queryFn: () => regions.villages(district!.id),
    enabled: Boolean(district),
    staleTime: Infinity,
  })

  return (
    <div className={cn('grid gap-5 sm:grid-cols-2', className)}>
      <FormField
        name={`${idPrefix}-street`}
        label="Jalan"
        value={value.street ?? ''}
        maxLength={255}
        placeholder="Contoh: Jl. Merdeka No. 1"
        containerClassName="sm:col-span-2"
        disabled={disabled}
        error={errorFor('street')}
        onChange={(event) => onChange({ ...value, street: event.target.value || null })}
      />

      <SearchableSelect
        id={`${idPrefix}-province`}
        label="Provinsi"
        value={value.province}
        options={provinces.data ?? []}
        isLoading={provinces.isPending}
        disabled={disabled}
        error={provinces.isError ? 'Provinsi belum dapat dimuat.' : undefined}
        errorMessage={errorFor('province')}
        onRetry={() => void provinces.refetch()}
        onChange={(option) =>
          onChange({
            ...value,
            province: option?.name ?? null,
            regency: null,
            district: null,
            village: null,
            postal_code: null,
          })
        }
      />

      <SearchableSelect
        id={`${idPrefix}-regency`}
        label="Kabupaten/Kota"
        value={value.regency}
        options={regencies.data ?? []}
        isLoading={regencies.isPending && Boolean(province)}
        disabled={disabled || !province}
        error={regencies.isError ? 'Kabupaten/kota belum dapat dimuat.' : undefined}
        errorMessage={errorFor('regency')}
        onRetry={() => void regencies.refetch()}
        onChange={(option) =>
          onChange({
            ...value,
            regency: option?.name ?? null,
            district: null,
            village: null,
            postal_code: null,
          })
        }
      />

      <SearchableSelect
        id={`${idPrefix}-district`}
        label="Kecamatan"
        value={value.district}
        options={districts.data ?? []}
        isLoading={districts.isPending && Boolean(regency)}
        disabled={disabled || !regency}
        error={districts.isError ? 'Kecamatan belum dapat dimuat.' : undefined}
        errorMessage={errorFor('district')}
        onRetry={() => void districts.refetch()}
        onChange={(option) =>
          onChange({
            ...value,
            district: option?.name ?? null,
            village: null,
            postal_code: null,
          })
        }
      />

      <SearchableSelect
        id={`${idPrefix}-village`}
        label="Desa/Kelurahan"
        value={value.village}
        options={villages.data ?? []}
        isLoading={villages.isPending && Boolean(district)}
        disabled={disabled || !district}
        error={villages.isError ? 'Desa/kelurahan belum dapat dimuat.' : undefined}
        errorMessage={errorFor('village')}
        onRetry={() => void villages.refetch()}
        onChange={(option) =>
          onChange({
            ...value,
            village: option?.name ?? null,
            postal_code: option?.postal_code ?? null,
          })
        }
      />

      <FormField
        name={`${idPrefix}-postal_code`}
        label="Kode pos"
        value={value.postal_code ?? ''}
        inputMode="numeric"
        maxLength={10}
        placeholder="Terisi otomatis dari desa"
        disabled={disabled}
        error={errorFor('postal_code')}
        onChange={(event) => onChange({ ...value, postal_code: event.target.value || null })}
      />
    </div>
  )
}
