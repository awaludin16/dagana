import type { CreateMemberInput, Member, RoleCatalog, UpdateMemberInput } from '@/types'

import { data, request } from './http'

export const membersApi = {
  async members() {
    return data<Member[]>('/members')
  },

  async createMember(input: CreateMemberInput) {
    return data<Member>('/members', { method: 'POST', body: input })
  },

  async updateMember(id: number, input: UpdateMemberInput) {
    return data<Member>(`/members/${id}`, { method: 'PATCH', body: input })
  },

  async deleteMember(id: number) {
    await request(`/members/${id}`, { method: 'DELETE' })
  },

  async roles() {
    return data<RoleCatalog[]>('/roles')
  },
}
