import axios from 'axios'
import { env } from '@/config/env'

export const api = axios.create({
  baseURL: `${env.API_URL}/api/v1`,
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
})

// TODO: Interceptor untuk CSRF/session jika diperlukan (sesuai docs/api-conventions.md)
export default api
