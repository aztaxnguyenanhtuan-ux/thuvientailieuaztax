import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import BundleSection from '../components/BundleSection'
import ConsultationCTA from '../components/ConsultationCTA'
import DocumentFilter from '../components/DocumentFilter'
import Hero from '../components/Hero'
import InfographicGallery from '../components/InfographicGallery'
import Testimonial from '../components/Testimonial'
import { useDocuments, useInfographics } from '../hooks/useData'

export default function Home() {
  const { documents, loading: docsLoading, error: docsError } = useDocuments()
  const { infographics, loading: infoLoading, error: infoError } = useInfographics()
  const location = useLocation()

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '')
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [location])

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
      <BundleSection />
      <Testimonial />
      <ConsultationCTA />
    </>
  )
}
