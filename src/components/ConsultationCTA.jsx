import { useState } from 'react'
import { CONTACT } from '../data/constants'
import { saveLead } from '../services/api'
import { useApp } from '../context/AppContext'
import { ChevronDown, Phone } from './icons'

export default function ConsultationCTA() {
  const { showToast } = useApp()
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    need: '',
  })
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim()) {
      showToast('Vui lòng điền họ tên, email và số điện thoại.', 'info')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.email.trim())) {
      showToast('Email không đúng định dạng. Vui lòng nhập lại.', 'info')
      return
    }
    const phoneRegex = /^[0-9\s+().-]{8,15}$/
    if (!phoneRegex.test(form.phone.trim())) {
      showToast('Số điện thoại không hợp lệ.', 'info')
      return
    }
    setSubmitting(true)
    try {
      await saveLead({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        company: form.company.trim(),
        need: form.need.trim(),
        source: 'consultation-cta',
      })
      setDone(true)
      showToast('Đã gửi yêu cầu tư vấn. AZTAX sẽ liên hệ sớm!')
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
          <span className="eyebrow light">Tư vấn cá nhân</span>
          <h2>Bạn chưa tìm thấy tài liệu phù hợp?</h2>
          <p className="cta-lead">
            Nhận tư vấn miễn phí từ chuyên gia kế toán FDI của AZTAX.
            <br />
            Mô tả nhu cầu — chúng tôi sẽ gợi ý bộ tài liệu và quy trình phù hợp.
          </p>

          <a href={CONTACT.phoneHref} className="cta-phone">
            <Phone size={20} />
            {CONTACT.phone}
          </a>

          <div className="cta-form-wrap">
            {done ? (
              <div className="download-success compact">
                <div className="success-icon">✓</div>
                <h3>Đã nhận yêu cầu!</h3>
                <p>Chuyên gia AZTAX sẽ liên hệ trong giờ làm việc.</p>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setDone(false)
                    setForm({
                      fullName: '',
                      email: '',
                      phone: '',
                      company: '',
                      need: '',
                    })
                  }}
                >
                  Gửi yêu cầu khác
                </button>
              </div>
            ) : (
              <>
                <h3>Form tư vấn miễn phí</h3>
                <form className="lead-form" onSubmit={onSubmit}>
                  <label>
                    <span className="field-label">
                      Họ và tên<span className="req">*</span>
                    </span>
                    <input
                      value={form.fullName}
                      onChange={(e) =>
                        setForm({ ...form, fullName: e.target.value })
                      }
                    />
                  </label>
                  <div className="form-row">
                    <label>
                      <span className="field-label">
                        Email<span className="req">*</span>
                      </span>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      <span className="field-label">
                        Số điện thoại<span className="req">*</span>
                      </span>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) =>
                          setForm({ ...form, phone: e.target.value })
                        }
                      />
                    </label>
                  </div>
                  <label>
                    <span className="field-label">Công ty</span>
                    <input
                      value={form.company}
                      onChange={(e) =>
                        setForm({ ...form, company: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    <span className="field-label">Nhu cầu tư vấn</span>
                    <textarea
                      rows={3}
                      value={form.need}
                      onChange={(e) =>
                        setForm({ ...form, need: e.target.value })
                      }
                      placeholder="Ví dụ: setup kế toán cho công ty FDI mới, checklist thanh tra..."
                    />
                  </label>
                  <button
                    type="submit"
                    className="btn btn-secondary btn-block btn-lg"
                    disabled={submitting}
                  >
                    {submitting ? 'Đang gửi...' : 'Tư vấn ngay'}
                    {!submitting && <ChevronDown size={18} />}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
