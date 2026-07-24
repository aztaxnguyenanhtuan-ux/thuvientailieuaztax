import { useCallback, useEffect, useState } from 'react'
import { fetchDocuments } from '../services/documents'
import type { DocumentItem } from '../types/document'

export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchDocuments()
      setDocuments(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi tải tài liệu')
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { documents, loading, error, reload }
}
