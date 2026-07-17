import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import DocumentCard from '../components/DocumentCard'
import { useApp } from '../context/AppContext'
import { useDocuments } from '../hooks/useData'

export default function MyLibrary() {
  const { user, savedIds, setAuthModal } = useApp()
  const { documents, loading } = useDocuments()

  const savedDocs = useMemo(
    () => documents.filter((d) => savedIds.includes(d.id)),
    [documents, savedIds],
  )

  if (!user) {
    return (
      <div className="container page-empty">
        <h1>Thư viện của tôi</h1>
        <p>Đăng nhập để xem và quản lý tài liệu đã lưu.</p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setAuthModal('login')}
        >
          Đăng nhập / Đăng ký
        </button>
      </div>
    )
  }

  return (
    <div className="library-page">
      <div className="container">
        <div className="section-head left">
          <span className="eyebrow">My Library</span>
          <h1>Tài liệu đã lưu</h1>
          <p>
            Xin chào <strong>{user.fullName}</strong> — {savedDocs.length} tài
            liệu trong thư viện.
          </p>
        </div>

        {loading ? (
          <div className="page-loading">
            <div className="spinner" />
          </div>
        ) : savedDocs.length === 0 ? (
          <div className="empty-state">
            <p>Chưa có tài liệu nào. Hãy nhấn biểu tượng bookmark trên card.</p>
            <Link to="/#kho-tai-lieu" className="btn btn-primary">
              Khám phá kho tài liệu
            </Link>
          </div>
        ) : (
          <div className="doc-grid">
            {savedDocs.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
