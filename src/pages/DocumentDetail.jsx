import { useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import DocumentCard from '../components/DocumentCard'
import PdfViewer from '../components/PdfViewer'
import ErrorBoundary from '../components/ErrorBoundary'
import { getCategoryLabel } from '../data/constants'
import { useApp } from '../context/AppContext'
import { useDocuments } from '../hooks/useData'
import {
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  Download,
  Eye,
  LogIn,
} from '../components/icons'
import { DocIcon } from '../components/icons'

export default function DocumentDetail() {
  const { id } = useParams()
  const { documents, loading } = useDocuments()
  const { savedIds, toggleSave, requestDownload, user, setAuthModal, trackDownload } = useApp()

  const doc = useMemo(
    () => documents.find((d) => d.id === id),
    [documents, id],
  )

  const isGated = !user

  const related = useMemo(() => {
    if (!doc) return []
    return documents
      .filter((d) => d.category === doc.category && d.id !== doc.id)
      .slice(0, 3)
  }, [documents, doc])

  const hasDownloadUrl = useMemo(() => {
    if (!doc) return false
    return (
      typeof doc.direct_download_url === 'string' &&
      doc.direct_download_url.trim() !== '' &&
      doc.direct_download_url.trim() !== '#'
    )
  }, [doc])

  /**
   * Tính toán link preview từ 2 trường: view_preview_url & preview_3pages_url.
   * Loại bỏ hoàn toàn storage_path và các fallback cũ.
   */
  const preview = useMemo(() => {
    if (!doc) return null

    const isValidUrl = (url) =>
      typeof url === 'string' && url.trim() !== '' && url.trim() !== '#'

    if (user) {
      // 1. Khi ĐÃ ĐĂNG NHẬP:
      // a. Ưu tiên view_preview_url (bản đầy đủ)
      if (isValidUrl(doc.view_preview_url)) {
        return doc.view_preview_url.trim()
      }
      // b. Nếu không có thì dùng preview_3pages_url (bản 3 trang)
      if (isValidUrl(doc.preview_3pages_url)) {
        return doc.preview_3pages_url.trim()
      }
    } else {
      // 2. Khi CHƯA ĐĂNG NHẬP:
      // a. Ưu tiên preview_3pages_url (bản 3 trang)
      if (isValidUrl(doc.preview_3pages_url)) {
        return doc.preview_3pages_url.trim()
      }
      // b. Nếu không có thì dùng view_preview_url (bản đầy đủ)
      if (isValidUrl(doc.view_preview_url)) {
        return doc.view_preview_url.trim()
      }
    }

    return null
  }, [doc, user])

  // Tự động cuộn lên đầu trang khi chuyển tài liệu
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
      </div>
    )
  }

  if (!doc) {
    return (
      <div className="container page-empty" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '0.75rem' }}>Không tìm thấy tài liệu</h1>
        <p className="muted" style={{ marginBottom: '1.5rem' }}>
          Tài liệu này không tồn tại hoặc đã bị di chuyển.
        </p>
        <Link to="/" className="btn btn-primary">
          Về trang chủ
        </Link>
      </div>
    )
  }

  const categoryLabel = getCategoryLabel(doc.category)
  const saved = savedIds.includes(doc.id)

  return (
    <div className="detail-page">
      <div className="container">
        <Link to="/#kho-tai-lieu" className="back-link">
          <ChevronLeft size={16} /> Quay lại kho tài liệu
        </Link>

        <div className="detail-layout">
          <div className="detail-main">
            <div className="detail-hero-card">
              <div className="detail-icon">
                <DocIcon name={doc.icon} size={36} />
              </div>
              <div>
                <div className="detail-meta">
                  <span className="chip">{categoryLabel}</span>
                  <span className="doc-type">{doc.type}</span>
                  <span className="doc-year">{doc.year}</span>
                  {doc.tags?.map((t) => (
                    <span
                      key={t}
                      className={`tag ${
                        /hot/i.test(t)
                          ? 'tag-hot'
                          : /new|mới/i.test(t)
                            ? 'tag-new'
                            : 'tag-free'
                      }`}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <h1>{doc.title}</h1>
                <p className="detail-desc">{doc.description}</p>
              </div>
            </div>

            <div className="detail-actions" style={{ flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
              {!user ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setAuthModal('login')}
                >
                  <LogIn size={16} /> Đăng nhập để tải xuống
                </button>
              ) : (
                preview && hasDownloadUrl && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => requestDownload(doc)}
                  >
                    <Download size={16} /> Tải xuống nhanh
                  </button>
                )
              )}
              <button
                type="button"
                className={`btn btn-outline ${saved ? 'active-save' : ''}`}
                onClick={() => toggleSave(doc.id)}
              >
                {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                {saved ? 'Đã lưu' : 'Lưu vào thư viện'}
              </button>
              {user && (
                <div
                  className="download-count-badge"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.55rem 0.95rem',
                    background: '#eaf2fb',
                    color: '#004aad',
                    borderRadius: 'var(--radius-btn, 10px)',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                  }}
                >
                  📥 Tải xuống ({new Intl.NumberFormat('vi-VN').format(doc.downloads_count || 0)} lượt)
                </div>
              )}
            </div>

            <section className="preview-section">
              <h2>
                <Eye size={20} /> Xem thử tài liệu
              </h2>
              {preview ? (
                <div className={`preview-card-container ${isGated ? 'gated' : ''}`}>
                  <ErrorBoundary>
                    <PdfViewer
                      file={preview}
                      title={doc.title}
                      docType={doc.type}
                      isGated={isGated}
                      onOpenAuth={setAuthModal}
                      onDownload={
                        user && hasDownloadUrl
                          ? () => {
                              trackDownload(doc.id, doc.downloads_count)
                              requestDownload(doc)
                            }
                          : null
                      }
                    />
                  </ErrorBoundary>
                </div>
              ) : (
                <div
                  className="pdf-error-box"
                  style={{
                    padding: '2.5rem 1.5rem',
                    textAlign: 'center',
                    background: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚠️</div>
                  <h3 style={{ fontSize: '1.2rem', color: '#1e293b', marginBottom: '0.5rem', fontWeight: 600 }}>
                    Tài liệu không khả dụng. Vui lòng liên hệ quản trị viên.
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
                    Liên kết xem thử của tài liệu này hiện chưa sẵn sàng hoặc đang được cập nhật.
                  </p>
                </div>
              )}
            </section>
          </div>

          <aside className="detail-side">
            <div className="side-card">
              <h3>Thông tin</h3>
              <dl>
                <div>
                  <dt>Loại</dt>
                  <dd>{doc.type}</dd>
                </div>
                <div>
                  <dt>Năm</dt>
                  <dd>{doc.year}</dd>
                </div>
                <div>
                  <dt>Nhóm</dt>
                  <dd>{categoryLabel}</dd>
                </div>
                <div>
                  <dt>Tags</dt>
                  <dd>{doc.tags?.join(', ')}</dd>
                </div>
                {user && (
                  <div>
                    <dt>Lượt tải</dt>
                    <dd>📥 {new Intl.NumberFormat('vi-VN').format(doc.downloads_count || 0)} lượt</dd>
                  </div>
                )}
              </dl>
            </div>
            {related.length > 0 && (
              <div className="side-card">
                <h3>Tài liệu liên quan</h3>
                <div className="related-list">
                  {related.map((r) => (
                    <Link key={r.id} to={`/tai-lieu/${r.id}`} className="related-item">
                      <strong>{r.title}</strong>
                      <span>{r.type} · {r.year}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>

        {related.length > 0 && (
          <section className="related-grid-section">
            <h2>Cùng nhóm tài liệu</h2>
            <div className="doc-grid">
              {related.map((r) => (
                <DocumentCard key={r.id} doc={r} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
