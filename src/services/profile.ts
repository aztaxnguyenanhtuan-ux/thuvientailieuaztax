import { DEFAULT_ROLE, normalizeRole, type AppRole } from '../lib/roles'
import { supabase, type AuthProfile } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

/** Cột thực tế trên bảng public.profiles */
export type ProfileRow = {
  id: string
  full_name: string | null
  email: string | null
  company_name: string | null
  position: string | null
  phone: string | null
  role: string | null
}

const PROFILE_COLUMNS =
  'id, email, role, full_name, company_name, position, phone' as const

/**
 * Query bảng profiles (kèm cột role + company_name).
 * Retry ngắn nếu DB chưa sẵn sàng sau login.
 */
export async function fetchProfileFromDb(
  userId: string,
  retries = 2,
): Promise<ProfileRow | null> {
  if (!supabase || !userId) return null

  let lastError: string | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      lastError = error.message
      console.warn(
        `[profiles] attempt ${attempt + 1}/${retries + 1}:`,
        error.message,
        error.code,
        error.details,
      )
      if (attempt < retries) {
        await wait(150 * (attempt + 1))
        continue
      }
      return null
    }

    if (!data) {
      if (attempt < retries) {
        await wait(150 * (attempt + 1))
        continue
      }
      console.warn('[profiles] không tìm thấy row cho user', userId)
      return null
    }

    if (import.meta.env.DEV) {
      console.info('[profiles] loaded', {
        id: data.id,
        role: data.role,
        email: data.email,
        company_name: data.company_name,
      })
    }

    return data as ProfileRow
  }

  if (lastError) console.warn('[profiles] failed:', lastError)
  return null
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Map auth.users + profiles.row → AuthProfile (role + company từ DB) */
export function buildAuthProfile(
  user: User,
  profile: ProfileRow | null,
): AuthProfile {
  const roleFromDb: AppRole = profile
    ? normalizeRole(profile.role)
    : DEFAULT_ROLE

  const companyName =
    profile?.company_name ||
    (user.user_metadata?.company as string) ||
    (user.user_metadata?.company_name as string) ||
    ''

  return {
    id: user.id,
    email: profile?.email || user.email || '',
    fullName:
      profile?.full_name ||
      (user.user_metadata?.full_name as string) ||
      user.email?.split('@')[0] ||
      'Người dùng',
    /** Alias app — map từ cột company_name */
    company: companyName,
    companyName,
    position:
      profile?.position || (user.user_metadata?.position as string) || '',
    phone: profile?.phone || (user.user_metadata?.phone as string) || '',
    role: roleFromDb,
  }
}

/**
 * Tạo profile mới với role = user (không ghi đè role nếu đã tồn tại).
 * Ghi cột company_name (không dùng company).
 */
export async function ensureUserProfile(
  user: User,
  extras: {
    fullName: string
    company?: string
    position?: string
    phone?: string
  },
): Promise<void> {
  if (!supabase) return

  const existing = await fetchProfileFromDb(user.id, 0)
  const companyName = extras.company ?? ''

  if (existing) {
    // Chỉ cập nhật thông tin cơ bản — GIỮ NGUYÊN role
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: extras.fullName,
        email: user.email ?? existing.email,
        company_name: companyName || existing.company_name,
        position: extras.position ?? existing.position,
        phone: extras.phone ?? existing.phone,
      })
      .eq('id', user.id)

    if (error) console.warn('[profiles] update:', error.message)
    return
  }

  const { error } = await supabase.from('profiles').insert({
    id: user.id,
    full_name: extras.fullName,
    email: user.email ?? '',
    company_name: companyName,
    position: extras.position || '',
    phone: extras.phone || '',
    role: DEFAULT_ROLE,
  })

  if (error) console.warn('[profiles] insert:', error.message)
}
