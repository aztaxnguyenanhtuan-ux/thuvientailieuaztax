import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import type { DocumentItem } from '../types/document'
import { Bookmark, BookmarkCheck, Download, Eye, DocIcon } from './icons'

type Props = {
  doc: DocumentItem
}

function pickBadge(doc: DocumentItem): string | null {
  if (doc.featured) return 'Hot'
  const fromTags = doc.tags?.find((t) =>
    ['Hot', 'HOT', 'New', 'Mới', 'Free', 'Popular'].includes(t),
  )
  if (fromTags) return fromTags
  if (doc.popular) return 'Popular'
  return null
}

export default function DocumentCard({ doc }: Props) {
  const { savedIds, toggleSave, requestDownload } = useApp()
  const saved = savedIds.includes(doc.id)
  const badge = pickBadge(doc)

  return (
    <article className="doc-card">
      <div className="doc-card-top">
        <div className="doc-icon-wrap">
          <DocIcon name={doc.icon} size={24} />
        </div>
        <div className="doc-card-meta">
          {badge && (
            <span
              className={`tag ${
                /hot|popular/i.test(badge)
                  ? 'tag-hot'
                  : /new|mới/i.test(badge)
                    ? 'tag-new'
                    : 'tag-free'
              }`}
            >
              {badge}
            </span>
          )}
          {doc.category && (
            <span className="chip doc-category-chip">{doc.category}</span>
          )}
          <span className="doc-type">{doc.type}</span>
          <span className="doc-year">{doc.year}</span>
        </div>
        <button
          type="button"
          className={`bookmark-btn ${saved ? 'active' : ''}`}
          onClick={() => toggleSave(doc.id)}
          title={saved ? 'Bỏ lưu' : 'Lưu tài liệu'}
          aria-label={saved ? 'Bỏ lưu' : 'Lưu tài liệu'}
        >
          {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
        </button>
      </div>

      <h3 className="doc-title">{doc.title}</h3>
      <p className="doc-desc">{doc.description}</p>

      <div className="doc-tags">
        {doc.featured && <span className="chip">Featured</span>}
        {doc.popular && <span className="chip">Popular</span>}
        {doc.tags
          ?.filter(
            (t) =>
              !['Hot', 'HOT', 'New', 'Mới', 'Free', 'Popular', 'Featured'].includes(
                t,
              ),
          )
          .slice(0, 3)
          .map((t) => (
            <span key={t} className="chip">
              {t}
            </span>
          ))}
      </div>

      <div className="doc-actions">
        <Link to={`/tai-lieu/${doc.id}`} className="btn btn-primary btn-sm doc-btn-detail">
          <Eye size={18} strokeWidth={2.25} className="doc-btn-icon" aria-hidden />
          Chi tiết & Xem thử
        </Link>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => requestDownload(doc)}
        >
          <Download size={17} strokeWidth={2.1} className="doc-btn-icon" aria-hidden />
          Tải xuống nhanh
        </button>
      </div>
    </article>
  )
}
