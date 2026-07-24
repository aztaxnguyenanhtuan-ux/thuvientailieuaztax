import { BUNDLES } from '../data/constants'
import { useApp } from '../context/AppContext'

export default function BundleSection() {
  const { requestDownload } = useApp()

  return (
    <section className="section section-brand" id="nhom-chuyen-biet">
      <div className="container">
        <div className="section-head light">
          <span className="eyebrow light">4 nhóm chuyên biệt</span>
          <h2>Nhận ngay bộ tài liệu theo nhu cầu</h2>
          <p>
            Chọn nhóm phù hợp – chúng tôi sẽ gửi tài liệu + toàn bộ bộ tài liệu
            liên quan qua email.
          </p>
        </div>
        <div className="bundle-grid">
          {BUNDLES.map((b) => (
            <article key={b.id} className="bundle-card" style={{ '--bundle': b.color }}>
              <h3>{b.title}</h3>
              <p className="bundle-sub">{b.subtitle}</p>
              <ul>
                {b.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() =>
                  requestDownload({
                    id: b.id,
                    title: b.title,
                    type: 'PDF',
                    direct_download_url: '#',
                    description: b.subtitle,
                  })
                }
              >
                Nhận bộ tài liệu này
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
