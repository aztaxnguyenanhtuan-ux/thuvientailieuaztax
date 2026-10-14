import { canonicalCategory, FEATURED_LIMIT } from '../data/constants'
import {
  isJwtError,
  isSupabaseConfigured,
  publicSupabase,
  supabase,
} from '../lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
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
  'preview_3pages_url',
  'view_preview_url',
  'direct_download_url',
  'downloads_count',
  'last_downloaded_at',
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
 * Tự động chuyển đổi relative path từ Supabase Storage
 * thành Public URL hoàn chỉnh.
 */
export function resolveSupabaseStorageUrl(rawUrl: string, defaultBucket = 'documents'): string {
  if (!rawUrl || rawUrl === '#') return ''
  const s = rawUrl.trim()
  if (!s || s === '#') return ''

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

  // Chỉ dùng 3 trường: preview_3pages_url, view_preview_url, direct_download_url
  const rawPreview3Pages = asString(
    pick(row, 'preview_3pages_url', 'preview_3_pages_url', 'preview_3pages', 'preview_3_pages'),
    '',
  )
  const rawPreview = asString(
    pick(row, 'view_preview_url', 'preview_url', 'preview_path', 'preview'),
    '',
  )
  const rawDownload = asString(
    pick(row, 'direct_download_url', 'download_url', 'file_url', 'url'),
    '',
  )

  const resolvedPreview3Pages = rawPreview3Pages ? resolveSupabaseStorageUrl(rawPreview3Pages, 'documents') : ''
  const resolvedPreview = rawPreview ? resolveSupabaseStorageUrl(rawPreview, 'documents') : ''
  const resolvedDownload = rawDownload ? resolveSupabaseStorageUrl(rawDownload, 'documents') : ''

  return {
    id: id || `doc-${Math.random().toString(36).slice(2, 9)}`,
    type,
    category,
    tags: badgeTags,
    title,
    description: asString(pick(row, 'description', 'desc', 'summary', 'mo_ta')),
    thumbnail_url: asString(pick(row, 'thumbnail_url', 'thumbnail', 'image_url')),
    icon: asString(pick(row, 'icon', 'icon_name'), 'file-text'),
    preview_3pages_url: resolvedPreview3Pages || undefined,
    view_preview_url: resolvedPreview,
    direct_download_url: resolvedDownload,
    year,
    featured,
    popular,
    priority,
    downloads_count: asNumber(pick(row, 'downloads_count', 'download_count', 'downloads'), 0),
    last_downloaded_at: (() => {
      const v = pick(row, 'last_downloaded_at', 'lastDownloadedAt')
      return v == null || v === '' ? null : String(v)
    })(),
    created_at: (() => {
      const v = pick(row, 'created_at', 'createdAt')
      return v == null || v === '' ? null : String(v)
    })(),
  }
}

/**
 * Tăng lượt tải của tài liệu và cập nhật ngay vào bộ nhớ đệm
 */
export async function incrementDocumentDownloadCount(
  docId: string,
  currentCount = 0,
): Promise<number> {
  const newCount = currentCount + 1
  const nowIso = new Date().toISOString()

  if (documentsCache) {
    const cachedDoc = documentsCache.find((d) => d.id === docId)
    if (cachedDoc) {
      cachedDoc.downloads_count = (cachedDoc.downloads_count || 0) + 1
      cachedDoc.last_downloaded_at = nowIso
    }
  }

  if (!isSupabaseConfigured || !supabase) {
    return newCount
  }

  try {
    const { error: rpcError } = await supabase.rpc('increment_download_count', { doc_id: docId })
    if (rpcError) {
      const { error: updateError } = await supabase
        .from('documents')
        .update({
          downloads_count: newCount,
          last_downloaded_at: nowIso,
        })
        .eq('id', docId)

      if (updateError) {
        console.warn('[documents] Could not update downloads_count in Supabase:', updateError.message)
      }
    }
  } catch (err) {
    console.warn('[documents] Failed to increment download count:', err)
  }

  return newCount
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
 * Lấy cache documents đồng bộ (0ms) nếu còn trong thời hạn TTL.
 */
export function getCachedDocuments(): DocumentItem[] | null {
  if (documentsCache && Date.now() - cacheTimestamp < CACHE_TTL) {
    return documentsCache
  }
  return null
}

async function queryDocumentsFromClient(
  client: SupabaseClient,
): Promise<{ data: DocumentRow[] | null; error: Error | null }> {
  const first = await client
    .from('documents')
    .select(DOCUMENT_SELECT_WITH_PRIORITY)
    .order('featured', { ascending: false })
    .order('popular', { ascending: false })
    .order('year', { ascending: false })

  if (!first.error) {
    return { data: (first.data as unknown as DocumentRow[]) || [], error: null }
  }

  if (/priority/i.test(first.error.message)) {
    if (import.meta.env.DEV) {
      console.info('[documents] Cột priority chưa có — fetch không kèm priority')
    }
    const second = await client
      .from('documents')
      .select(DOCUMENT_SELECT)
      .order('featured', { ascending: false })
      .order('popular', { ascending: false })
      .order('year', { ascending: false })

    if (!second.error) {
      return { data: (second.data as unknown as DocumentRow[]) || [], error: null }
    }
    return { data: null, error: new Error(second.error.message) }
  }

  return { data: null, error: new Error(first.error.message) }
}

/**
 * Lấy danh sách tài liệu chỉ từ Supabase `documents`.
 * Có bộ nhớ đệm (memory cache) giúp tải tức thì (0ms) khi chuyển trang.
 * Tự động fallback sang public client nếu user session gặp lỗi JWT clock skew ("JWT issued at future").
 */
export async function fetchDocuments(forceRefresh = false): Promise<DocumentItem[]> {
  if (!forceRefresh && documentsCache && Date.now() - cacheTimestamp < CACHE_TTL) {
    return documentsCache
  }

  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase chưa được cấu hình. Không thể tải tài liệu.')
  }

  let res = await queryDocumentsFromClient(supabase)

  // Nếu gặp lỗi JWT (ví dụ "JWT issued at future" do clock skew giữa Auth và PostgREST hoặc máy người dùng):
  // Tự động fallback sang publicSupabase (chỉ dùng Anon Key không đính kèm JWT session lỗi)
  if (res.error && isJwtError(res.error) && publicSupabase) {
    console.warn(
      `[documents] Phát hiện lỗi JWT/clock skew ("${res.error.message}"). Tự động fallback sang public client...`,
    )
    const fallbackRes = await queryDocumentsFromClient(publicSupabase)
    if (!fallbackRes.error && fallbackRes.data) {
      res = fallbackRes
      // Silent refresh token ở background
      supabase.auth.refreshSession().catch(() => {})
    }
  }

  if (res.error) {
    throw new Error(`Không tải được tài liệu từ Supabase: ${res.error.message}`)
  }

  const data = res.data

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
