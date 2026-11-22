import { authApi } from './auth'
import { businessApi } from './business'
import { cashApi } from './cash'
import { catalogApi } from './catalog'
import { membersApi } from './members'
import { ordersApi } from './orders'
import { reportsApi } from './reports'

export { ApiError } from './http'

export const api = {
  ...authApi,
  ...businessApi,
  ...membersApi,
  ...catalogApi,
  ...ordersApi,
  ...cashApi,
  ...reportsApi,
}
