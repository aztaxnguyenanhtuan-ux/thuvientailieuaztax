import { useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import DocumentCard from '../components/DocumentCard'
import PdfViewer from '../components/PdfViewer'
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
  const { savedIds, toggleSave, requestDownload, user, setAuthModal } = useApp()

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

  const preview = useMemo(() => {
    if (!doc) return null

    if (user) {
      // ĐÃ ĐĂNG NHẬP ➜ Ưu tiên lấy bản FULL (view_preview_url)
      if (doc.view_preview_url && doc.view_preview_url !== '#') {
        return doc.view_preview_url.trim()
      }
      if (doc.preview_3pages_url && doc.preview_3pages_url !== '#') {
        return doc.preview_3pages_url.trim()
      }
    } else {
      // CHƯA ĐĂNG NHẬP ➜ Ưu tiên lấy bản 3 TRANG (preview_3pages_url)
      if (doc.preview_3pages_url && doc.preview_3pages_url !== '#') {
        return doc.preview_3pages_url.trim()
      }
      if (doc.view_preview_url && doc.view_preview_url !== '#') {
        return doc.view_preview_url.trim()
      }
    }

    if (doc.storage_path && doc.storage_path !== '#') {
      return doc.storage_path.trim()
    }
    if (doc.direct_download_url && doc.direct_download_url !== '#') {
      return doc.direct_download_url.trim()
    }
    return null
  }, [doc, user])

  // Console.log debug thông tin đường dẫn xem thử khi người dùng truy cập trang chi tiết
  useEffect(() => {
    if (doc) {
      console.log('--------------------------------------------------')
      console.log('[DEBUG DocumentDetail] ID:', doc.id)
      console.log('[DEBUG DocumentDetail] Status:', user ? 'ĐÃ ĐĂNG NHẬP (User logged in)' : 'CHƯA ĐĂNG NHẬP (Guest)')
      console.log('[DEBUG DocumentDetail] doc.preview_3pages_url (3 trang):', doc.preview_3pages_url)
      console.log('[DEBUG DocumentDetail] doc.view_preview_url (Full):', doc.view_preview_url)
      console.log('[DEBUG DocumentDetail] doc.direct_download_url:', doc.direct_download_url)
      console.log('[DEBUG DocumentDetail] Final Selected Preview URL:', preview)
      console.log('--------------------------------------------------')
    }
  }, [doc, user, preview])

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
              {!user ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setAuthModal('login')}
                >
                  <LogIn size={16} /> Đăng nhập để tải xuống
                </button>
              ) : (
                <>
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
                </>
              )}
            </div>

            <section className="preview-section">
              <h2>
                <Eye size={20} /> Xem thử tài liệu
              </h2>
              {preview ? (
                <div className={`preview-card-container ${isGated ? 'gated' : ''}`}>
                  <PdfViewer
                    file={preview}
                    title={doc.title}
                    docType={doc.type}
                    isGated={isGated}
                    onOpenAuth={setAuthModal}
                    onDownload={user ? () => requestDownload(doc) : null}
                  />
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
