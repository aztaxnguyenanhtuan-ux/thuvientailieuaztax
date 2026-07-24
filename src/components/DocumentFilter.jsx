import { useMemo, useState } from 'react'
import {
  CATEGORIES,
  DOC_TYPES,
  PAGE_SIZE,
  YEARS,
  matchesCategory,
} from '../data/constants'
import DocumentCard from './DocumentCard'

export default function DocumentFilter({ documents, initialCategory = 'all' }) {
  const [category, setCategory] = useState(initialCategory)
  const [type, setType] = useState('all')
  const [year, setYear] = useState('all')
  const [visible, setVisible] = useState(PAGE_SIZE)

  const filtered = useMemo(() => {
    return documents.filter((d) => {
      if (!matchesCategory(d.category, category)) return false
      if (type !== 'all' && String(d.type).trim() !== type) return false
      if (year !== 'all' && String(d.year) !== year) return false
      return true
    })
  }, [documents, category, type, year])

  const shown = filtered.slice(0, visible)
  const hasMore = visible < filtered.length

  const changeCategory = (id) => {
    if (id === category) return
    setCategory(id)
    setVisible(PAGE_SIZE)
  }

  return (
    <section className="section" id="kho-tai-lieu">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Kho tài liệu</span>
          <h2>Chọn nhóm tài liệu phù hợp với bạn</h2>
          <p>
            Mỗi nhóm được biên soạn chuyên biệt theo từng tình huống doanh nghiệp FDI thực tế.
          </p>
        </div>

        <div className="filter-tabs" role="tablist">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={category === c.id}
              className={`filter-tab ${category === c.id ? 'active' : ''}`}
              onClick={() => changeCategory(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="filter-bar">
          <label>
            Loại tài liệu
            <select value={type} onChange={(e) => { setType(e.target.value); setVisible(PAGE_SIZE) }}>
              {DOC_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Năm
            <select value={year} onChange={(e) => { setYear(e.target.value); setVisible(PAGE_SIZE) }}>
              {YEARS.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.label}
                </option>
              ))}
            </select>
          </label>
          <span className="filter-count">
            {filtered.length} tài liệu
          </span>
        </div>

        <div className="doc-grid" key={`${category}-${type}-${year}`}>
          {shown.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} />
          ))}
        </div>

        {shown.length === 0 && (
          <div className="empty-state">
            <p>
              {documents.length === 0
                ? 'Chưa có tài liệu nào'
                : 'Không có tài liệu khớp bộ lọc. Thử đổi nhóm hoặc năm.'}
            </p>
          </div>
        )}

        {hasMore && (
          <div className="load-more-wrap">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setVisible((v) => v + PAGE_SIZE)}
            >
              Xem tất cả · Tải thêm ({filtered.length - visible} còn lại)
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
