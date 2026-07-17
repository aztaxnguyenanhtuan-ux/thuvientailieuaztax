import { INDUSTRIES } from '../data/constants'
import { useCountUp, useInView } from '../hooks/useCountUp'
import { DocIcon } from './icons'

function Stat({ value, suffix, label, start }) {
  const n = useCountUp(value, 1400, start)
  return (
    <div className="trust-stat">
      <strong>
        {n}
        {suffix}
      </strong>
      <span>{label}</span>
    </div>
  )
}

export default function Testimonial() {
  const [ref, inView] = useInView()

  return (
    <section className="section section-stats" id="kiem-chung">
      <div className="container">
        <div className="section-head light">
          <span className="eyebrow light">Kiểm chứng thực tế</span>
          <h2>Tài liệu từ kinh nghiệm thực chiến</h2>
          <p>Phục vụ mọi loại hình doanh nghiệp FDI</p>
        </div>

        <blockquote className="testimonial-quote">
          <span className="quote-mark" aria-hidden="true">
            “
          </span>
          <p>
            Tài liệu của AZTAX đã giúp chúng tôi tránh được một lần bị truy thu
            thuế gần 800 triệu đồng. Checklist thanh tra rất thực tế, không phải
            sách giáo khoa.
          </p>
          <footer>
            — Giám đốc Tài chính, Công ty TNHH Sản xuất Điện tử (100% vốn Hàn
            Quốc)
          </footer>
        </blockquote>

        <div className="trust-stats" ref={ref}>
          <Stat value={500} suffix="+" label="Doanh nghiệp FDI được phục vụ" start={inView} />
          <Stat value={100} suffix="%" label="Tài liệu cập nhật theo quy định mới" start={inView} />
          <Stat value={10} suffix="+" label="Năm kinh nghiệm kế toán FDI thực tế" start={inView} />
        </div>

        <div className="industry-grid">
          {INDUSTRIES.map((ind) => (
            <div key={ind.label} className={`industry-chip ${inView ? 'in-view' : ''}`}>
              <DocIcon name={ind.icon} size={22} />
              <span>{ind.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
