import type { Me } from '@/types'

import { ApiError, data, raw, request } from './http'

export const authApi = {
  async register(input: {
    name: string
    email: string
    password: string
    password_confirmation: string
  }) {
    return data<Me>('/auth/web/register', { method: 'POST', body: input })
  },

  async login(input: { email: string; password: string }) {
    return data<Me>('/auth/web/login', { method: 'POST', body: input })
  },

  async forgotPassword(input: { email: string }) {
    return raw<{ message: string }>('/auth/forgot-password', { method: 'POST', body: input })
  },

  async resetPassword(input: { email: string; token: string; password: string }) {
    return raw<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: { ...input, password_confirmation: input.password },
    })
  },

  async verifyEmail(id: string, hash: string, expires: string, signature: string) {
    return raw<{ message: string }>(
      `/auth/email/verify/${id}/${hash}?expires=${expires}&signature=${signature}`,
    )
  },

  async resendVerification() {
    return raw<{ message: string }>('/auth/email/verification-notification', { method: 'POST' })
  },

  async logout() {
    await request('/auth/web/logout', { method: 'POST' })
  },

  async profile() {
    try {
      return await data<Me>('/me', { allowUnauthenticated: true })
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return null
      throw error
    }
  },
}
