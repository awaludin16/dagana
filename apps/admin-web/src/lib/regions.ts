import { env } from '@/lib/env'

export type Region = {
  id: string
  name: string
  postal_code?: string | null
}

async function get(path: string): Promise<Region[]> {
  const response = await fetch(`${env.apiBaseUrl.replace(/\/$/, '')}${path}`, {
    credentials: 'include',
    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
  })

  if (!response.ok) {
    throw new Error(
      response.status >= 500
        ? 'Data wilayah sedang tidak tersedia.'
        : `Data wilayah gagal dimuat (HTTP ${response.status}).`,
    )
  }

  const payload = (await response.json()) as { data: Region[] }
  return payload.data
}

export const regions = {
  provinces: () => get('/regions/provinces'),
  regencies: (provinceId: string) => get(`/regions/regencies/${provinceId}`),
  districts: (regencyId: string) => get(`/regions/districts/${regencyId}`),
  villages: (districtId: string) => get(`/regions/villages/${districtId}`),
}
