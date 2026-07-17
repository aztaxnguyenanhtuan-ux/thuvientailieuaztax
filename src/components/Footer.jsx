import { Link } from 'react-router-dom'
import { CONTACT } from '../data/constants'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <div className="footer-logo-wrap">
            <img
              className="brand-logo footer-brand"
              src="https://aztax.com.vn/wp-content/uploads/2023/02/LOGO_AZ_TAX_FINAL-1-1024x512.png.webp"
              alt="AZTAX"
              width={160}
              height={80}
            />
          </div>
          <p className="footer-tagline">
            Thư viện tài liệu kế toán – thuế – pháp lý
            <br />
            dành riêng cho doanh nghiệp FDI tại Việt&nbsp;Nam.
            <br />
            Cập nhật 2026.
          </p>
        </div>
        <div>
          <h4>Khám phá</h4>
          <Link to="/#kho-tai-lieu">Kho tài liệu</Link>
          <Link to="/infographic">Infographic</Link>
          <Link to="/thu-vien">Thư viện của tôi</Link>
          {/* CMS chỉ hiện với admin — ẩn link công khai */}
        </div>
        <div className="footer-contact">
          <h4>Liên hệ</h4>
          <p className="footer-contact-item">
            <span className="footer-contact-label">Địa chỉ:</span>{' '}
            {CONTACT.address}
          </p>
          <p className="footer-contact-item">
            <span className="footer-contact-label">Điện thoại:</span>{' '}
            <a href={CONTACT.officePhoneHref}>{CONTACT.officePhone}</a>
          </p>
          <p className="footer-contact-item">
            <span className="footer-contact-label">Hotline:</span>{' '}
            <a href={CONTACT.phoneHref}>{CONTACT.phone}</a>
          </p>
          <p className="footer-contact-item">
            <span className="footer-contact-label">Email:</span>{' '}
            <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
          </p>
          <p className="footer-contact-item">
            <span className="footer-contact-label">Giờ làm việc:</span>{' '}
            {CONTACT.hours}
          </p>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">
          Copyright © 2026 {CONTACT.company}. All Rights Reserved.
        </div>
      </div>
    </footer>
  )
}
