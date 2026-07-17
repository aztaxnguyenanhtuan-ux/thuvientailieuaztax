import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { INFO_CATEGORIES, matchesInfoCategory } from '../data/constants'
import { useApp } from '../context/AppContext'
import {
  resolveCardImageCandidates,
  resolveDownloadUrl,
  resolveMediaView,
} from '../services/infographics'
import { Download, Eye, ZoomIn } from './icons'

/**
 * Ảnh card: thumbnail_url → detailed_view_url → gradient (khi hết candidate / load lỗi).
 * Lightbox vẫn mở item gốc (detailed_view_url) — không đổi.
 */
function InfographicThumb({ item, onOpen }) {
  const downloadUrl = resolveDownloadUrl(item.direct_download_url)
  const imageCandidates = useMemo(
    () =>
      resolveCardImageCandidates({
        thumbnail_url: item.thumbnail_url,
        detailed_view_url: item.detailed_view_url,
      }),
    [item.thumbnail_url, item.detailed_view_url],
  )

  const [imageIndex, setImageIndex] = useState(0)
  useEffect(() => {
    setImageIndex(0)
  }, [item.id, item.thumbnail_url, item.detailed_view_url])

  const thumbUrl =
    imageIndex < imageCandidates.length ? imageCandidates[imageIndex] : null

  const hasPreview = Boolean(
    resolveMediaView(item.detailed_view_url) ||
      resolveMediaView(item.thumbnail_url),
  )

  const handleImageError = () => {
    setImageIndex((i) => i + 1)
  }

  return (
    <article className="info-card">
      <button
        type="button"
        className={`info-thumb ${thumbUrl ? 'has-image' : ''}`}
        style={
          thumbUrl
            ? undefined
            : {
                background: `linear-gradient(145deg, ${item.color || '#004AAD'} 0%, #06356F 100%)`,
              }
        }
        onClick={() => onOpen(item)}
        aria-label={`Xem ${item.title}`}
      >
        {thumbUrl ? (
          <img
            key={thumbUrl}
            className="info-thumb-img"
            src={thumbUrl}
            alt={item.title}
            loading="lazy"
            decoding="async"
            onError={handleImageError}
          />
        ) : (
          <div className="info-thumb-inner">
            <span className="info-thumb-badge">INFOGRAPHIC</span>
            <h4>{item.title}</h4>
            <div className="info-thumb-meta">
              {item.tags?.slice(0, 2).map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </div>
        )}
        <span className="info-zoom">
          <ZoomIn size={18} />
        </span>
      </button>
      <div className="info-card-foot">
        <strong>{item.title}</strong>
        <div className="info-card-actions">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => onOpen(item)}
            disabled={!hasPreview && !item.title}
          >
            <Eye size={14} /> Xem trước
          </button>
          {downloadUrl ? (
            <a
              className="btn btn-secondary btn-sm"
              href={downloadUrl}
              target="_blank"
              rel="noreferrer"
            >
              <Download size={14} /> Tải xuống
            </a>
          ) : (
            <button type="button" className="btn btn-secondary btn-sm" disabled>
              <Download size={14} /> Tải xuống
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

export default function InfographicGallery({
  infographics,
  limit = 6,
  showAllLink = true,
  title = 'Các hướng dẫn, thông tin trực quan bằng Infographic',
  subtitle = 'Tài liệu trực quan, cập nhật 2026 — Tải xuống miễn phí',
}) {
  const { setLightbox } = useApp()
  const [cat, setCat] = useState('all')

  const list = Array.isArray(infographics) ? infographics : []
  const isEmptyLibrary = list.length === 0

  const filtered = useMemo(() => {
    return list.filter((i) => matchesInfoCategory(i.category, cat))
  }, [list, cat])

  const shown = limit ? filtered.slice(0, limit) : filtered

  const changeCategory = (id) => {
    if (id === cat) return
    setCat(id)
  }

  return (
    <section className="section section-white" id="infographic">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Kho Infographic</span>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

        {!isEmptyLibrary && (
          <div className="filter-tabs filter-tabs-sm" role="tablist">
            {INFO_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={cat === c.id}
                className={`filter-tab ${cat === c.id ? 'active' : ''}`}
                onClick={() => changeCategory(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}

        {isEmptyLibrary ? (
          <div className="empty-state">
            <p>Chưa có infographic nào</p>
          </div>
        ) : (
          <>
            <div className="info-grid" key={cat}>
              {shown.map((item) => (
                <InfographicThumb
                  key={item.id}
                  item={item}
                  onOpen={setLightbox}
                />
              ))}
            </div>

            {shown.length === 0 && (
              <div className="empty-state">
                <p>Chưa có infographic trong nhóm này.</p>
              </div>
            )}

            {showAllLink && (
              <div className="load-more-wrap">
                <Link to="/infographic" className="btn btn-primary">
                  Xem tất cả Infographic
                </Link>
              </div>
            )}

            {!showAllLink && filtered.length > shown.length && (
              <div className="load-more-wrap">
                <p className="muted">{filtered.length} infographic</p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}

export { InfographicThumb }
