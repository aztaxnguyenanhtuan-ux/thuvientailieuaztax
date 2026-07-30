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
            Thư viện tài liệu Kế toán – Thuế – Pháp lý dành riêng cho doanh nghiệp FDI tại Việt Nam.
          </p>
        </div>
        <div>
          <h4>Khám phá</h4>
          <Link to="/#kho-tai-lieu">Kho tài liệu</Link>
          <Link to="/infographic">Infographic</Link>
          <Link to="/thu-vien">Thư viện của tôi</Link>
          {/* CMS chỉ hiện với admin — ẩn link công khai */}
        </div>
        <div>
          <h4>Dịch vụ</h4>
          <a
            href="https://aztax.com.vn/dich-vu-ke-toan-cho-cong-ty-fdi/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Kế Toán FDI
          </a>
          <a
            href="https://aztax.com.vn/dich-vu-thanh-lap-cong-ty-nuoc-ngoai-aztax/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Thành Lập Công Ty
          </a>
          <a
            href="https://azvlaw.vn/dich-vu-tu-van-dau-tu/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Tư vấn đầu tư
          </a>
          <a
            href="https://azvlaw.vn/dich-vu-lam-giay-phep-lao-dong/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Giấy phép lao động
          </a>
          <a
            href="https://azvlaw.vn/dich-vu-lam-the-tam-tru/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Thẻ Tạm Trú
          </a>
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
            <a href={CONTACT.phoneHref}>{CONTACT.hotline}</a>
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
