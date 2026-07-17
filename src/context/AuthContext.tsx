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

export type AuthModalView = 'login' | 'register' | null

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

      if (error) throw new Error(error.message)
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

      if (error) throw new Error(error.message)
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
      signOut,
      refreshProfile,
    }),
    [user, session, loading, authModal, signIn, signUp, signOut, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
