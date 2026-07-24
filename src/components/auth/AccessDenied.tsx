import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

type AccessDeniedProps = {
  title?: string
  description?: string
  showLogin?: boolean
}

/** UI thông báo từ chối quyền — dùng chung cho route & trang CMS */
export default function AccessDenied({
  title = 'Bạn không có quyền truy cập CMS',
  description,
  showLogin = false,
}: AccessDeniedProps) {
  const { user, openLogin } = useAuth()

  return (
    <div className="container page-empty access-denied">
      <div className="access-denied-card">
        <span className="eyebrow">Phân quyền</span>
        <h1>{title}</h1>
        <p>
          {description || (
            <>
              Chỉ tài khoản có <code>role = admin</code> mới được vào trang CMS.
              {user ? (
                <>
                  {' '}
                  Role hiện tại của bạn: <strong>{user.role}</strong>.
                </>
              ) : (
                <> Bạn chưa đăng nhập.</>
              )}
            </>
          )}
        </p>
        <div className="access-denied-actions">
          {showLogin && (
            <button type="button" className="btn btn-primary" onClick={openLogin}>
              Đăng nhập
            </button>
          )}
          <Link to="/" className={showLogin ? 'btn btn-outline' : 'btn btn-primary'}>
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  )
}
