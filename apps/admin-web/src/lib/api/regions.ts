import { ApiError, data } from './http'

export type Region = {
  id: string
  name: string
  postal_code?: string | null
}

async function get(path: string): Promise<Region[]> {
  try {
    return await data<Region[]>(path)
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status >= 500) {
        throw new ApiError('Data wilayah sedang tidak tersedia.', error.status)
      }
      throw new ApiError(`Data wilayah gagal dimuat (HTTP ${error.status}).`, error.status)
    }
    throw error
  }
}

export const regions = {
  provinces: () => get('/regions/provinces'),
  regencies: (provinceId: string) => get(`/regions/regencies/${provinceId}`),
  districts: (regencyId: string) => get(`/regions/districts/${regencyId}`),
  villages: (districtId: string) => get(`/regions/villages/${districtId}`),
}
