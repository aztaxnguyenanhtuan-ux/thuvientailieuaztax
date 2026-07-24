import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../context/AuthContext'
import { X } from '../icons'
import PasswordField from './PasswordField'

export default function LoginModal() {
  const { authModal, closeAuthModal, switchToRegister, signIn, resetPassword } = useAuth()
  const open = authModal === 'login'

  const [isForgot, setIsForgot] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setIsForgot(false)
    setError('')
    setSuccess('')
    setLoading(false)
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  const onSubmitLogin = async (e: FormEvent) => {
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

  const onSubmitForgot = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!email.trim()) {
      setError('Vui lòng nhập email công ty đã đăng ký.')
      return
    }

    setLoading(true)
    try {
      await resetPassword(email)
      setSuccess(
        `Nếu email ${email} đã được đăng ký, bạn sẽ nhận được liên kết khôi phục trong giây lát. Vui lòng kiểm tra hộp thư (bao gồm cả thư mục Spam)!`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không gửi được email khôi phục.')
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

        {!isForgot ? (
          <>
            <div className="modal-head">
              <span className="eyebrow">Tài khoản AZTAX</span>
              <h2 id="login-title">Đăng nhập</h2>
              <p className="muted">
                Dùng email công ty để tải tài liệu nhanh và lưu thư viện cá nhân.
              </p>
            </div>

            <form className="lead-form auth-form" onSubmit={onSubmitLogin}>
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

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="field-label" style={{ marginBottom: '0.4rem' }}>
                    Mật khẩu<span className="req">*</span>
                  </span>
                  <button
                    type="button"
                    style={{
                      fontSize: '0.82rem',
                      color: 'var(--brand)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                    onClick={() => {
                      setIsForgot(true)
                      setError('')
                      setSuccess('')
                    }}
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <PasswordField
                  label={null}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  minLength={6}
                />
              </div>

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
          </>
        ) : (
          <>
            <div className="modal-head">
              <span className="eyebrow">Khôi phục tài khoản</span>
              <h2>Quên mật khẩu</h2>
              <p className="muted">
                Nhập email công ty đã đăng ký. Hệ thống sẽ gửi liên kết đặt lại mật khẩu cho bạn.
              </p>
            </div>

            <form className="lead-form auth-form" onSubmit={onSubmitForgot}>
              <label>
                <span className="field-label">
                  Email đăng ký<span className="req">*</span>
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

              {error && <p className="field-error">{error}</p>}
              {success && <p className="field-success">{success}</p>}

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={loading}
              >
                {loading ? 'Đang gửi...' : 'Gửi liên kết khôi phục'}
              </button>
            </form>

            <p className="auth-switch">
              <button
                type="button"
                onClick={() => {
                  setIsForgot(false)
                  setError('')
                  setSuccess('')
                }}
              >
                ← Quay lại Đăng nhập
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
