import { Link } from 'react-router-dom'
import InfographicGallery from '../components/InfographicGallery'
import { useInfographics } from '../hooks/useData'
import { ChevronLeft } from '../components/icons'

export default function InfographicPage() {
  const { infographics, loading, error } = useInfographics()

  return (
    <div className="gallery-page">
      <div className="container">
        <Link to="/" className="back-link">
          <ChevronLeft size={16} /> Về trang chủ
        </Link>
      </div>
      {loading ? (
        <div className="page-loading">
          <div className="spinner" />
        </div>
      ) : error ? (
        <div className="container empty-state">
          <p className="field-error">{error}</p>
        </div>
      ) : (
        <InfographicGallery
          infographics={infographics}
          limit={0}
          showAllLink={false}
          title="Kho Infographic đầy đủ"
          subtitle="Thumbnail sắc nét · Click để xem lightbox độ phân giải cao, zoom & tải xuống"
        />
      )}
    </div>
  )
}
