import { useQuery } from '@tanstack/react-query'
import { mockMe } from '@/mocks/me'

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      // FRONTEND-FIRST: return mock dulu, ganti ke api.get('/me') nanti
      await new Promise((resolve) => setTimeout(resolve, 300))
      return mockMe
    },
    staleTime: 60 * 1000,
  })
}
