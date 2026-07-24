import type { ReactNode } from 'react'
import { useAuth } from '../../context/AuthContext'
import { hasRole, ROLES, type AppRole } from '../../lib/roles'
import AccessDenied from './AccessDenied'

type ProtectedRouteProps = {
  children: ReactNode
  /** Role được phép — mặc định chỉ admin (CMS) */
  roles?: AppRole | AppRole[]
  requireAuth?: boolean
}

/**
 * Bảo vệ route theo role từ useAuth().user.role
 *
 * @example
 * <ProtectedRoute roles="admin"><AdminCMS /></ProtectedRoute>
 */
export default function ProtectedRoute({
  children,
  roles = ROLES.ADMIN,
  requireAuth = true,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="page-loading access-gate">
        <div className="spinner" />
      </div>
    )
  }

  if (requireAuth && !user) {
    return (
      <AccessDenied
        title="Bạn cần đăng nhập"
        description="Vui lòng đăng nhập bằng tài khoản admin để truy cập CMS."
        showLogin
      />
    )
  }

  // Kiểm tra role từ profiles qua useAuth()
  if (!hasRole(user?.role, roles)) {
    return <AccessDenied title="Bạn không có quyền truy cập CMS" />
  }

  return <>{children}</>
}
