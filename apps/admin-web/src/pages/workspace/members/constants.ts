import type { Role } from '@/types'

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: 'Owner',
  MANAGER: 'Manager',
  CASHIER: 'Kasir',
}

export const ASSIGNABLE_ROLES: Exclude<Role, 'OWNER'>[] = ['MANAGER', 'CASHIER']
