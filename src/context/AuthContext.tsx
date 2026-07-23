import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { isAdmin } from '../lib/roles'
import {
  isSupabaseConfigured,
  supabase,
  type AuthProfile,
} from '../lib/supabase'
import {
  buildAuthProfile,
  ensureUserProfile,
  fetchProfileFromDb,
} from '../services/profile'

export type AuthModalView = 'login' | 'register' | 'reset-password' | null

/** Map thông báo lỗi Supabase Auth → tiếng Việt (hiển thị UI). */
function mapAuthErrorMessage(message: string | undefined, fallback: string): string {
  const raw = (message || '').trim()
  if (!raw) return fallback
  const lower = raw.toLowerCase()

  if (
    lower.includes('invalid login credentials') ||
    lower.includes('invalid email or password')
  ) {
    return 'Email hoặc mật khẩu không đúng.'
  }
  if (lower.includes('email not confirmed')) {
    return 'Email chưa được xác nhận. Vui lòng kiểm tra hộp thư.'
  }
  if (lower.includes('user already registered') || lower.includes('already been registered')) {
    return 'Email này đã được đăng ký.'
  }
  if (lower.includes('password should be at least') || lower.includes('password is known')) {
    return 'Mật khẩu không hợp lệ. Vui lòng dùng mật khẩu mạnh hơn (tối thiểu 6 ký tự).'
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Thao tác quá nhiều lần. Vui lòng thử lại sau.'
  }
  if (lower.includes('network') || lower.includes('fetch')) {
    return 'Không kết nối được máy chủ. Kiểm tra mạng và thử lại.'
  }

  return raw
}

