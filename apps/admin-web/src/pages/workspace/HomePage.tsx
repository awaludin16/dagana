import { Navigate } from 'react-router'

import { useAccess } from '@/auth/useAccess'
import { ErrorState, LoadingState } from '@/components/PageFeedback'

export function HomePage() {
  const access = useAccess()

  if (access.isPending) return <LoadingState label="Memeriksa Business Anda..." />
  if (access.isError) {
    return (
      <ErrorState
        message="Business belum dapat dimuat. Periksa koneksi lalu coba lagi."
        onRetry={() => void access.refetch()}
      />
    )
  }

  return <Navigate to={access.membership ? '/outlets' : '/onboarding'} replace />
}
