import { useEffect, useState } from 'react'
import { fetchInfographics, getCachedInfographics } from '../services/api'
import { useDocuments } from './useDocuments'

export { useDocuments }

export function useInfographics() {
  const [infographics, setInfographics] = useState(() => getCachedInfographics?.() || [])
  const [loading, setLoading] = useState(() => !getCachedInfographics?.())
  const [error, setError] = useState(null)

  const load = async (force = false) => {
    try {
      const data = await fetchInfographics(force)
      setInfographics(data)
      setError(null)
    } catch (e) {
      setError(e?.message || 'Lỗi tải infographic')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return { infographics, loading, error, reload: load }
}
