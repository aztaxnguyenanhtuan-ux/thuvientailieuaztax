import { useEffect, useMemo, useState } from 'react'
import { CATEGORIES, PAGE_SIZE, matchesCategory } from '../data/constants'
import DocumentCard from './DocumentCard'
import { Search, ChevronDown } from './icons'

const FILTER_STORAGE_KEY = 'aztax_doc_filter_state'

function loadSavedFilterState() {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(FILTER_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore
  }
  return null
}

export default function DocumentFilter({
  documents = [],
  initialCategory = 'all',
}) {
  const savedState = useMemo(() => loadSavedFilterState(), [])
  const [category, setCategory] = useState(() => savedState?.category || initialCategory)
  const [year, setYear] = useState(() => savedState?.year || 'all')
  const [searchQuery, setSearchQuery] = useState(() => savedState?.searchQuery || '')
  const [visible, setVisible] = useState(() =>
    typeof savedState?.visible === 'number' && savedState.visible > 0
      ? savedState.visible
      : PAGE_SIZE,
  )

  useEffect(() => {
    try {
      sessionStorage.setItem(
        FILTER_STORAGE_KEY,
        JSON.stringify({ category, year, searchQuery, visible }),
      )
    } catch {
      // ignore
    }
  }, [category, year, searchQuery, visible])

  // Dynamic year extraction from document list
  const availableYears = useMemo(() => {
    const yearsSet = new Set()
    documents.forEach((d) => {
      if (d.year) {
        yearsSet.add(String(d.year).trim())
      }
    })
    const sorted = Array.from(yearsSet).sort((a, b) => b.localeCompare(a))
    return ['all', ...sorted]
  }, [documents])

  const filtered = useMemo(() => {
    return documents.filter((d) => {
      // 1. Category filter
      if (!matchesCategory(d.category, category)) return false

      // 2. Year filter
      if (year !== 'all' && String(d.year || '').trim() !== year) return false

      // 3. Keyword search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const title = (d.title || '').toLowerCase()
        const desc = (d.description || '').toLowerCase()
        const tagsStr = Array.isArray(d.tags)
          ? d.tags.join(' ').toLowerCase()
          : ''
        if (!title.includes(q) && !desc.includes(q) && !tagsStr.includes(q)) {
          return false
        }
      }

      return true
    })
  }, [documents, category, year, searchQuery])

  const shown = filtered.slice(0, visible)
  const hasMore = visible < filtered.length

  const changeCategory = (id) => {
    if (id === category) return
    setCategory(id)
    setVisible(PAGE_SIZE)
  }

  const changeYear = (y) => {
    setYear(y)
    setVisible(PAGE_SIZE)
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setVisible(PAGE_SIZE)
  }

  return (
    <section className="section" id="kho-tai-lieu">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Kho tài liệu FDI</span>
          <h2>Danh mục tài liệu kế toán FDI theo chuyên đề</h2>
          <p>
            Biên soạn chuyên biệt theo quy định kế toán, thuế và pháp lý FDI mới
            nhất năm 2026.
          </p>
        </div>

        {/* 1. Bộ lọc chính: Nhóm tài liệu */}
        <div className="filter-tabs" role="tablist" aria-label="Nhóm tài liệu">
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

        {/* 2. Thanh bộ lọc phụ (Năm, Tìm kiếm) & Số lượng tài liệu */}
        <div className="filter-bar">
          <div className="filter-bar-controls">
            <label className="filter-select-label">
              <span>Năm:</span>
              <div className="filter-select-wrap">
                <select
                  value={year}
                  onChange={(e) => changeYear(e.target.value)}
                  className="filter-select"
                  aria-label="Chọn năm"
                >
                  <option value="all">Tất cả năm</option>
                  {availableYears
                    .filter((y) => y !== 'all')
                    .map((y) => (
                      <option key={y} value={y}>
                        Năm {y}
                      </option>
                    ))}
                </select>
                <ChevronDown size={16} className="filter-select-arrow" />
              </div>
            </label>

            <div className="filter-search-wrap">
              <Search size={16} className="filter-search-icon" />
              <input
                type="text"
                placeholder="Tìm từ khóa tài liệu..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="filter-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="filter-search-clear"
                  onClick={() => {
                    setSearchQuery('')
                    setVisible(PAGE_SIZE)
                  }}
                  aria-label="Xóa tìm kiếm"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="filter-count-badge">
            <strong>{filtered.length}</strong> tài liệu
          </div>
        </div>

        {/* 3. Danh sách tài liệu */}
        <div className="doc-grid" key={`${category}-${year}-${searchQuery}`}>
          {shown.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} />
          ))}
        </div>

        {/* Trạng thái trống */}
        {shown.length === 0 && (
          <div className="empty-state">
            <p>
              {documents.length === 0
                ? 'Chưa có tài liệu nào trong thư viện'
                : 'Không tìm thấy tài liệu phù hợp. Thử chọn lại nhóm hoặc xóa từ khóa tìm kiếm.'}
            </p>
          </div>
        )}

        {/* Nút xem thêm */}
        {hasMore && (
          <div className="load-more-wrap">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setVisible((v) => v + PAGE_SIZE)}
            >
              Xem tất cả · Tải thêm ({filtered.length - visible} tài liệu)
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
