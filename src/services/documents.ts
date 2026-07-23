import { canonicalCategory, FEATURED_LIMIT } from '../data/constants'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { DocumentItem, DocumentRow } from '../types/document'

/**
 * Cột lấy từ Supabase (khớp schema + CSV import).
 * `priority` optional — nếu DB chưa có cột, fetch sẽ fallback không select cột này.
 */
const DOCUMENT_COLUMNS = [
  'id',
  'title',
  'description',
  'category',
  'year',
  'type',
  'featured',
  'popular',
  'tags',
  'thumbnail_url',
  'icon',
  'view_preview_url',
  'direct_download_url',
  'storage_path',
  'created_at',
] as const

const DOCUMENT_SELECT = DOCUMENT_COLUMNS.join(', ')
const DOCUMENT_SELECT_WITH_PRIORITY = [...DOCUMENT_COLUMNS, 'priority'].join(', ')

function pick(row: DocumentRow, ...keys: string[]): unknown {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
      return row[key]
    }
  }
  return undefined
}

function asString(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) return fallback
  return String(value).trim()
}

function asNumber(value: unknown, fallback = 0): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function asBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase()
    return v === 'true' || v === '1' || v === 'yes' || v === 'x'
  }
  return false
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((t) => String(t).trim()).filter(Boolean)
  }
  if (typeof value === 'string') {
    const raw = value.trim()
    if (!raw) return []
    // JSON array string: ["Hot","New"]
    if (raw.startsWith('[')) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          return parsed.map((t) => String(t).trim()).filter(Boolean)
        }
      } catch {
        /* fall through */
      }
    }
    // Postgres array text: {Hot,New}
    if (raw.startsWith('{') && raw.endsWith('}')) {
      return raw
        .slice(1, -1)
        .split(',')
        .map((t) => t.replace(/^"|"$/g, '').trim())
        .filter(Boolean)
    }
    // Comma / semicolon separated
    return raw
      .split(/[,;|]/)
      .map((t) => t.trim())
      .filter(Boolean)
  }
  return []
}

/**
 * Tự động chuyển đổi `storage_path` hoặc relative path từ Supabase Storage
 * thành Public URL hoàn chỉnh (ví dụ: https://...supabase.co/storage/v1/object/public/documents/file.pdf).
 */
