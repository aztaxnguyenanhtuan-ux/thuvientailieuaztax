import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../context/AuthContext'
import { X } from '../icons'

export default function LoginModal() {
  const { authModal, closeAuthModal, switchToRegister, signIn } = useAuth()
  const open = authModal === 'login'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setError('')
    setLoading(false)
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={closeAuthModal} role="presentation">
      <div
        className="modal-panel auth-modal login-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
      >
        <button
          type="button"
          className="modal-close"
          onClick={closeAuthModal}
          aria-label="Đóng"
        >
          <X size={20} />
        </button>

        <div className="modal-head">
          <span className="eyebrow">Tài khoản AZTAX</span>
          <h2 id="login-title">Đăng nhập</h2>
          <p className="muted">
            Dùng email công ty để tải tài liệu nhanh và lưu thư viện cá nhân.
          </p>
        </div>

        <form className="lead-form auth-form" onSubmit={onSubmit}>
          <label>
            <span className="field-label">
              Email<span className="req">*</span>
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            <span className="field-label">
              Mật khẩu<span className="req">*</span>
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              minLength={6}
            />
          </label>

          {error && <p className="field-error">{error}</p>}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <p className="auth-switch">
          Chưa có tài khoản?{' '}
          <button type="button" onClick={switchToRegister}>
            Đăng ký ngay
          </button>
        </p>
      </div>
    </div>
  )
}
