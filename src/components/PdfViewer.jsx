import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Lock,
  RefreshCw,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from './icons'

// Cấu hình CDN worker cho pdfjs-dist khớp phiên bản runtime
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

/**
 * Chuẩn hóa URL xem thử Google Drive / Google Docs về dạng /preview
 */
export function formatGooglePreviewUrl(rawUrl = '') {
  let url = String(rawUrl).trim()
  if (!url || url === '#') return '#'

  // 1. Google Drive File: https://drive.google.com/file/d/ID/view -> /preview
  if (url.includes('drive.google.com/file/d/')) {
    return url.replace(/\/view(\?.*)?$/, '/preview').replace(/\/edit(\?.*)?$/, '/preview')
  }

  // 2. Google Docs Document: https://docs.google.com/document/d/ID/edit -> /preview
  if (url.includes('docs.google.com/document/d/')) {
    return url.replace(/\/edit(\?.*)?$/, '/preview').replace(/\/view(\?.*)?$/, '/preview')
  }

  // 3. Google Sheets: https://docs.google.com/spreadsheets/d/ID/edit -> /preview
  if (url.includes('docs.google.com/spreadsheets/d/')) {
    return url.replace(/\/edit(\?.*)?$/, '/preview').replace(/\/view(\?.*)?$/, '/preview')
  }

  return url
}

/**
 * Component PdfViewer nâng cấp:
 * - Tự động phân loại 3 định dạng tài liệu & nguồn link:
 *   1. Link Google Docs / Google Drive ➜ Chuyển thành link /preview và nhúng iframe Google Docs Viewer xem full.
 *   2. File Word/Excel trực tiếp (.doc, .docx, .xls, .xlsx) ➜ Nhúng Microsoft Office Online Viewer xem full.
 *   3. File PDF (.pdf) ➜ Render bằng react-pdf (3 trang khi chưa đăng nhập, full trang + toolbar khi đã đăng nhập).
 * - Phân quyền Tải xuống:
 *   + Chưa đăng nhập: Cho xem FULL online qua iframe, ẩn/khóa nút tải xuống, hiện thông báo "Đăng nhập để tải file gốc".
 *   + Đã đăng nhập: Cho vừa xem FULL vừa tải file gốc về máy.
 */
