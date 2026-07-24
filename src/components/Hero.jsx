import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { FEATURED_LIMIT } from '../data/constants'
import { getFeaturedDocuments } from '../services/documents'
import { useCountUp, useInView } from '../hooks/useCountUp'
import { ChevronDown } from './icons'

function StatBox({ value, suffix = '', label, start, format }) {
  const n = useCountUp(value, 1600, start)
  let display = `${n}${suffix}`
  if (format === 'k') {
    display =
      n >= 1000
        ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`.replace('.0K', 'K')
        : String(n)
  }
  return (
    <div className="stat-box">
      <strong>{display}</strong>
      <span>{label}</span>
    </div>
  )
}

/** Badge nhỏ trên từng dòng featured (giữ style tag-hot / tag-new / tag-free). */
function featuredBadge(doc) {
  const tags = doc.tags || []
  if (tags.some((t) => /hot/i.test(t)) || doc.featured) {
    return { text: 'HOT', className: 'tag-hot' }
  }
  if (tags.some((t) => /new|mới/i.test(t))) {
    return { text: 'Mới', className: 'tag-new' }
  }
  if (tags.some((t) => /free/i.test(t))) {
    return { text: 'Free', className: 'tag-free' }
  }
  return { text: 'HOT', className: 'tag-hot' }
}

function featuredSubtitle(doc) {
  const text = (doc.description || '').trim()
  if (!text) return doc.category || doc.type || ''
  return text.length > 72 ? `${text.slice(0, 72).trim()}…` : text
}

export default function Hero({ documents = [], loading = false }) {
  const [ref, inView] = useInView()

  const featuredDocs = useMemo(
    () => getFeaturedDocuments(documents, FEATURED_LIMIT),
    [documents],
  )

  const scrollToFilter = () => {
    document.getElementById('kho-tai-lieu')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  return (
    <section className="hero-section">
      <div className="hero-bg" aria-hidden="true" />
      <div className="container hero-grid">
        <div className="hero-copy">
          <span className="eyebrow">Thư viện miễn phí · Cập nhật 2026</span>
          <h1>
            KHO TÀI LIỆU <span className="text-accent">KẾ TOÁN FDI</span>
            <br />
            MIỄN PHÍ
          </h1>
          <p className="hero-lead">
            Dành riêng cho doanh nghiệp có vốn đầu tư nước ngoài tại Việt Nam
          </p>
          <ul className="hero-bullets">
            <li>Bộ biểu mẫu báo cáo định kỳ theo quy định hiện hành</li>
            <li>Checklist kế toán thuế đầy đủ cho công ty FDI</li>
            <li>Cập nhật quy định mới nhất về thuế & kế toán FDI</li>
            <li>Tài liệu xử lý sai sót kế toán thường gặp</li>
          </ul>
          <button type="button" className="btn btn-secondary btn-lg" onClick={scrollToFilter}>
            Chọn tài liệu và nhận ngay qua Email
            <ChevronDown size={18} />
          </button>

          <div className="hero-stats" ref={ref}>
            <StatBox
              value={500}
              suffix="+"
              label={'Doanh nghiệp FDI\nđược phục vụ'}
              start={inView}
            />
            <StatBox
              value={4200}
              format="k"
              label="Đã nhận tài liệu"
              start={inView}
            />
          </div>
        </div>

        <div className="hero-featured">
          <div className="featured-card">
            <span className="featured-label">Tài liệu nổi bật tháng này</span>
            <div className="featured-list">
              {loading ? (
                <div className="featured-item">
                  <div>
                    <strong>Đang tải…</strong>
                    <p>Lấy tài liệu nổi bật từ thư viện</p>
                  </div>
                </div>
              ) : featuredDocs.length === 0 ? (
                <div className="featured-item">
                  <div>
                    <strong>Chưa có tài liệu nổi bật</strong>
                    <p>Đánh dấu featured = true trên Supabase để hiển thị tại đây.</p>
                  </div>
                </div>
              ) : (
                featuredDocs.map((doc) => {
                  const badge = featuredBadge(doc)
                  return (
                    <Link
                      key={doc.id}
                      to={`/tai-lieu/${doc.id}`}
                      className="featured-item"
                    >
                      <span className={`tag ${badge.className}`}>{badge.text}</span>
                      <div>
                        <strong>{doc.title}</strong>
                        <p>{featuredSubtitle(doc)}</p>
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
