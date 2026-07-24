import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import {
  isUsableUrl,
  resolveDownloadUrl,
  resolveMediaView,
} from '../services/infographics'
import { Download, X, ZoomIn, ZoomOut } from './icons'

export default function Lightbox() {
  const { lightbox, setLightbox } = useApp()
  const [zoom, setZoom] = useState(1)
  const [mediaError, setMediaError] = useState(false)

  useEffect(() => {
    if (!lightbox) return undefined
    setZoom(1)
    setMediaError(false)
    const onKey = (e) => {
      if (e.key === 'Escape') setLightbox(null)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [lightbox, setLightbox])

  if (!lightbox) return null

  // Ưu tiên detailed_view_url; fallback thumbnail_url
  const primaryView =
    resolveMediaView(lightbox.detailed_view_url) ||
    resolveMediaView(lightbox.thumbnail_url)

  const downloadUrl =
    resolveDownloadUrl(lightbox.direct_download_url) ||
    (isUsableUrl(lightbox.direct_download_url)
      ? lightbox.direct_download_url
      : null)

  const showMedia = primaryView && !mediaError

  return (
    <div className="modal-overlay" onClick={() => setLightbox(null)} role="presentation">
      <div
        className="lightbox-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={lightbox.title}
      >
        <div className="lightbox-toolbar">
          <h3>{lightbox.title}</h3>
          <div className="lightbox-actions">
            {primaryView?.kind === 'image' && (
              <>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setZoom((z) => Math.min(z + 0.25, 2.5))}
                  title="Zoom in"
                >
                  <ZoomIn size={18} />
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setZoom((z) => Math.max(z - 0.25, 0.6))}
                  title="Zoom out"
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
                <Download size={15} /> Tải xuống
              </a>
            ) : (
              <button type="button" className="btn btn-primary btn-sm" disabled>
                <Download size={15} /> Sắp có
              </button>
            )}
            <button
              type="button"
              className="icon-btn"
              onClick={() => setLightbox(null)}
              aria-label="Đóng"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="lightbox-stage">
          {showMedia && primaryView.kind === 'iframe' ? (
            <div className="lightbox-canvas lightbox-canvas-iframe">
              <iframe
                className="lightbox-iframe"
                src={primaryView.src}
                title={lightbox.title}
                allow="autoplay"
                allowFullScreen
              />
            </div>
          ) : showMedia && primaryView.kind === 'image' ? (
            <div
              className="lightbox-canvas lightbox-canvas-image"
              style={{ transform: `scale(${zoom})` }}
            >
              <img
                className="lightbox-img"
                src={primaryView.src}
                alt={lightbox.title}
                onError={() => setMediaError(true)}
              />
            </div>
          ) : (
            <div
              className="lightbox-canvas"
              style={{
                transform: `scale(${zoom})`,
                background: `linear-gradient(160deg, ${lightbox.color || '#0B3A5C'} 0%, #061a2e 100%)`,
              }}
            >
              <div className="lightbox-content">
                <span className="info-thumb-badge">
                  AZTAX INFOGRAPHIC · {lightbox.year || 2026}
                </span>
                <h2>{lightbox.title}</h2>
                <div className="lightbox-tags">
                  {(lightbox.tags || []).map((t) => (
                    <span key={t} className="chip chip-light">
                      {t}
                    </span>
                  ))}
                </div>
                <p className="lightbox-empty-msg">
                  {primaryView && mediaError
                    ? 'Không tải được nội dung xem trước. Với Google Drive hãy bật “Anyone with the link”, hoặc dán link /preview hoặc /view.'
                    : 'Chưa có detailed_view_url. Hỗ trợ: link Google Drive (preview) hoặc URL ảnh trực tiếp.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
