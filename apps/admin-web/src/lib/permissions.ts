// Kontrol permission pengguna aktif dari hasil /auth/me.
import { useMe } from './me'

export function usePermissions(): { can: (permission: string) => boolean } {
  const { data } = useMe()
  const permissions = data?.permissions ?? []

  return {
    can: (permission: string) => permissions.includes(permission),
  }
}