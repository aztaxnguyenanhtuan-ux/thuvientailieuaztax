import { canonicalInfoCategory } from '../data/constants'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

export type InfographicItem = {
  id: string
  title: string
  thumbnail_url: string
  detailed_view_url: string
  direct_download_url: string
  tags: string[]
  category: string
  year: number
  color: string
}

const INFO_SELECT = [
  'id',
  'title',
  'thumbnail_url',
  'detailed_view_url',
  'direct_download_url',
  'tags',
  'category',
  'year',
  'color',
].join(', ')

/** URL dùng được (không rỗng, không placeholder `#`). */
export function isUsableUrl(url: unknown): url is string {
  if (url == null) return false
  const s = String(url).trim()
  return s.length > 0 && s !== '#'
}

/**
 * Lấy file id từ các dạng link Google Drive phổ biến:
 * - /file/d/FILE_ID/preview|view|edit
 * - open?id=FILE_ID
 * - uc?id=FILE_ID | uc?export=download&id=FILE_ID
 * - thumbnail?id=FILE_ID
 */
export function extractDriveFileId(url: string): string | null {
  if (!url) return null
  const s = url.trim()
  const patterns = [
    /drive\.google\.com\/file\/d\/([^/?>&#]+)/i,
    /drive\.google\.com\/open\?[^#]*[?&]id=([^&#]+)/i,
    /drive\.google\.com\/uc\?[^#]*[?&]id=([^&#]+)/i,
    /drive\.google\.com\/thumbnail\?[^#]*[?&]id=([^&#]+)/i,
    /docs\.google\.com\/[^/]+\/d\/([^/?>&#]+)/i,
  ]
  for (const re of patterns) {
    const m = s.match(re)
    if (m?.[1]) return decodeURIComponent(m[1])
  }
  return null
}

export function isGoogleDriveUrl(url: string): boolean {
  return /(?:drive|docs)\.google\.com/i.test(url)
}

/** Link xem trong lightbox (iframe). */
export function toDrivePreviewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`
}

/** Ảnh thumbnail (dùng cho card / fallback img). */
export function toDriveThumbnailUrl(fileId: string, width = 1600): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${width}`
}

/** Link tải trực tiếp (export). */
export function toDriveDownloadUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}`
}

export type MediaView =
  | { kind: 'iframe'; src: string }
  | { kind: 'image'; src: string }
  | null

/**
 * Chuẩn hóa URL xem trước:
 * - Google Drive → iframe /preview (không nhét vào <img>)
 * - Ảnh thường (jpg/png/webp/...) → <img>
 */
export function resolveMediaView(url: unknown): MediaView {
  if (!isUsableUrl(url)) return null
  const raw = url.trim()

  const driveId = extractDriveFileId(raw)
  if (driveId) {
    return { kind: 'iframe', src: toDrivePreviewUrl(driveId) }
  }

  // Drive URL lạ vẫn thử iframe nếu là domain drive
  if (isGoogleDriveUrl(raw)) {
    return { kind: 'iframe', src: raw }
  }

  return { kind: 'image', src: raw }
}

/**
 * Chuẩn hóa 1 URL thành src dùng được trong thẻ <img> (card).
 * Drive → thumbnail API; URL ảnh thường → giữ nguyên; Drive lạ → null.
 */
export function resolveThumbnailSrc(url: unknown): string | null {
  if (!isUsableUrl(url)) return null
  const raw = url.trim()
  const driveId = extractDriveFileId(raw)
  if (driveId) return toDriveThumbnailUrl(driveId, 800)
  if (isGoogleDriveUrl(raw)) return null
  return raw
}

/**
 * Ảnh cho Infographic card — thứ tự ưu tiên rõ ràng:
 * 1. thumbnail_url (nếu có)
 * 2. detailed_view_url (fallback khi thiếu thumbnail)
 * 3. null → UI dùng gradient + title
 *
 * Trả về danh sách candidate (không trùng) để component thử lần lượt khi onError.
 */
export function resolveCardImageCandidates(item: {
  thumbnail_url?: string | null
  detailed_view_url?: string | null
}): string[] {
  const candidates: string[] = []
  const push = (src: string | null) => {
    if (src && !candidates.includes(src)) candidates.push(src)
  }

  push(resolveThumbnailSrc(item.thumbnail_url))
  push(resolveThumbnailSrc(item.detailed_view_url))

  // Drive: thêm biến thể lh3 (đôi khi ổn định hơn thumbnail API)
  const driveFromThumb = isUsableUrl(item.thumbnail_url)
    ? extractDriveFileId(item.thumbnail_url)
    : null
  const driveFromDetail = isUsableUrl(item.detailed_view_url)
    ? extractDriveFileId(item.detailed_view_url)
    : null
  for (const id of [driveFromThumb, driveFromDetail]) {
    if (id) push(`https://lh3.googleusercontent.com/d/${id}=w800`)
  }

  return candidates
}

/** Src ảnh card đầu tiên, hoặc null nếu không có gì để hiển thị. */
export function resolveCardImageSrc(item: {
  thumbnail_url?: string | null
  detailed_view_url?: string | null
}): string | null {
  return resolveCardImageCandidates(item)[0] ?? null
}

/** Chuẩn hóa link tải: Drive view/preview → export download. */
export function resolveDownloadUrl(url: unknown): string | null {
  if (!isUsableUrl(url)) return null
  const raw = url.trim()
  const driveId = extractDriveFileId(raw)
  if (driveId) return toDriveDownloadUrl(driveId)
  return raw
}

export function normalizeInfographic(row: Record<string, unknown>): InfographicItem {
  const tagsRaw = row.tags
  let tags: string[] = []
  if (Array.isArray(tagsRaw)) {
    tags = tagsRaw.map((t) => String(t).trim()).filter(Boolean)
  } else if (typeof tagsRaw === 'string' && tagsRaw.trim()) {
    try {
      const parsed = JSON.parse(tagsRaw)
      if (Array.isArray(parsed)) {
        tags = parsed.map((t) => String(t).trim()).filter(Boolean)
      } else {
        tags = tagsRaw.split(/[,;]/).map((t) => t.trim()).filter(Boolean)
      }
    } catch {
      tags = tagsRaw.split(/[,;]/).map((t) => t.trim()).filter(Boolean)
    }
  }

  const yearNum = Number(row.year)
  const rawCategory = String(row.category ?? '').trim()
  const category = canonicalInfoCategory(rawCategory) || rawCategory

  return {
    id: String(row.id ?? ''),
    title: String(row.title ?? 'Không có tiêu đề').trim() || 'Không có tiêu đề',
    thumbnail_url: String(row.thumbnail_url ?? '').trim(),
    detailed_view_url: String(row.detailed_view_url ?? '').trim(),
    direct_download_url: String(row.direct_download_url ?? '#').trim() || '#',
    tags,
    category,
    year: Number.isFinite(yearNum) ? yearNum : new Date().getFullYear(),
    color: String(row.color ?? '#004AAD').trim() || '#004AAD',
  }
}

/**
 * Lấy danh sách infographic chỉ từ Supabase.
 * Không dùng JSON local / CMS override.
 * Bảng trống → mảng rỗng.
 */
export async function fetchInfographics(): Promise<InfographicItem[]> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase chưa được cấu hình. Không thể tải infographic.')
  }

  const { data, error } = await supabase
    .from('infographics')
    .select(INFO_SELECT)
    .order('year', { ascending: false })
    .order('title', { ascending: true })

  if (error) {
    console.error('[infographics] Supabase error:', error.message, error)
    throw new Error(`Không tải được infographic từ Supabase: ${error.message}`)
  }

  if (!data || data.length === 0) {
    if (import.meta.env.DEV) {
      console.info('[infographics] Bảng infographics trống')
    }
    return []
  }

  if (import.meta.env.DEV) {
    console.info(`[infographics] loaded ${data.length} rows from Supabase`)
  }

  return (data as Record<string, unknown>[]).map(normalizeInfographic)
}
