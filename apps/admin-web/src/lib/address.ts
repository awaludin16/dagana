import type { Address, Outlet } from '@/types'

export function normalizeAddress(address: Address): Address {
  return {
    street: address.street?.trim() || null,
    village: address.village?.trim() || null,
    district: address.district?.trim() || null,
    regency: address.regency?.trim() || null,
    province: address.province?.trim() || null,
    postal_code: address.postal_code?.trim() || null,
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
