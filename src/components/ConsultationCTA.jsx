import { useState } from 'react'
import { CONTACT } from '../data/constants'
import { saveLead } from '../services/api'
import { useApp } from '../context/AppContext'
import { ChevronDown, Phone, Clock, CheckCircle2 } from './icons'

const NEED_CATEGORIES = [
  'Khóa học kế toán FDI',
  'Dịch vụ kế toán FDI',
  'Tư vấn khác',
]

export default function ConsultationCTA() {
  const { showToast } = useApp()
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    consultCategory: 'Khóa học kế toán FDI',
    need: '',
  })
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim()) {
      showToast('Vui lòng điền Họ và tên, Email và Số điện thoại.', 'info')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.email.trim())) {
      showToast('Email không hợp lệ. Vui lòng kiểm tra lại.', 'info')
      return
    }
    const phoneRegex = /^[0-9\s+().-]{8,15}$/
    if (!phoneRegex.test(form.phone.trim())) {
      showToast('Số điện thoại không hợp lệ.', 'info')
      return
    }

    const detailNeed = form.need.trim()
      ? `[Category: ${form.consultCategory}] ${form.need.trim()}`
      : `[Category: ${form.consultCategory}]`

    setSubmitting(true)
    try {
      await saveLead({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        company: form.company.trim(),
        need: detailNeed,
        source: 'consultation-cta',
      })
      setDone(true)
      showToast('Đã gửi yêu cầu tư vấn! AZTAX sẽ liên hệ lại sớm.')
    } catch (err) {
      showToast(err.message || 'Gửi không thành công.', 'info')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="section section-white cta-section" id="tu-van">
      <div className="container cta-center">
        <div className="cta-arrow" aria-hidden="true">
          <ChevronDown size={28} />
        </div>

        <div className="cta-hero-card">
          <span className="eyebrow light">Tư vấn Kế toán FDI</span>
          <h2>Bạn đang cần tư vấn về Kế toán FDI?</h2>
          <p className="cta-lead">
            Dù bạn đang tìm hiểu khóa học hay cần dịch vụ kế toán cho doanh nghiệp FDI, hãy để lại thông tin.
            <br />
            Chuyên gia AZTAX sẽ liên hệ và hỗ trợ tư vấn miễn phí.
          </p>

          <a href={CONTACT.phoneHref} className="cta-phone">
            <Phone size={18} />
            {CONTACT.phone}
          </a>

          <div className="cta-form-wrap">
            {done ? (
              <div className="download-success compact">
                <div className="success-icon" style={{ color: '#004aad' }}>
                  <CheckCircle2 size={40} />
                </div>
                <h3>Đã nhận thông tin đăng ký!</h3>
                <p>Chuyên gia AZTAX sẽ liên hệ hỗ trợ bạn trong vòng 24 giờ làm việc.</p>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ marginTop: '1rem' }}
                  onClick={() => {
                    setDone(false)
                    setForm({
                      fullName: '',
                      email: '',
                      phone: '',
                      company: '',
                      consultCategory: 'Khóa học kế toán FDI',
                      need: '',
                    })
                  }}
                >
                  Gửi yêu cầu khác
                </button>
              </div>
            ) : (
              <>
                <h3>Để lại thông tin nhận tư vấn miễn phí</h3>
                <form className="lead-form" onSubmit={onSubmit} noValidate>
                  {/* Need Selection Chips */}
                  <div className="form-group-need">
                    <span className="field-label-group">
                      Nhu cầu bạn đang quan tâm:<span className="req">*</span>
                    </span>
                    <div
                      className="need-selector-grid"
                      role="radiogroup"
                      aria-label="Nhu cầu tư vấn"
                    >
                      {NEED_CATEGORIES.map((cat) => {
                        const isSelected = form.consultCategory === cat
                        return (
                          <button
                            key={cat}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            className={`need-chip-btn ${isSelected ? 'active' : ''}`}
                            onClick={() =>
                              setForm({ ...form, consultCategory: cat })
                            }
                          >
                            <span className="chip-radio" />
                            <span className="chip-label">{cat}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="form-row">
                    <label>
                      <span className="field-label">
                        Họ và tên<span className="req">*</span>
                      </span>
                      <input
                        type="text"
                        placeholder="Nhập họ và tên"
                        value={form.fullName}
                        onChange={(e) =>
                          setForm({ ...form, fullName: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      <span className="field-label">
                        Số điện thoại<span className="req">*</span>
                      </span>
                      <input
                        type="tel"
                        placeholder="Nhập số điện thoại"
                        value={form.phone}
                        onChange={(e) =>
                          setForm({ ...form, phone: e.target.value })
                        }
                      />
                    </label>
                  </div>

                  <div className="form-row">
                    <label>
                      <span className="field-label">
                        Email<span className="req">*</span>
                      </span>
                      <input
                        type="email"
                        placeholder="Nhập email"
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      <span className="field-label">
                        Công ty (không bắt buộc)
                      </span>
                      <input
                        type="text"
                        placeholder="Nhập tên công ty"
                        value={form.company}
                        onChange={(e) =>
                          setForm({ ...form, company: e.target.value })
                        }
                      />
                    </label>
                  </div>

                  <label>
                    <span className="field-label">Nhu cầu tư vấn</span>
                    <textarea
                      rows={3}
                      value={form.need}
                      onChange={(e) =>
                        setForm({ ...form, need: e.target.value })
                      }
                      placeholder="Ví dụ: cần tư vấn khóa học kế toán FDI / setup kế toán cho công ty FDI mới..."
                    />
                  </label>

                  <button
                    type="submit"
                    className="btn btn-secondary btn-block btn-lg cta-submit-btn"
                    disabled={submitting}
                  >
                    {submitting ? 'Đang gửi...' : 'Nhận tư vấn miễn phí'}
                  </button>

                  <p className="form-sla-note">
                    <Clock size={14} />
                    <span>Chúng tôi sẽ liên hệ trong vòng 24 giờ làm việc</span>
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
