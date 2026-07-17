import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CONTACT } from '../data/constants'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { useDocuments } from '../hooks/useData'
import {
  Bookmark,
  LogIn,
  LogOut,
  Menu,
  Phone,
  Search,
  Settings,
  UserRound,
  X,
} from './icons'

export default function Header() {
  const { savedIds, logout, searchQuery, setSearchQuery } = useApp()
  // User + role chỉ lấy từ useAuth (profiles.role)
  const { user, openLogin, openRegister, loading: authLoading } = useAuth()
  const { documents } = useDocuments()
  const [openMenu, setOpenMenu] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [userMenu, setUserMenu] = useState(false)
  const searchRef = useRef(null)
  const userMenuRef = useRef(null)
  const navigate = useNavigate()

  const displayName = user?.fullName || user?.email?.split('@')[0] || 'User'
  const showCmsMenu = user?.role === 'admin'

  const results = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (q.length < 2) return []
    return documents
      .filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          d.tags.some((t) => t.toLowerCase().includes(q)),
      )
      .slice(0, 6)
  }, [documents, searchQuery])

  useEffect(() => {
    const onClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenu(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link to="/" className="brand" onClick={() => setOpenMenu(false)}>
          <img
            className="brand-logo"
            src="https://aztax.com.vn/wp-content/uploads/2023/02/LOGO_AZ_TAX_FINAL-1-1024x512.png.webp"
            alt="AZTAX"
            width={128}
            height={64}
          />
          <div className="brand-text">
            <strong>KHO TÀI LIỆU</strong>
            <span>Kế toán FDI · Cập nhật 2026</span>
          </div>
        </Link>

        <div className="header-search" ref={searchRef}>
          <Search size={18} className="search-icon" />
          <input
            type="search"
            placeholder="Tìm tài liệu FDI, checklist, biểu mẫu..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setShowResults(true)
            }}
            onFocus={() => setShowResults(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && results[0]) {
                navigate(`/tai-lieu/${results[0].id}`)
                setShowResults(false)
              }
            }}
            aria-label="Tìm kiếm tài liệu"
          />
          {showResults && results.length > 0 && (
            <div className="search-dropdown">
              {results.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  className="search-item"
                  onClick={() => {
                    navigate(`/tai-lieu/${doc.id}`)
                    setShowResults(false)
                    setSearchQuery('')
                  }}
                >
                  <span className="search-item-type">{doc.type}</span>
                  <span className="search-item-title">{doc.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="header-actions">
          <a href={CONTACT.phoneHref} className="header-phone">
            <Phone size={16} />
            <span>
              <small>Tư vấn FDI</small>
              <strong>{CONTACT.phone}</strong>
            </span>
          </a>

          <Link to="/thu-vien" className="icon-btn" title="Tài liệu đã lưu">
            <Bookmark size={18} />
            {user && savedIds.length > 0 && (
              <span className="badge-count">{savedIds.length}</span>
            )}
          </Link>

          {!authLoading &&
            (user ? (
              <div className="user-menu-wrap" ref={userMenuRef}>
                <button
                  type="button"
                  className="header-user-chip"
                  onClick={() => setUserMenu((v) => !v)}
                  aria-label="Tài khoản"
                >
                  <span className="header-user-avatar">
                    <UserRound size={16} />
                  </span>
                  <span className="header-user-name">{displayName}</span>
                </button>
                {userMenu && (
                  <div className="user-dropdown">
                    <div className="user-dropdown-head">
                      <strong>{displayName}</strong>
                      <span>{user.email}</span>
                    </div>
                    <Link to="/thu-vien" onClick={() => setUserMenu(false)}>
                      Thư viện của tôi
                    </Link>
                    {showCmsMenu && (
                      <Link to="/admin" onClick={() => setUserMenu(false)}>
                        <Settings size={14} /> CMS
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        setUserMenu(false)
                        await logout()
                      }}
                    >
                      <LogOut size={14} /> Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="header-auth-group">
                <button
                  type="button"
                  className="btn btn-outline btn-sm header-auth-btn"
                  onClick={openLogin}
                >
                  <LogIn size={16} />
                  Đăng nhập
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm header-auth-btn"
                  onClick={openRegister}
                >
                  Đăng ký
                </button>
              </div>
            ))}

          <button
            type="button"
            className="icon-btn mobile-only"
            onClick={() => setOpenMenu((v) => !v)}
            aria-label="Menu"
          >
            {openMenu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {openMenu && (
        <div className="mobile-nav">
          <a href={CONTACT.phoneHref}>Gọi {CONTACT.phone}</a>
          <Link to="/infographic" onClick={() => setOpenMenu(false)}>
            Kho Infographic
          </Link>
          <Link to="/thu-vien" onClick={() => setOpenMenu(false)}>
            Tài liệu đã lưu
          </Link>
          {user ? (
            <>
              <div className="mobile-user-line">
                Xin chào, <strong>{displayName}</strong>
              </div>
              <button
                type="button"
                onClick={async () => {
                  setOpenMenu(false)
                  await logout()
                }}
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  openLogin()
                  setOpenMenu(false)
                }}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => {
                  openRegister()
                  setOpenMenu(false)
                }}
              >
                Đăng ký
              </button>
            </>
          )}
        </div>
      )}
    </header>
  )
}
