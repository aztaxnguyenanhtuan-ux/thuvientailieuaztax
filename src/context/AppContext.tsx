import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth, type AuthModalView } from './AuthContext'
import {
  getLibraryIds,
  saveLead,
  toggleLibraryItem,
} from '../services/api'
import type { DocumentItem } from '../types/document'
import type { InfographicItem } from '../services/infographics'
import type { AuthProfile } from '../lib/supabase'

export type ToastInfo = {
  message: string
  type: 'success' | 'info' | 'error'
}

export type AppContextValue = {
  user: AuthProfile | null
  authReady: boolean
  savedIds: string[]
  authModal: AuthModalView
  setAuthModal: (view: 'login' | 'register' | null) => void
  downloadDoc: (DocumentItem & { unlocked?: boolean; lead?: any }) | null
  setDownloadDoc: (doc: (DocumentItem & { unlocked?: boolean; lead?: any }) | null) => void
  lightbox: InfographicItem | null
  setLightbox: (item: InfographicItem | null) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  toast: ToastInfo | null
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void
  login: (email: string, password: string) => Promise<void>
  register: (payload: any) => Promise<void>
  logout: () => Promise<void>
  toggleSave: (docId: string) => Promise<void>
  requestDownload: (doc: DocumentItem) => Promise<void>
  submitDownloadLead: (formData: any) => Promise<void>
  isSupabaseConfigured: boolean
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const { user, openLogin, signOut } = auth

  const [savedIds, setSavedIds] = useState<string[]>([])
  const [downloadDoc, setDownloadDoc] = useState<
    (DocumentItem & { unlocked?: boolean; lead?: any }) | null
  >(null)
  const [lightbox, setLightbox] = useState<InfographicItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [toast, setToast] = useState<ToastInfo | null>(null)

  const showToast = useCallback(
    (message: string, type: 'success' | 'info' | 'error' = 'success') => {
      setToast({ message, type })
      setTimeout(() => setToast(null), 3200)
    },
    [],
  )

  // Load My Library when user changes
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!user?.id) {
        setSavedIds([])
        return
      }
      const ids = await getLibraryIds(user.id)
      if (!cancelled) setSavedIds(ids)
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id])

  const logout = useCallback(async () => {
    await signOut()
    setSavedIds([])
    showToast('Đã đăng xuất.', 'info')
  }, [signOut, showToast])

  const toggleSave = useCallback(
    async (docId: string) => {
      if (!user) {
        openLogin()
        showToast('Vui lòng đăng nhập để lưu tài liệu.', 'info')
        return
      }
      try {
        const next = await toggleLibraryItem(user.id, docId, savedIds)
        setSavedIds(next)
        showToast(
          next.includes(docId)
            ? 'Đã thêm vào Thư viện của tôi.'
            : 'Đã gỡ khỏi Thư viện.',
        )
      } catch (e) {
        showToast((e as Error).message || 'Không lưu được tài liệu.', 'info')
      }
    },
    [user, savedIds, showToast, openLogin],
  )

  const requestDownload = useCallback(
    async (doc: DocumentItem) => {
      if (user) {
        setDownloadDoc({ ...doc, unlocked: true, lead: user })
        await saveLead({
          fullName: user.fullName,
          email: user.email,
          phone: user.phone || '',
          position: user.position || '',
          company: user.company || '',
          documentId: doc.id,
          documentTitle: doc.title,
          source: 'quick-download-logged-in',
        })
        return
      }
      setDownloadDoc({ ...doc, unlocked: false })
    },
    [user],
  )

  const submitDownloadLead = useCallback(
    async (formData: any) => {
      if (!downloadDoc) return
      await saveLead({
        ...formData,
        documentId: downloadDoc.id,
        documentTitle: downloadDoc.title,
        source: 'download-modal',
      })
      setDownloadDoc((prev) =>
        prev ? { ...prev, unlocked: true, lead: formData } : null,
      )
      showToast('Đã gửi! Bạn có thể tải xuống ngay bên dưới.')
    },
    [downloadDoc, showToast],
  )

  // Bridge: keep old setAuthModal('login'|'register') API for other components
  const setAuthModal = useCallback(
    (view: 'login' | 'register' | null) => {
      if (view === 'login') openLogin()
      else if (view === 'register') auth.openRegister()
      else auth.closeAuthModal()
    },
    [auth, openLogin],
  )

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      authReady: !auth.loading,
      savedIds,
      authModal: auth.authModal,
      setAuthModal,
      downloadDoc,
      setDownloadDoc,
      lightbox,
      setLightbox,
      searchQuery,
      setSearchQuery,
      toast,
      showToast,
      login: auth.signIn,
      register: async (payload: any) => {
        await auth.signUp(payload)
      },
      logout,
      toggleSave,
      requestDownload,
      submitDownloadLead,
      isSupabaseConfigured: auth.isConfigured,
    }),
    [
      user,
      auth.loading,
      auth.authModal,
      auth.signIn,
      auth.signUp,
      auth.isConfigured,
      savedIds,
      setAuthModal,
      downloadDoc,
      lightbox,
      searchQuery,
      toast,
      showToast,
      logout,
      toggleSave,
      requestDownload,
      submitDownloadLead,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
