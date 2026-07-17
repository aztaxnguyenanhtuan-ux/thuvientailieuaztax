import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchDocuments,
  fetchInfographics,
  isSupabaseConfigured,
  resetCms,
  saveDocumentsCms,
  saveInfographicsCms,
} from '../services/api'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { ROLES } from '../lib/roles'
import AccessDenied from '../components/auth/AccessDenied'
import { ChevronLeft } from '../components/icons'

/**
 * CMS — chỉ user.role === 'admin' (từ useAuth).
 * Route /admin còn bọc ProtectedRoute roles="admin".
 */
export default function AdminCMS() {
  const { showToast } = useApp()
  const { user, loading: authLoading } = useAuth()

  const [tab, setTab] = useState('docs')
  const [docsJson, setDocsJson] = useState('')
  const [infoJson, setInfoJson] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // Nguồn role duy nhất: useAuth().user.role
  const isCmsAdmin = user?.role === ROLES.ADMIN

  useEffect(() => {
    if (!isCmsAdmin) return undefined

    let cancelled = false
    ;(async () => {
      try {
        const [docs, info] = await Promise.all([
          fetchDocuments(),
          fetchInfographics(),
        ])
        if (cancelled) return
        setDocsJson(JSON.stringify(docs, null, 2))
        setInfoJson(JSON.stringify(info, null, 2))
      } catch (e) {
        if (!cancelled) setError(e.message)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isCmsAdmin])

  if (authLoading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
      </div>
    )
  }

  // Phòng thủ trong component
  if (!isCmsAdmin) {
    return (
      <div className="admin-page">
        <AccessDenied title="Bạn không có quyền truy cập CMS" />
      </div>
    )
  }

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      if (tab === 'docs') {
        const parsed = JSON.parse(docsJson)
        if (!Array.isArray(parsed)) throw new Error('Documents phải là mảng JSON')
        await saveDocumentsCms(parsed)
        showToast('Đã lưu Documents lên Supabase.')
      } else {
        const parsed = JSON.parse(infoJson)
        if (!Array.isArray(parsed)) throw new Error('Infographics phải là mảng JSON')
        await saveInfographicsCms(parsed)
        showToast('Đã lưu Infographics lên Supabase.')
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const reset = async () => {
    await resetCms(tab === 'docs' ? 'docs' : 'info')
    showToast('Đã xóa cache local. Tải lại trang để lấy dữ liệu từ Supabase.')
    window.location.reload()
  }

  return (
    <div className="admin-page">
      <div className="container">
        <Link to="/" className="back-link">
          <ChevronLeft size={16} /> Về trang chủ
        </Link>
        <div className="section-head left">
          <span className="eyebrow">CMS · Admin only</span>
          <h1>Cập nhật tài liệu không cần code</h1>
          <p>
            Backend:{' '}
            <strong>
              {isSupabaseConfigured ? 'Supabase đã kết nối' : 'Chưa cấu hình Supabase'}
            </strong>
            . Admin: <strong>{user.email}</strong> (role: <code>{user.role}</code>).
          </p>
        </div>

        <div className="schema-cards">
          <div className="schema-card">
            <h3>Document schema</h3>
            <code>
              id, type, category, tags, title, description, thumbnail_url,
              view_preview_url, direct_download_url, year, featured, popular,
              priority (int, nhỏ hơn = nổi bật trước, default 100), icon, created_at
            </code>
          </div>
          <div className="schema-card">
            <h3>Infographic schema</h3>
            <code>
              id, title, thumbnail_url, detailed_view_url, direct_download_url,
              tags, category, year, color
            </code>
          </div>
        </div>

        <div className="auth-tabs admin-tabs">
          <button
            type="button"
            className={tab === 'docs' ? 'active' : ''}
            onClick={() => setTab('docs')}
          >
            Documents
          </button>
          <button
            type="button"
            className={tab === 'info' ? 'active' : ''}
            onClick={() => setTab('info')}
          >
            Infographics
          </button>
        </div>

        <textarea
          className="cms-editor"
          value={tab === 'docs' ? docsJson : infoJson}
          onChange={(e) =>
            tab === 'docs' ? setDocsJson(e.target.value) : setInfoJson(e.target.value)
          }
          spellCheck={false}
          rows={22}
        />

        {error && <p className="field-error">{error}</p>}

        <div className="admin-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={save}
            disabled={saving}
          >
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
          <button type="button" className="btn btn-outline" onClick={reset}>
            Xóa cache local
          </button>
        </div>
      </div>
    </div>
  )
}
