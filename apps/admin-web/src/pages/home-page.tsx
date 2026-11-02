import { useQuery } from '@tanstack/react-query'
import { Navigate } from 'react-router'

import { useSession } from '@/auth/session-context'
import { ErrorState, LoadingState } from '@/components/page-feedback'
import { api } from '@/lib/api'

export function HomePage() {
  const { token } = useSession()
  const outlets = useQuery({
    queryKey: ['outlets', token],
    queryFn: () => api.outlets(token!),
    enabled: Boolean(token),
  })

  if (outlets.isPending) return <LoadingState label="Memeriksa Business Anda..." />
  if (outlets.isError) {
    return (
      <ErrorState
        message="Business belum dapat dimuat. Periksa koneksi lalu coba lagi."
        onRetry={() => void outlets.refetch()}
      />
    )
  }

  return <Navigate to={outlets.data.length ? '/business' : '/onboarding'} replace />
}
