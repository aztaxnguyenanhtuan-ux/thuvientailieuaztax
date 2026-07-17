import { useEffect, useState } from 'react'
import { POSITIONS } from '../data/constants'
import { useApp } from '../context/AppContext'
import { Download, X } from './icons'

const empty = {
  fullName: '',
  email: '',
  phone: '',
  position: '',
  company: '',
}

export default function DownloadModal() {
  const { downloadDoc, setDownloadDoc, submitDownloadLead, user } = useApp()
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!downloadDoc) return undefined
    if (user) {
      setForm({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        position: user.position || '',
        company: user.company || '',
      })
    } else {
      setForm(empty)
    }
    setErrors({})
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [downloadDoc, user])

  if (!downloadDoc) return null

  const validate = () => {
    const e = {}
    if (!form.fullName.trim()) e.fullName = 'Vui lòng nhập họ và tên'
    if (!form.email.trim()) e.email = 'Vui lòng nhập email công ty'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Email không hợp lệ'
    if (!form.position) e.position = 'Vui lòng chọn chức vụ'
    if (!form.company.trim()) e.company = 'Vui lòng nhập tên công ty'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const onSubmit = (ev) => {
    ev.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setTimeout(() => {
      submitDownloadLead(form)
      setSubmitting(false)
    }, 500)
  }

  const downloadUrl =
    downloadDoc.direct_download_url && downloadDoc.direct_download_url !== '#'
      ? downloadDoc.direct_download_url
      : null

  return (
    <div className="modal-overlay" onClick={() => setDownloadDoc(null)} role="presentation">
      <div
        className="modal-panel download-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="download-modal-title"
      >
        <button
          type="button"
          className="modal-close"
          onClick={() => setDownloadDoc(null)}
          aria-label="Đóng"
        >
          <X size={20} />
        </button>

        {!downloadDoc.unlocked ? (
          <>
            <div className="modal-head">
              <span className="eyebrow">Nhận tài liệu miễn phí</span>
              <h2 id="download-modal-title">Nhận ngay tài liệu</h2>
              <p className="modal-doc-name">{downloadDoc.title}</p>
              <p className="muted">
                Điền thông tin để nhận tài liệu – miễn phí hoàn toàn
              </p>
            </div>

            <form className="lead-form" onSubmit={onSubmit} noValidate>
              <label>
                <span className="field-label">
                  Họ và tên<span className="req">*</span>
                </span>
                <input
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="Nguyễn Văn A"
                />
                {errors.fullName && <em className="field-error">{errors.fullName}</em>}
              </label>

              <label>
                <span className="field-label">
                  Email công ty nhận tài liệu<span className="req">*</span>
                </span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="name@company.com"
                />
                {errors.email && <em className="field-error">{errors.email}</em>}
              </label>

              <label>
                <span className="field-label">
                  Chức vụ<span className="req">*</span>
                </span>
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
                {errors.position && <em className="field-error">{errors.position}</em>}
              </label>

              <label>
                <span className="field-label">
                  Tên công ty<span className="req">*</span>
                </span>
                <input
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="Công ty TNHH ..."
                />
                {errors.company && <em className="field-error">{errors.company}</em>}
              </label>

              <label>
                <span className="field-label">
                  Số điện thoại <span className="optional">(Nếu cần hỗ trợ)</span>
                </span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="09xx xxx xxx"
                />
              </label>

              <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                {submitting ? 'Đang xử lý...' : 'Nhận tài liệu ngay'}
              </button>
            </form>
          </>
        ) : (
          <div className="download-success">
            <div className="success-icon">✓</div>
            <h2>Sẵn sàng tải xuống!</h2>
            <p>
              Cảm ơn <strong>{downloadDoc.lead?.fullName || user?.fullName}</strong>.
              Liên kết tải xuống đã sẵn sàng bên dưới.
            </p>
            <p className="modal-doc-name">{downloadDoc.title}</p>
            {downloadUrl ? (
              <a
                className="btn btn-primary btn-lg btn-block"
                href={downloadUrl}
                target="_blank"
                rel="noreferrer"
              >
                <Download size={18} />
                Tải xuống trực tiếp
              </a>
            ) : (
              <div className="coming-soon-box">
                <strong>COMING SOON</strong>
                <p>TÀI LIỆU ĐANG ĐƯỢC CẬP NHẬT</p>
                <span>
                  AZTAX đang hoàn thiện nội dung để gửi đến bạn phiên bản mới
                  nhất và đầy đủ nhất.
                </span>
              </div>
            )}
            <button
              type="button"
              className="btn btn-outline btn-block"
              onClick={() => setDownloadDoc(null)}
            >
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
