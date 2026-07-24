import { useEffect, useState, type FormEvent } from 'react'
import { POSITIONS } from '../../data/constants'
import { useAuth } from '../../context/AuthContext'
import { X } from '../icons'
import PasswordField from './PasswordField'

export default function RegisterModal() {
  const { authModal, closeAuthModal, switchToLogin, signUp } = useAuth()
  const open = authModal === 'register'

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    company: '',
    position: '',
    phone: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setError('')
    setSuccess('')
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
    setSuccess('')

    if (!form.fullName.trim() || !form.email.trim() || !form.password || !form.company.trim()) {
      setError('Vui lòng điền đầy đủ các trường bắt buộc.')
      return
    }

    setLoading(true)
    try {
      await signUp({
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        company: form.company,
        position: form.position,
        phone: form.phone,
      })
      setSuccess(
        'Đăng ký thành công! Nếu dự án bật xác nhận email, hãy kiểm tra hộp thư trước khi đăng nhập.',
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng ký thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={closeAuthModal} role="presentation">
      <div
        className="modal-panel auth-modal register-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="register-title"
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
          <h2 id="register-title">Đăng ký</h2>
          <p className="muted">
            Tạo tài khoản bằng email công ty — tải tài liệu không cần điền form mỗi lần.
          </p>
        </div>

        <form className="lead-form auth-form" onSubmit={onSubmit}>
          <label>
            <span className="field-label">
              Họ và tên<span className="req">*</span>
            </span>
            <input
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="Nguyễn Văn A"
              autoComplete="name"
              required
            />
          </label>

          <label>
            <span className="field-label">
              Email công ty<span className="req">*</span>
            </span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="name@company.com"
              autoComplete="email"
              required
            />
          </label>

          <PasswordField
            label={
              <>
                Mật khẩu<span className="req">*</span>
              </>
            }
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Tối thiểu 6 ký tự"
            autoComplete="new-password"
            required
            minLength={6}
          />

          <label>
            <span className="field-label">
              Tên công ty<span className="req">*</span>
            </span>
            <input
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              placeholder="Công ty TNHH ..."
              autoComplete="organization"
              required
            />
          </label>

          <label>
            <span className="field-label">Chức vụ</span>
            <select
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
            >
              <option value="">— Chọn chức vụ —</option>
              {POSITIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="field-label">Số điện thoại</span>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="09xx xxx xxx"
              autoComplete="tel"
            />
          </label>

          {error && <p className="field-error">{error}</p>}
          {success && <p className="field-success">{success}</p>}

          <button
            type="submit"
            className="btn btn-secondary btn-block"
            disabled={loading}
          >
            {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
          </button>
        </form>

        <p className="auth-switch">
          Đã có tài khoản?{' '}
          <button type="button" onClick={switchToLogin}>
            Đăng nhập
          </button>
        </p>
      </div>
    </div>
  )
}