export default function PdfViewer({
  file,
  title = 'Tài liệu',
  docType = 'PDF',
  isGated = true,
  onOpenAuth,
  onDownload,
}) {
  const [numPages, setNumPages] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [scale, setScale] = useState(1.0)
  const [containerWidth, setContainerWidth] = useState(700)
  const [loadError, setLoadError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [progress, setProgress] = useState(0)
  const [timedOut, setTimedOut] = useState(false)
  const [retryKey, setRetryKey] = useState(0)
  const containerRef = useRef(null)

  // 1. Phân loại link Google Docs / Drive
  const isGoogleLink = useMemo(() => {
    if (typeof file !== 'string') return false
    return file.includes('docs.google.com') || file.includes('drive.google.com')
  }, [file])

  const formattedGoogleUrl = useMemo(() => {
    if (!isGoogleLink) return ''
    return formatGooglePreviewUrl(file)
  }, [isGoogleLink, file])

  // 2. Phân loại tệp Word/Excel trực tiếp (Supabase Storage)
  const isDirectOfficeFile = useMemo(() => {
    if (isGoogleLink) return false
    const typeStr = String(docType || '').toUpperCase().trim()
    const urlStr = String(file || '').toLowerCase().split('?')[0]

    // Nếu URL kết thúc bằng .pdf ➜ Chắc chắn là PDF
    if (urlStr.endsWith('.pdf')) return false

    if (['DOC', 'DOCX', 'WORD', 'XLS', 'XLSX', 'EXCEL'].includes(typeStr)) {
      return true
    }

    return (
      /\.(docx?|xlsx?|docm|xlsm)$/i.test(urlStr) ||
      urlStr.includes('.doc') ||
      urlStr.includes('.docx') ||
      urlStr.includes('.xls') ||
      urlStr.includes('.xlsx')
    )
  }, [isGoogleLink, docType, file])

  // Log URL ra console dễ kiểm tra đường dẫn
  useEffect(() => {
    if (file) {
      console.log(
        `[AZTAX Viewer] URL (${isGoogleLink ? 'Google' : isDirectOfficeFile ? 'Office' : 'PDF'}):`,
        file,
      )
    }
  }, [file, retryKey, isGoogleLink, isDirectOfficeFile])

  // Cấu hình cMapUrl & Font cho react-pdf
  const pdfOptions = useMemo(
    () => ({
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
      cMapPacked: true,
      standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
    }),
    [],
  )

  // Tự động đo chiều rộng container
  const updateWidth = useCallback(() => {
    if (containerRef.current) {
      const width = containerRef.current.clientWidth
      if (width > 0) {
        setContainerWidth(Math.min(width - 16, 760))
      }
    }
  }, [])

  useEffect(() => {
    updateWidth()
    const observer = new ResizeObserver(() => updateWidth())
    if (containerRef.current) {
      observer.observe(containerRef.current)
    }
    window.addEventListener('resize', updateWidth)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateWidth)
    }
  }, [updateWidth])

  // Timeout 12 giây cho PDF
  useEffect(() => {
    setNumPages(null)
    setCurrentPage(1)
    setScale(1.0)
    setLoadError(false)
    setErrorMessage('')
    setProgress(0)
    setTimedOut(false)

    if (!file || isGoogleLink || isDirectOfficeFile) return

    const timer = setTimeout(() => {
      setTimedOut(true)
    }, 12000)

    return () => clearTimeout(timer)
  }, [file, retryKey, isGoogleLink, isDirectOfficeFile])

  const handleRetry = () => {
    setRetryKey((k) => k + 1)
  }

  const onDocumentLoadSuccess = ({ numPages: total }) => {
    setNumPages(total)
    setCurrentPage(1)
    setLoadError(false)
    setTimedOut(false)
    setProgress(100)
  }

  const onDocumentLoadError = (err) => {
    console.error('[AZTAX PdfViewer] Lỗi nạp PDF:', err)
    setLoadError(true)
    setErrorMessage(err?.message || 'Không thể nạp dữ liệu file PDF này.')
  }

  const onDocumentLoadProgress = ({ loaded, total }) => {
    if (total > 0) {
      const pct = Math.round((loaded / total) * 100)
      setProgress(pct)
    }
  }

  const gatedMaxPages = numPages ? Math.min(3, numPages) : 3

  // ==========================================
  // TRƯỜNG HỢP 1: TÀI LIỆU GOOGLE DOCS / DRIVE LINK (isGoogleLink = true)
  // ==========================================
  if (isGoogleLink) {
    return (
      <div className="pdf-viewer-root" ref={containerRef}>
        <div className="office-viewer-wrapper">
          <div className="office-header-bar">
            <span className="chip doc-category-chip" style={{ background: '#eaf2fb', color: '#004aad' }}>
              Google Docs / Drive
            </span>
            <span className="office-header-title">{title}</span>
          </div>

          <div className="office-iframe-box">
            <iframe
              title={`Xem thử Google ${title}`}
              src={formattedGoogleUrl}
              className="office-iframe"
              loading="lazy"
              allow="autoplay"
            />
          </div>

          {/* Thanh phân quyền bên dưới khung xem */}
          {isGated ? (
            <div className="office-gated-bar">
              <div className="office-gated-text">
                <Lock size={18} />
                <span>
                  Bạn đang xem bản đầy đủ online. <strong>Đăng nhập hoặc đăng ký</strong> để tải file gốc về máy.
                </span>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onOpenAuth?.('login')}
              >
                Đăng nhập để tải file gốc
              </button>
            </div>
          ) : (
            onDownload && (
              <div className="office-download-bar">
                <span>Bạn đang xem bản đầy đủ. Bạn có thể tải file gốc về máy để chỉnh sửa.</span>
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

  // ==========================================
  // TRƯỜNG HỢP 2: FILE WORD / EXCEL TRỰC TIẾP TRÊN SUPABASE STORAGE (isDirectOfficeFile = true)
  // ==========================================
  if (isDirectOfficeFile) {
    const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
      file || '',
    )}`

    return (
      <div className="pdf-viewer-root" ref={containerRef}>
        <div className="office-viewer-wrapper">
          <div className="office-header-bar">
            <span className="chip doc-category-chip" style={{ background: '#eaf2fb', color: '#004aad' }}>
              Biểu mẫu {docType || 'WORD / EXCEL'}
            </span>
            <span className="office-header-title">{title}</span>
          </div>

          <div className="office-iframe-box">
            <iframe
              title={`Xem full MS Office ${title}`}
              src={officeViewerUrl}
              className="office-iframe"
              loading="lazy"
            />
          </div>

          {isGated ? (
            <div className="office-gated-bar">
              <div className="office-gated-text">
                <Lock size={18} />
                <span>
                  Bạn đang xem bản đầy đủ online. <strong>Đăng nhập hoặc đăng ký</strong> tài khoản miễn phí để tải file biểu mẫu gốc (.docx/.xlsx) về máy.
                </span>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onOpenAuth?.('login')}
              >
                Đăng nhập để tải file gốc
              </button>
            </div>
          ) : (
            onDownload && (
              <div className="office-download-bar">
                <span>Bạn có thể tải file biểu mẫu gốc về máy để chỉnh sửa trực tiếp.</span>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={onDownload}
                >
                  <Download size={16} /> Tải file biểu mẫu gốc ({docType || 'DOCX'})
                </button>
              </div>
            )
          )}
        </div>
      </div>
    )
  }

  // ==========================================
  // TRƯỜNG HỢP 3: FILE PDF (isGoogleLink = false, isDirectOfficeFile = false)
  // ==========================================
  return (
    <div className="pdf-viewer-root" ref={containerRef}>
      {/* PDF Toolbar (Thanh công cụ khi ĐÃ ĐĂNG NHẬP) */}
      {!isGated && numPages && numPages > 0 && (
        <div className="pdf-toolbar">
          <div className="pdf-toolbar-group">
            <button
              type="button"
              className="pdf-btn"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              title="Trang trước"
              aria-label="Trang trước"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="pdf-page-indicator">
              Trang <strong>{currentPage}</strong> / {numPages}
            </span>
            <button
              type="button"
              className="pdf-btn"
              onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
              disabled={currentPage >= numPages}
              title="Trang sau"
              aria-label="Trang sau"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="pdf-toolbar-group">
            <button
              type="button"
              className="pdf-btn"
              onClick={() => setScale((s) => Math.max(0.6, s - 0.15))}
              title="Thu nhỏ"
              aria-label="Thu nhỏ"
            >
              <ZoomOut size={16} />
            </button>
            <span className="pdf-zoom-level">{Math.round(scale * 100)}%</span>
            <button
              type="button"
              className="pdf-btn"
              onClick={() => setScale((s) => Math.min(2.0, s + 0.15))}
              title="Phóng to"
              aria-label="Phóng to"
            >
              <ZoomIn size={16} />
            </button>
            {scale !== 1.0 && (
              <button
                type="button"
                className="pdf-btn"
                onClick={() => setScale(1.0)}
                title="Vừa màn hình"
                aria-label="Vừa màn hình"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Hiển thị Nội dung PDF bằng react-pdf */}
      <div className="pdf-document-wrapper">
        {loadError || (timedOut && !numPages) ? (
          <div className="pdf-error-box">
            <div className="pdf-error-icon" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
              ⚠️
            </div>
            <h3>
              {timedOut ? 'Tài liệu đang tải chậm' : 'Không thể nạp trực tiếp PDF'}
            </h3>
            <p>
              {timedOut
                ? 'Kết nối mạng hoặc máy chủ lưu trữ phản hồi chậm hơn dự kiến.'
                : errorMessage || 'Đường dẫn file bị hỏng hoặc không có quyền truy cập.'}
            </p>
            <div className="pdf-error-actions" style={{ display: 'flex', gap: '0.65rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleRetry}
              >
                <RefreshCw size={15} /> Thử lại
              </button>
              {onDownload && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={onDownload}
                >
                  <Download size={15} /> Tải file PDF về máy
                </button>
              )}
            </div>
          </div>
        ) : (
          <Document
            key={`pdf-${file}-${retryKey}`}
            file={file}
            options={pdfOptions}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            onLoadProgress={onDocumentLoadProgress}
            loading={
              <div className="iframe-loader">
                <div className="spinner" />
                <span>
                  Đang tải xem thử tài liệu
                  {progress > 0 && progress < 100 ? ` (${progress}%)` : ''}...
                </span>
              </div>
            }
            error={null}
          >
            {/* CHẾ ĐỘ CHƯA ĐĂNG NHẬP ➜ RENDER 3 TRANG ĐẦU + OVERLAY KHÓA */}
            {isGated && (
              <div className="pdf-gated-stack">
                {Array.from({ length: gatedMaxPages }, (_, index) => (
                  <div key={`gated-page-${index + 1}`} className="pdf-page-item">
                    <Page
                      pageNumber={index + 1}
                      width={containerWidth}
                      scale={scale}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                    <span className="pdf-page-badge">Trang {index + 1}</span>
                  </div>
                ))}

                <div className="preview-locked-card">
                  <div className="lock-icon">
                    <Lock size={32} />
                  </div>
                  <h3>
                    Đã xem hết {gatedMaxPages}/{numPages || 10} trang xem thử
                  </h3>
                  <p>
                    Đăng nhập hoặc đăng ký tài khoản AZTAX miễn phí để xem tiếp các
                    trang còn lại và tải file gốc đầy đủ.
                  </p>
                  <button
                    type="button"
                    className="btn btn-secondary btn-lg"
                    onClick={() => onOpenAuth?.('login')}
                  >
                    Đăng nhập để xem tiếp & Tải xuống
                  </button>
                </div>
              </div>
            )}

            {/* CHẾ ĐỘ ĐÃ ĐĂNG NHẬP ➜ RENDER TRANG HIỆN TẠI (KÈM THANH ĐIỀU HƯỚNG) */}
            {!isGated && numPages && (
              <div className="pdf-single-page-wrap">
                <div className="pdf-page-item">
                  <Page
                    pageNumber={currentPage}
                    width={containerWidth}
                    scale={scale}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                </div>
              </div>
            )}
          </Document>
        )}
      </div>
    </div>
  )
}
