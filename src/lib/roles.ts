/**
 * Phân quyền ứng dụng — dễ mở rộng (editor, moderator…).
 */

export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
} as const

export type AppRole = (typeof ROLES)[keyof typeof ROLES]

/** Role gán mặc định khi đăng ký */
export const DEFAULT_ROLE: AppRole = ROLES.USER

export function normalizeRole(value: unknown): AppRole {
  if (typeof value !== 'string') return ROLES.USER
  const v = value.trim().toLowerCase()
  if (v === ROLES.ADMIN) return ROLES.ADMIN
  return ROLES.USER
}

/** true khi role === 'admin' */
export function isAdmin(role: AppRole | string | null | undefined): boolean {
  return normalizeRole(role) === ROLES.ADMIN
}

/** Kiểm tra user có đủ 1 trong các role yêu cầu */
export function hasRole(
  userRole: AppRole | string | null | undefined,
  allowed: AppRole | AppRole[],
): boolean {
  if (!userRole) return false
  const list = Array.isArray(allowed) ? allowed : [allowed]
  const normalized = normalizeRole(userRole)
  return list.some((r) => normalizeRole(r) === normalized)
}
