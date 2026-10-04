import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import type { Role } from '@/api/types'
import { HOME_BY_ROLE } from '@/components/layout/navConfig'

export function RequireRole({ role, children }: { role: Role; children: React.ReactNode }) {
  const currentUser = useAuthStore((s) => s.currentUser)

  if (!currentUser) return <Navigate to="/login" replace />
  if (currentUser.role !== role) return <Navigate to={HOME_BY_ROLE[currentUser.role]} replace />

  return <>{children}</>
}
