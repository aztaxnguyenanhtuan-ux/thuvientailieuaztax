import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
// import BundleSection from '../components/BundleSection'
import ConsultationCTA from '../components/ConsultationCTA'
import DocumentFilter from '../components/DocumentFilter'
import Hero from '../components/Hero'
import InfographicGallery from '../components/InfographicGallery'
import SeoFdiSection from '../components/SeoFdiSection'
import Testimonial from '../components/Testimonial'
import { useDocuments, useInfographics } from '../hooks/useData'

export default function Home() {
  const { documents, loading: docsLoading, error: docsError } = useDocuments()
  const { infographics, loading: infoLoading, error: infoError } = useInfographics()
  const location = useLocation()

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '')
      const timer = setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
      return () => clearTimeout(timer)
    }

    // Khôi phục vị trí cuộn khi người dùng back lại từ trang chi tiết tài liệu
    const savedY = sessionStorage.getItem('aztax_home_scroll_y')
    const lastDocId = sessionStorage.getItem('aztax_last_viewed_doc_id')

    if (!docsLoading && savedY !== null) {
      const y = parseInt(savedY, 10)
      if (!Number.isNaN(y)) {
        const timer = setTimeout(() => {
          window.scrollTo({ top: y, behavior: 'instant' })

          if (lastDocId) {
            const cardEl = document.getElementById(`doc-card-${lastDocId}`)
            if (cardEl) {
              const rect = cardEl.getBoundingClientRect()
              if (rect.top < 0 || rect.bottom > window.innerHeight) {
                cardEl.scrollIntoView({ block: 'nearest', behavior: 'instant' })
              }
            }
          }
        }, 50)
        return () => clearTimeout(timer)
      }
    }
  }, [location, docsLoading])

  // Tự động ghi nhớ vị trí cuộn khi rời khỏi trang Home
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.scrollY > 0) {
        sessionStorage.setItem('aztax_home_scroll_y', String(window.scrollY))
      }
    }
  }, [])

  return (
    <>
      <Hero documents={documents} loading={docsLoading} />
      {docsLoading && (
        <div className="page-loading">
          <div className="spinner" />
        </div>
      )}
      {docsError && (
        <div className="container empty-state">
          <p className="field-error">{docsError}</p>
        </div>
      )}
      {!docsLoading && !docsError && (
        <DocumentFilter documents={documents} />
      )}
      {infoLoading && (
        <div className="page-loading">
          <div className="spinner" />
        </div>
      )}
      {infoError && (
        <div className="container empty-state">
          <p className="field-error">{infoError}</p>
        </div>
      )}
      {!infoLoading && !infoError && (
        <InfographicGallery infographics={infographics} limit={6} />
      )}
      {/* <BundleSection /> */}
      <Testimonial />
      <SeoFdiSection />
      <ConsultationCTA />
    </>
  )
}
