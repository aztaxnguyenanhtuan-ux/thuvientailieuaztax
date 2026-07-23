import { useState, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import DocumentCard from '../components/DocumentCard'
import { getCategoryLabel, canonicalCategory } from '../data/constants'
import { useApp } from '../context/AppContext'
import { useDocuments } from '../hooks/useData'
import {
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  Download,
  Eye,
} from '../components/icons'
import { DocIcon } from '../components/icons'

export default function DocumentDetail() {
  const { id } = useParams()
  const { documents, loading } = useDocuments()
  const { savedIds, toggleSave, requestDownload, user, setAuthModal } = useApp()
  const [iframeLoading, setIframeLoading] = useState(true)
  const doc = useMemo(
    () => documents.find((d) => d.id === id),
    [documents, id],
  )

  const isBieuMauCategory = useMemo(() => {
    if (!doc?.category) return false
    const cat = canonicalCategory(doc.category).toLowerCase()
    return (
      cat.includes('biểu mẫu') ||
      cat.includes('bieu-mau') ||
      cat.includes('bieu mau') ||
      cat.includes('form')
    )
  }, [doc])

  const isGated = !user && !isBieuMauCategory

  const related = useMemo(() => {
    if (!doc) return []
    return documents
      .filter((d) => d.category === doc.category && d.id !== doc.id)
      .slice(0, 3)
  }, [documents, doc])

  const preview = useMemo(() => {
    if (!doc?.view_preview_url || doc.view_preview_url === '#') return null
    let raw = doc.view_preview_url.trim()
    if (raw.includes('drive.google.com/file/d/')) {
      raw = raw.replace(/\/view(\?.*)?$/, '/preview')
    }
    if (isGated && raw.toLowerCase().includes('.pdf') && !raw.includes('#')) {
      raw = `${raw}#toolbar=0&navpanes=0&scrollbar=0`
    }
    return raw
  }, [doc, isGated])

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

            <div className="detail-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => requestDownload(doc)}
              >
                <Download size={16} /> Tải xuống nhanh
              </button>
              <button
                type="button"
                className={`btn btn-outline ${saved ? 'active-save' : ''}`}
                onClick={() => toggleSave(doc.id)}
              >
                {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                {saved ? 'Đã lưu' : 'Lưu vào thư viện'}
              </button>
            </div>

            <section className="preview-section">
              <h2>
                <Eye size={20} /> Xem thử tài liệu
              </h2>
              {preview ? (
                <div className={`preview-card-container ${isGated ? 'gated' : ''}`}>
                  <div className={`preview-viewport ${isGated ? 'gated-viewport' : 'full-viewport'}`}>
                    {iframeLoading && (
                      <div className="iframe-loader">
                        <div className="spinner" />
                        <span>Đang tải xem thử tài liệu...</span>
                      </div>
                    )}

                    {isGated ? (
                      <div className="gated-content-wrapper">
                        <div className="gated-iframe-box">
                          <iframe
                            title={`Xem thử ${doc.title}`}
                            src={preview}
                            className="preview-frame gated-iframe"
                            loading="lazy"
                            scrolling="no"
                            onLoad={() => setIframeLoading(false)}
                          />
                        </div>
                        <div className="preview-locked-card">
                          <div className="lock-icon">🔒</div>
                          <h3>Đã xem hết 3/10 trang xem thử</h3>
                          <p>
                            Đăng nhập hoặc đăng ký tài khoản AZTAX miễn phí để xem tiếp 7 trang còn lại và tải file gốc.
                          </p>
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => setAuthModal('login')}
                          >
                            Đăng nhập để xem tiếp & Tải xuống
                          </button>
                        </div>
                      </div>
                    ) : (
                      <iframe
                        title={`Xem thử ${doc.title}`}
                        src={preview}
                        className="preview-frame full-iframe"
                        loading="lazy"
                        onLoad={() => setIframeLoading(false)}
                      />
                    )}
                  </div>

                  <div className="preview-gate-bar">
                    <div className="preview-gate-info">
                      <span className="preview-gate-pages">
                        Bản xem thử: {!isGated ? 'Đầy đủ' : '3/10 trang'}
                      </span>
                      {isGated && (
                        <span className="preview-gate-remaining">
                          Còn 7 trang. Đăng nhập / đăng ký để xem và tải file đầy đủ.
                        </span>
                      )}
                      {!user && isBieuMauCategory && (
                        <span className="preview-gate-remaining" style={{ color: '#004aad' }}>
                          Bạn đang xem bản đầy đủ. Đăng nhập để tải file biểu mẫu gốc.
                        </span>
                      )}
                    </div>
                    {!user ? (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm preview-login-btn"
                        onClick={() => setAuthModal('login')}
                      >
                        Đăng nhập để tải xuống
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => requestDownload(doc)}
                      >
                        <Download size={15} /> Tải xuống ngay
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="preview-placeholder">
                  <DocIcon name={doc.icon} size={48} />
                  <h3>{doc.title}</h3>
                  <p>
                    Bản xem thử đang được cập nhật. Bạn vẫn có thể tải xuống
                    nhanh sau khi điền form (hoặc đăng nhập).
                  </p>
                  <ul>
                    <li>Định dạng: {doc.type}</li>
                    <li>Năm cập nhật: {doc.year}</li>
                    <li>Nhóm: {categoryLabel}</li>
                  </ul>
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