export function resolveSupabaseStorageUrl(rawUrl: string, defaultBucket = 'documents'): string {
  if (!rawUrl || rawUrl === '#') return '#'
  const s = rawUrl.trim()
  if (!s || s === '#') return '#'

  // 1. Nếu đã là URL đầy đủ (http://, https://), giữ nguyên
  if (/^https?:\/\//i.test(s)) {
    if (s.includes('drive.google.com/file/d/')) {
      return s.replace(/\/view(\?.*)?$/, '/preview')
    }
    return s
  }

  // 2. Nếu là path trong Supabase Storage
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''

  if (s.includes('storage/v1/object/public/')) {
    const cleanPath = s.replace(/^\/?/, '')
    return supabaseUrl ? `${supabaseUrl}/${cleanPath}` : s
  }

  let cleanPath = s.replace(/^\//, '')
  if (cleanPath.startsWith(`${defaultBucket}/`)) {
    cleanPath = cleanPath.substring(defaultBucket.length + 1)
  }

  if (supabase && isSupabaseConfigured) {
    const { data } = supabase.storage.from(defaultBucket).getPublicUrl(cleanPath)
    if (data?.publicUrl) return data.publicUrl
  }

  return supabaseUrl
    ? `${supabaseUrl}/storage/v1/object/public/${defaultBucket}/${cleanPath}`
    : s
}

/** Map 1 row Supabase/CSV → DocumentItem UI */
export function normalizeDocument(row: DocumentRow): DocumentItem {
  const id = asString(pick(row, 'id', 'document_id', 'slug'), '')
  const title = asString(pick(row, 'title', 'name', 'document_title'), 'Không có tiêu đề')
  // Giữ đúng cột category từ Supabase; chuẩn hóa slug/alias cũ nếu có
  const rawCategory = asString(pick(row, 'category', 'group', 'nhom'))
  const category = canonicalCategory(rawCategory) || rawCategory
  const type = asString(pick(row, 'type', 'file_type', 'format'), 'PDF')
  const year = asNumber(pick(row, 'year', 'nam'), new Date().getFullYear())
  const featured = asBoolean(pick(row, 'featured', 'is_featured', 'hot'))
  const popular = asBoolean(pick(row, 'popular', 'is_popular'))
  const tags = asStringArray(pick(row, 'tags', 'tag', 'labels'))

  // priority: null nếu không có cột / giá trị
  const priorityRaw = pick(row, 'priority', 'sort_order', 'sort_order_index')
  const priority =
    priorityRaw === undefined || priorityRaw === null || priorityRaw === ''
      ? null
      : asNumber(priorityRaw, 0)

  // Badge tự suy từ featured/popular nếu tags trống
  const badgeTags = [...tags]
  if (featured && !badgeTags.some((t) => /hot/i.test(t))) badgeTags.unshift('Hot')
  if (popular && !badgeTags.some((t) => /popular|nổi bật/i.test(t))) {
    badgeTags.push('Popular')
  }

  // Tự động nhận diện view_preview_url hoặc storage_path từ Supabase
  const rawPreview = asString(
    pick(row, 'storage_path', 'view_preview_url', 'preview_url', 'preview_path', 'preview'),
    '#',
  )
  const rawDownload = asString(
    pick(row, 'direct_download_url', 'download_url', 'file_url', 'storage_path', 'url'),
    '#',
  )

  return {
    id: id || `doc-${Math.random().toString(36).slice(2, 9)}`,
    type,
    category,
    tags: badgeTags,
    title,
    description: asString(pick(row, 'description', 'desc', 'summary', 'mo_ta')),
    thumbnail_url: asString(pick(row, 'thumbnail_url', 'thumbnail', 'image_url')),
    icon: asString(pick(row, 'icon', 'icon_name'), 'file-text'),
    view_preview_url: resolveSupabaseStorageUrl(rawPreview, 'documents'),
    direct_download_url: resolveSupabaseStorageUrl(rawDownload, 'documents'),
    year,
    featured,
    popular,
    priority,
    created_at: (() => {
      const v = pick(row, 'created_at', 'createdAt')
      return v == null || v === '' ? null : String(v)
    })(),
  }
}

function createdAtTime(value: string | null | undefined): number {
  if (!value) return 0
  const t = Date.parse(value)
  return Number.isFinite(t) ? t : 0
}

/** Mặc định khi thiếu priority (khớp DEFAULT 100 trên DB). */
export const DEFAULT_FEATURED_PRIORITY = 100

/**
 * Tài liệu nổi bật cho hero ("Tài liệu nổi bật tháng này"):
 * - chỉ `featured = true`
 * - sort: `priority` tăng dần (số nhỏ hơn = ưu tiên cao hơn)
 * - nếu priority bằng nhau: `created_at` giảm dần (mới nhất trước)
 * - tối đa `limit` (mặc định FEATURED_LIMIT = 6)
 */
export function getFeaturedDocuments(
  documents: DocumentItem[],
  limit: number = FEATURED_LIMIT,
): DocumentItem[] {
  return documents
    .filter((d) => d.featured)
    .slice()
    .sort((a, b) => {
      const pa = a.priority ?? DEFAULT_FEATURED_PRIORITY
      const pb = b.priority ?? DEFAULT_FEATURED_PRIORITY
      if (pa !== pb) return pa - pb
      return createdAtTime(b.created_at) - createdAtTime(a.created_at)
    })
    .slice(0, Math.max(0, limit))
}

let documentsCache: DocumentItem[] | null = null
let cacheTimestamp = 0
const CACHE_TTL = 300000 // 5 phút cache

export function clearDocumentsCache() {
  documentsCache = null
  cacheTimestamp = 0
}

/**
 * Lấy danh sách tài liệu chỉ từ Supabase `documents`.
 * Có bộ nhớ đệm (memory cache) giúp tải tức thì (0ms) khi chuyển trang.
 */
export async function fetchDocuments(forceRefresh = false): Promise<DocumentItem[]> {
  if (!forceRefresh && documentsCache && Date.now() - cacheTimestamp < CACHE_TTL) {
    return documentsCache
  }

  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase chưa được cấu hình. Không thể tải tài liệu.')
  }

  // Ưu tiên select kèm priority; nếu cột chưa tồn tại → fallback không có priority
  let data: DocumentRow[] | null = null
  let errorMessage: string | null = null

  {
    const first = await supabase
      .from('documents')
      .select(DOCUMENT_SELECT_WITH_PRIORITY)
      .order('featured', { ascending: false })
      .order('popular', { ascending: false })
      .order('year', { ascending: false })

    if (!first.error) {
      data = (first.data as unknown as DocumentRow[]) || []
    } else if (/priority/i.test(first.error.message)) {
      if (import.meta.env.DEV) {
        console.info(
          '[documents] Cột priority chưa có — fetch không kèm priority',
        )
      }
      const second = await supabase
        .from('documents')
        .select(DOCUMENT_SELECT)
        .order('featured', { ascending: false })
        .order('popular', { ascending: false })
        .order('year', { ascending: false })

      if (second.error) {
        errorMessage = second.error.message
        console.error('[documents] Supabase error:', second.error.message, second.error)
      } else {
        data = (second.data as unknown as DocumentRow[]) || []
      }
    } else {
      errorMessage = first.error.message
      console.error('[documents] Supabase error:', first.error.message, first.error)
    }
  }

  if (errorMessage) {
    throw new Error(`Không tải được tài liệu từ Supabase: ${errorMessage}`)
  }

  if (!data || data.length === 0) {
    if (import.meta.env.DEV) {
      console.info('[documents] Bảng documents trống')
    }
    return []
  }

  if (import.meta.env.DEV) {
    console.info(`[documents] loaded ${data.length} rows from Supabase`)
  }

  const normalized = data.map(normalizeDocument)
  documentsCache = normalized
  cacheTimestamp = Date.now()
  return normalized
}

/** Lấy 1 tài liệu theo id */
export async function fetchDocumentById(id: string): Promise<DocumentItem | null> {
  const all = await fetchDocuments()
  return all.find((d) => d.id === id) ?? null
}
