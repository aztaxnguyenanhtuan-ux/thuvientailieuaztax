import { useMemo, useRef } from 'react'
import {
  Download,
  ExternalLink,
  Lock,
} from './icons'

/**
 * Chuẩn hóa URL xem thử Google Drive / Google Docs / Sheets / Slides về dạng /preview
 */
export function formatGooglePreviewUrl(rawUrl = '') {
  let url = String(rawUrl).trim()
  if (!url || url === '#' || url === 'undefined') {
    return ''
  }

  if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
    // 1. Chuyển đổi các link chứa query param id=ID (dạng /open?id=ID hay /uc?id=ID)
    if (url.includes('id=')) {
      const match = url.match(/id=([a-zA-Z0-9_-]+)/)
      if (match && match[1]) {
        return `https://drive.google.com/file/d/${match[1]}/preview`
      }
    }

    // 2. Chuyển /edit, /view hoặc tham số query ở cuối thành /preview
    url = url.replace(/\/(edit|view)(\?.*)?$/, '/preview')

    // 3. Đảm bảo các link chứa ID file/doc có đuôi /preview
    if (url.includes('/file/d/') && !url.includes('/preview')) {
      url = url.replace(/(\/file\/d\/[^/?#]+)(\/.*)?$/, '$1/preview')
    } else if (url.includes('/document/d/') && !url.includes('/preview')) {
      url = url.replace(/(\/document\/d\/[^/?#]+)(\/.*)?$/, '$1/preview')
    } else if (url.includes('/spreadsheets/d/') && !url.includes('/preview')) {
      url = url.replace(/(\/spreadsheets\/d\/[^/?#]+)(\/.*)?$/, '$1/preview')
    } else if (url.includes('/presentation/d/') && !url.includes('/preview')) {
      url = url.replace(/(\/presentation\/d\/[^/?#]+)(\/.*)?$/, '$1/preview')
    }
    return url
  }

  // Nếu là URL HTTP/HTTPS trực tiếp khác -> Nhúng qua Google Docs Viewer iframe
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`
  }

  return url
}

/**
 * Component PdfViewer nhúng Google Viewer qua Iframe:
 * - Tự động chuyển link về dạng /preview
 * - Ẩn nút mở tab mới khi chưa đăng nhập (isGated = true)
 * - Hiển thị bản 3 trang (chưa đăng nhập) hoặc bản đầy đủ (đã đăng nhập)
 * - Hiển thị thông báo lỗi lịch sự nếu URL không khả dụng
 */
export default function PdfViewer({
  file,
  title = 'Tài liệu',
  docType = 'Tài liệu',
  isGated = true,
  onOpenAuth,
  onDownload,
}) {
  const iframeRef = useRef(null)

  const formattedGoogleUrl = useMemo(() => {
    return formatGooglePreviewUrl(file)
  }, [file])

  if (!formattedGoogleUrl) {
    return (
      <div className="pdf-viewer-root">
        <div className="pdf-error-box" style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚠️</div>
          <h3 style={{ fontSize: '1.15rem', color: '#1e293b', marginBottom: '0.5rem', fontWeight: 600 }}>
            Tài liệu không khả dụng. Vui lòng liên hệ quản trị viên.
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Liên kết xem thử của tài liệu này hiện chưa sẵn sàng hoặc đang được cập nhật.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="pdf-viewer-root">
      <div className="office-viewer-wrapper">
        <div className="office-header-bar">
          <div className="office-header-left">
            <span
              className="chip doc-category-chip"
              style={{
                background: isGated ? '#fff7ed' : '#eaf2fb',
                color: isGated ? '#c2410c' : '#004aad',
              }}
            >
              {isGated ? 'Xem thử (3 trang)' : 'Bản đầy đủ'}
            </span>
            <span className="office-header-title" title={title}>{title}</span>
          </div>
          {/* Ẩn nút mở tab mới khi chưa đăng nhập */}
          {!isGated && formattedGoogleUrl && (
            <a
              href={formattedGoogleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="office-header-action"
              title="Mở tài liệu trong cửa sổ/tab mới"
            >
              <ExternalLink size={14} />
              <span>Xem toàn màn hình</span>
            </a>
          )}
        </div>

        <div className="office-iframe-box" style={{ position: 'relative' }}>
          <iframe
            ref={iframeRef}
            title={`Xem thử Google ${title}`}
            src={formattedGoogleUrl}
            className="office-iframe"
            loading="lazy"
            allow="autoplay; fullscreen"
            allowFullScreen
          />

          {/* Khi CHƯA ĐĂNG NHẬP: Overlay khóa 3 trang xem thử */}
          {isGated && (
            <div
              className="google-popout-overlay"
              title="Đăng nhập để xem đầy đủ"
              onClick={(e) => {
                e.stopPropagation()
                onOpenAuth?.('login')
              }}
            >
              <Lock size={13} />
              <span>Xem thử 3 trang</span>
            </div>
          )}
        </div>

        {/* Thanh bên dưới khung xem */}
        {isGated ? (
          <div className="office-gated-bar">
            <div className="office-gated-text">
              <Lock size={18} />
              <span>
                Bạn đang xem bản xem thử 3 trang. <strong>Đăng nhập hoặc đăng ký</strong> tài khoản miễn phí để xem bản đầy đủ và tải file gốc.
              </span>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onOpenAuth?.('login')}
            >
              Đăng nhập để mở bản đầy đủ
            </button>
          </div>
        ) : (
          onDownload && (
            <div className="office-download-bar">
              <span>Bạn đang xem bản đầy đủ online. Có thể tải file gốc về máy.</span>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={onDownload}
              >
                <Download size={16} /> Tải file gốc ({docType || 'Biểu mẫu'})
              </button>
            </div>
          )
        )}
      </div>
    </div>
  )
}
