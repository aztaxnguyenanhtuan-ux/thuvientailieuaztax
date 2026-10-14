/** Document hiển thị trên UI (đã normalize từ Supabase / JSON) */
export type DocumentItem = {
  id: string
  type: string
  category: string
  tags: string[]
  title: string
  description: string
  thumbnail_url: string
  icon?: string
  view_preview_url: string
  preview_3pages_url?: string
  direct_download_url: string
  year: number
  featured: boolean
  popular: boolean
  /**
   * Thứ tự thủ công cho featured.
   * Số nhỏ hơn = hiện trước (1, 2, 3…).
   * null = coi như 100 (mặc định DB).
   */
  priority?: number | null
  created_at?: string | null
  downloads_count?: number
  last_downloaded_at?: string | null
}

/** Row thô từ bảng public.documents (CSV import có thể lệch tên cột) */
export type DocumentRow = Record<string, unknown>
