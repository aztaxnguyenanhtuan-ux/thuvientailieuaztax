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
 * Client Supabase — session được persist vào localStorage
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
