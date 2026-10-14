import { useCallback, useEffect, useState } from 'react'
import { fetchDocuments, getCachedDocuments } from '../services/documents'
import type { DocumentItem } from '../types/document'

export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentItem[]>(() => getCachedDocuments() || [])
  const [loading, setLoading] = useState<boolean>(() => !getCachedDocuments())
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async (force = false) => {
    // Chỉ bật spinner nếu chưa có tài liệu nào hiển thị
    setDocuments((current) => {
      if (current.length === 0) {
        setLoading(true)
      }
      return current
    })
    try {
      const data = await fetchDocuments(force)
      setDocuments(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi tải tài liệu')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { documents, loading, error, reload }
}
