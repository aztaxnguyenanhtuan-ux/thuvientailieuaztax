import { Component } from 'react'
import { RefreshCw } from './icons'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[AZTAX ErrorBoundary caught error]:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div
          className="container"
          style={{ padding: '3rem 1rem', textAlign: 'center' }}
        >
          <div
            style={{
              background: '#fff',
              border: '1.5px solid #d9e6f7',
              borderRadius: '16px',
              padding: '2rem 1.5rem',
              maxWidth: '480px',
              margin: '0 auto',
              boxShadow: '0 8px 24px rgba(0,74,173,0.08)',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>
              ⚠️
            </div>
            <h3
              style={{
                color: '#004aad',
                marginBottom: '0.5rem',
                fontSize: '1.15rem',
              }}
            >
              Đã xảy ra sự cố hiển thị
            </h3>
            <p
              style={{
                color: '#64748b',
                fontSize: '0.88rem',
                marginBottom: '1.25rem',
                lineHeight: '1.5',
              }}
            >
              Hệ thống vừa gặp gián đoạn tạm thời trên trình duyệt di động. Bạn
              vui lòng bấm làm mới để tiếp tục xem tài liệu.
            </p>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={this.handleReset}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                margin: '0 auto',
              }}
            >
              <RefreshCw size={15} /> Làm mới trang
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
