import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import {
  isUsableUrl,
  resolveDownloadUrl,
  resolveMediaView,
} from '../services/infographics'
import { Download, X, ZoomIn, ZoomOut } from './icons'

/**
 * Component Lightbox tối ưu đặc quyền cho di động thực tế (iPhone 16 Pro Max / iOS Safari / Android):
 * - Khóa cuộn body bằng position: fixed chuẩn iOS, triệt tiêu 100% hiện tượng đơ touch event.
 * - Trên di động (< 680px), ưu tiên sử dụng ảnh thumbnail_url nén nhẹ nếu có để không gây quá tải RAM.
 * - Ép kích thước hiển thị tối đa (max-height: 70vh, decoding="async", loading="lazy") tránh VRAM allocation crash.
 * - Nút bấm tối thiểu 44px x 44px nhận sự kiện va chạm tức thì.
 */
export default function Lightbox() {
  const { lightbox, setLightbox } = useApp()
  const [zoom, setZoom] = useState(1)
  const [mediaError, setMediaError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSlow, setIsSlow] = useState(false)

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 680

  // Khóa cuộn trang chuẩn cho iOS Safari & Android tránh đơ / lag touch event
  useEffect(() => {
    if (!lightbox) return undefined

    setZoom(1)
    setMediaError(false)
    setIsLoading(true)
    setIsSlow(false)

    // Lưu vị trí cuộn trang hiện tại và khóa body dạng fixed
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'

    const onKey = (e) => {
      if (e.key === 'Escape') setLightbox(null)
    }
    window.addEventListener('keydown', onKey)

    // Cảnh báo nếu nạp ảnh quá 8 giây trên di động
    const timer = setTimeout(() => {
      setIsSlow(true)
    }, 8000)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', onKey)
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
      window.scrollTo(0, scrollY)
    }
  }, [lightbox, setLightbox])

  // Trên mobile: Ưu tiên thumbnail_url nhẹ hơn nếu có để tránh giật lag máy
  const primaryView = useMemo(() => {
    if (!lightbox) return null
    if (isMobile && lightbox.thumbnail_url) {
      const thumbView = resolveMediaView(lightbox.thumbnail_url)
      if (thumbView) return thumbView
    }
    return (
      resolveMediaView(lightbox.detailed_view_url) ||
      resolveMediaView(lightbox.thumbnail_url)
    )
  }, [isMobile, lightbox])

  if (!lightbox) return null

  const downloadUrl =
    resolveDownloadUrl(lightbox.direct_download_url) ||
    (isUsableUrl(lightbox.direct_download_url)
      ? lightbox.direct_download_url
      : null)

  const showMedia = primaryView && !mediaError

  const handleClose = (e) => {
    e?.stopPropagation()
    setLightbox(null)
  }

  return (
    <div
      className="modal-overlay"
      onClick={handleClose}
      role="presentation"
    >
      <div
        className="lightbox-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={lightbox.title}
      >
        {/* Thanh công cụ xem Infographic */}
        <div className="lightbox-toolbar">
          <h3>{lightbox.title}</h3>
          <div className="lightbox-actions">
            {primaryView?.kind === 'image' && !mediaError && (
              <>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setZoom((z) => Math.min(z + 0.25, 2.0))}
                  title="Phóng to"
                  aria-label="Phóng to"
                >
                  <ZoomIn size={18} />
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setZoom((z) => Math.max(z - 0.25, 0.75))}
                  title="Thu nhỏ"
                  aria-label="Thu nhỏ"
                >
                  <ZoomOut size={18} />
                </button>
              </>
            )}
            {downloadUrl ? (
              <a
                className="btn btn-primary btn-sm"
                href={downloadUrl}
                target="_blank"
                rel="noreferrer"
              >
                <Download size={15} /> Tải về
              </a>
            ) : (
              <button type="button" className="btn btn-primary btn-sm" disabled>
                <Download size={15} /> Sắp có
              </button>
            )}
            <button
              type="button"
              className="icon-btn"
              onClick={handleClose}
              aria-label="Đóng"
              title="Đóng xem trước"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Khung hiển thị Infographic */}
        <div className="lightbox-stage">
          {/* Trạng thái Loading / Ảnh nạp chậm trên di động */}
          {isLoading && showMedia && (
            <div className="lightbox-loading-indicator" style={{ position: 'absolute', color: '#ffffff', textAlign: 'center', zIndex: 5 }}>
              <div className="spinner" style={{ margin: '0 auto 0.5rem' }} />
              <span style={{ fontSize: '0.88rem', opacity: 0.9 }}>
                {isSlow ? 'Ảnh Infographic lớn, đang tải...' : 'Đang nạp Infographic...'}
              </span>
            </div>
          )}

          {showMedia && primaryView.kind === 'iframe' ? (
            <div className="lightbox-canvas lightbox-canvas-iframe">
              <iframe
                className="lightbox-iframe"
                src={primaryView.src}
                title={lightbox.title}
                allow="autoplay"
                allowFullScreen
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false)
                  setMediaError(true)
                }}
              />
            </div>
          ) : showMedia && primaryView.kind === 'image' ? (
            <div
              className="lightbox-canvas lightbox-canvas-image"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
            >
              <img
                className="lightbox-img"
                src={primaryView.src}
                alt={lightbox.title}
                loading="lazy"
                decoding="async"
                fetchpriority="high"
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false)
                  setMediaError(true)
                }}
              />
            </div>
          ) : (
            <div
              className="lightbox-canvas"
              style={{
                background: `linear-gradient(160deg, ${lightbox.color || '#0B3A5C'} 0%, #061a2e 100%)`,
                borderRadius: '12px',
                padding: '2rem 1.5rem',
              }}
            >
              <div className="lightbox-content" style={{ textAlign: 'center', maxWidth: '480px' }}>
                <span className="info-thumb-badge" style={{ display: 'inline-block', marginBottom: '0.75rem' }}>
                  AZTAX INFOGRAPHIC · {lightbox.year || 2026}
                </span>
                <h2 style={{ color: '#ffffff', fontSize: '1.25rem', marginBottom: '1rem' }}>{lightbox.title}</h2>

                <p className="lightbox-empty-msg" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                  {mediaError
                    ? 'Hình ảnh xem trước quá lớn hoặc đường truyền chậm. Bạn có thể tải file gốc về máy để xem tốt nhất.'
                    : 'Chưa có bản xem trước trực tiếp. Bạn có thể bấm nút Tải xuống để xem file gốc.'}
                </p>

                {downloadUrl && (
                  <a
                    className="btn btn-primary btn-lg"
                    href={downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ margin: '0 auto', display: 'inline-flex' }}
                  >
                    <Download size={18} /> Tải file Infographic gốc
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