type AuthContextValue = {
  user: AuthProfile | null
  session: Session | null
  loading: boolean
  isConfigured: boolean
  /** true khi user.role === 'admin' (từ bảng profiles) */
  isAdmin: boolean
  authModal: AuthModalView
  openLogin: () => void
  openRegister: () => void
  closeAuthModal: () => void
  switchToLogin: () => void
  switchToRegister: () => void
  signIn: (email: string, password: string) => Promise<void>
  signUp: (payload: {
    email: string
    password: string
    fullName: string
    company?: string
    position?: string
    phone?: string
  }) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
  signOut: () => Promise<void>
  /** Force reload profile từ DB (role, tên…) */
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * Nạp session + query profiles.role rồi set user.
 * Quan trọng: role luôn lấy từ DB, không hardcode 'user'.
 */
async function resolveUserFromSession(
  next: Session | null,
): Promise<{ session: Session | null; user: AuthProfile | null }> {
  if (!next?.user) {
    return { session: null, user: null }
  }

  const profile = await fetchProfileFromDb(next.user.id)
  const user = buildAuthProfile(next.user, profile)

  if (import.meta.env.DEV) {
    console.info('[auth] session resolved', {
      email: user.email,
      role: user.role,
      profileFound: Boolean(profile),
    })
  }

  return { session: next, user }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [authModal, setAuthModal] = useState<AuthModalView>(null)
  const mountedRef = useRef(true)

  const applySession = useCallback(async (next: Session | null) => {
    const resolved = await resolveUserFromSession(next)
    if (!mountedRef.current) return resolved.user
    setSession(resolved.session)
    setUser(resolved.user)
    return resolved.user
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!supabase) return
    const { data } = await supabase.auth.getSession()
    await applySession(data.session)
  }, [applySession])

  useEffect(() => {
    mountedRef.current = true

    if (!supabase) {
      setLoading(false)
      return
    }

    // 1) Khôi phục session lúc load app
    supabase.auth.getSession().then(async ({ data, error }) => {
      if (error) console.warn('[auth] getSession:', error.message)
      if (!mountedRef.current) return
      try {
        await applySession(data.session)
      } finally {
        if (mountedRef.current) setLoading(false)
      }
    })

    // 2) Lắng nghe login/logout/token refresh
    // Lưu ý: KHÔNG await query Supabase trực tiếp trong callback
    // (có thể deadlock auth lock). Dùng setTimeout(0) để defer.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (import.meta.env.DEV) {
        console.info('[auth] onAuthStateChange', event)
      }

      if (event === 'PASSWORD_RECOVERY') {
        setAuthModal('reset-password')
      }

      window.setTimeout(() => {
        if (!mountedRef.current) return
        void applySession(nextSession)
      }, 0)
    })

    return () => {
      mountedRef.current = false
      subscription.unsubscribe()
    }
  }, [applySession])

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabase) {
        throw new Error('Supabase chưa được cấu hình. Kiểm tra file .env')
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        throw new Error(
          mapAuthErrorMessage(error.message, 'Email hoặc mật khẩu không đúng.'),
        )
      }
      if (!data.session?.user) {
        throw new Error('Đăng nhập thành công nhưng không có session.')
      }

      // Query profiles (role) ngay sau login — trước khi đóng modal
      const loggedInUser = await applySession(data.session)

      if (import.meta.env.DEV) {
        console.info('[auth] signIn OK', {
          email: loggedInUser?.email,
          role: loggedInUser?.role,
        })
      }

      setAuthModal(null)
    },
    [applySession],
  )

  const signUp = useCallback(
    async (payload: {
      email: string
      password: string
      fullName: string
      company?: string
      position?: string
      phone?: string
    }) => {
      if (!supabase) {
        throw new Error('Supabase chưa được cấu hình. Kiểm tra file .env')
      }

      const { data, error } = await supabase.auth.signUp({
        email: payload.email.trim(),
        password: payload.password,
        options: {
          data: {
            full_name: payload.fullName.trim(),
            company: payload.company?.trim() || '',
            position: payload.position || '',
            phone: payload.phone?.trim() || '',
          },
        },
      })

      if (error) {
        throw new Error(mapAuthErrorMessage(error.message, 'Đăng ký thất bại.'))
      }
      if (!data.user) throw new Error('Đăng ký không thành công.')

      // Tạo profile role=user nếu chưa có; không ghi đè role admin đã set
      await ensureUserProfile(data.user, {
        fullName: payload.fullName.trim(),
        company: payload.company?.trim() || '',
        position: payload.position || '',
        phone: payload.phone?.trim() || '',
      })

      if (data.session) {
        await applySession(data.session)
        setAuthModal(null)
      } else {
        setUser(null)
        setSession(null)
      }
    },
    [applySession],
  )

  const resetPassword = useCallback(async (email: string) => {
    if (!supabase) {
      throw new Error('Supabase chưa được cấu hình. Kiểm tra file .env')
    }

    const targetEmail = email.trim().toLowerCase()

    // Gửi mail đặt lại mật khẩu trực tiếp qua Supabase Auth
    const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
      redirectTo: `${window.location.origin}/`,
    })
    if (error) {
      throw new Error(
        mapAuthErrorMessage(error.message, 'Không gửi được email khôi phục mật khẩu.'),
      )
    }
  }, [])

  const updatePassword = useCallback(async (newPassword: string) => {
    if (!supabase) {
      throw new Error('Supabase chưa được cấu hình. Kiểm tra file .env')
    }
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    if (error) {
      throw new Error(
        mapAuthErrorMessage(error.message, 'Không cập nhật được mật khẩu mới.'),
      )
    }
    setAuthModal(null)
  }, [])

  const signOut = useCallback(async () => {
    if (supabase) {
      const { error } = await supabase.auth.signOut()
      if (error) console.warn('[auth] signOut:', error.message)
    }
    setUser(null)
    setSession(null)
    setAuthModal(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      isConfigured: isSupabaseConfigured,
      isAdmin: isAdmin(user?.role),
      authModal,
      openLogin: () => setAuthModal('login'),
      openRegister: () => setAuthModal('register'),
      closeAuthModal: () => setAuthModal(null),
      switchToLogin: () => setAuthModal('login'),
      switchToRegister: () => setAuthModal('register'),
      signIn,
      signUp,
      resetPassword,
      updatePassword,
      signOut,
      refreshProfile,
    }),
    [
      user,
      session,
      loading,
      authModal,
      signIn,
      signUp,
      resetPassword,
      updatePassword,
      signOut,
      refreshProfile,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
