import { useEffect, useState } from 'react'
import { fetchInfographics } from '../services/api'
import { useDocuments } from './useDocuments'

export { useDocuments }

export function useInfographics() {
  const [infographics, setInfographics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await fetchInfographics()
      setInfographics(data)
      setError(null)
    } catch (e) {
      setError(e?.message || 'Lỗi tải infographic')
      setInfographics([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return { infographics, loading, error, reload: load }
}
