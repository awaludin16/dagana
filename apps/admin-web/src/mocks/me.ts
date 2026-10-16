export interface Me {
  id: string
  name: string
  email: string
  businessId?: string
  outletId?: string
}

export const mockMe: Me = {
  id: 'u1',
  name: 'Budi',
  email: 'budi@example.com',
}
