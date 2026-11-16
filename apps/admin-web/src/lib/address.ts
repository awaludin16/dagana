import type { Address, Outlet } from '@/types'

export function normalizeAddress(address: Address): Address {
  return {
    street: address.street.trim(),
    village: address.village.trim(),
    district: address.district.trim(),
    regency: address.regency.trim(),
    province: address.province.trim(),
    postal_code: address.postal_code.trim(),
  }
}

export function formatAddress(outlet: Outlet) {
  return [
    outlet.address.street,
    outlet.address.village,
    outlet.address.district,
    outlet.address.regency,
    outlet.address.province,
    outlet.address.postal_code,
  ]
    .filter(Boolean)
    .join(', ')
}
