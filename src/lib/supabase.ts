import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { AppRole } from './roles'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** Key lưu session trong localStorage (Supabase Auth) */
export const AUTH_STORAGE_KEY = 'aztax-auth-session'

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !String(supabaseUrl).includes('YOUR_PROJECT') &&
    supabaseAnonKey !== 'your_anon_key_here',
)

if (!isSupabaseConfigured) {
  console.warn(
    '[AZTAX] Thiếu VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY trong .env',
  )
}

/**
 * Kiểm tra xem lỗi có phải do JWT clock skew / token không hợp lệ
 * (ví dụ: "JWT issued at future", PGRST303, token expired).
 */
export function isJwtError(err: unknown): boolean {
  if (!err) return false
  const msg =
    typeof err === 'object' && err !== null && 'message' in err
      ? String((err as { message: unknown }).message).toLowerCase()
      : String(err).toLowerCase()
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code: unknown }).code)
      : ''
  return (
    code === 'PGRST303' ||
    code === 'PGRST301' ||
    msg.includes('jwt issued at future') ||
    msg.includes('jwt expired') ||
    msg.includes('invalid claim') ||
    msg.includes('bad jwt')
  )
}

/**
 * Client Supabase chính — session được persist vào localStorage
 * qua auth.storage + persistSession.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: AUTH_STORAGE_KEY,
      },
    })
  : null

/**
 * Public client không dùng session của user (chỉ dùng Anon Key).
 * Dùng cho các tài nguyên công khai (documents, infographics) hoặc làm fallback an toàn
 * khi session của người dùng bị lỗi clock skew ("JWT issued at future").
 */
export const publicSupabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null

export type AuthProfile = {
  id: string
  email: string
  fullName: string
  /** Map từ profiles.company_name (giữ tên ngắn cho form UI) */
  company: string
  /** Tên cột DB profiles.company_name */
  companyName: string
  position: string
  phone: string
  /** Lấy từ bảng profiles.role — 'user' | 'admin' */
  role: AppRole
}
