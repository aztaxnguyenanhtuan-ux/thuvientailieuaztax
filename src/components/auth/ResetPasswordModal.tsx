import { useEffect, useState, type FormEvent } from 'react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { X } from '../icons'
import PasswordField from './PasswordField'

export default function ResetPasswordModal() {
  const { authModal, closeAuthModal, updatePassword } = useAuth()
  const { showToast } = useApp()
  const open = authModal === 'reset-password'

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setPassword('')
    setConfirmPassword('')
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

    if (password.length < 6) {
      setError('Mật khẩu mới phải có tối thiểu 6 ký tự.')
      return
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }

    setLoading(true)
    try {
      await updatePassword(password)
      showToast('Đã đổi mật khẩu mới thành công!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không cập nhật được mật khẩu.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={closeAuthModal} role="presentation">
      <div
        className="modal-panel auth-modal reset-password-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-password-title"
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
          <span className="eyebrow">Khôi phục tài khoản</span>
          <h2 id="reset-password-title">Đặt mật khẩu mới</h2>
          <p className="muted">
            Vui lòng nhập mật khẩu mới để hoàn tất khôi phục tài khoản AZTAX.
          </p>
        </div>

        <form className="lead-form auth-form" onSubmit={onSubmit}>
          <PasswordField
            label={
              <>
                Mật khẩu mới<span className="req">*</span>
              </>
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tối thiểu 6 ký tự"
            autoComplete="new-password"
            required
            minLength={6}
          />

          <PasswordField
            label={
              <>
                Xác nhận mật khẩu mới<span className="req">*</span>
              </>
            }
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Nhập lại mật khẩu mới"
            autoComplete="new-password"
            required
            minLength={6}
          />

          {error && <p className="field-error">{error}</p>}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  )
}
