import { useState } from 'react'
import { ChevronDown, ChevronRight, FileText, ShieldCheck, Scale, HelpCircle } from 'lucide-react'

const FAQ_LIST = [
  {
    q: 'Doanh nghiệp FDI tại Việt Nam bắt buộc áp dụng chế độ kế toán nào?',
    a: 'Doanh nghiệp FDI tại Việt Nam bắt buộc phải áp dụng Chế độ Kế toán Doanh nghiệp Việt Nam (VAS) theo Thông tư 200/2014/TT-BTC (hoặc Thông tư 133/2016/TT-BTC nếu là doanh nghiệp nhỏ và vừa). Báo cáo tài chính nộp cho cơ quan quản lý nhà nước phải sử dụng đơn vị tiền tệ là Đồng Việt Nam (VND) và được lập bằng tiếng Việt.',
  },
  {
    q: 'Doanh nghiệp FDI có bắt buộc phải kiểm toán báo cáo tài chính hàng năm không?',
    a: 'Có. Căn cứ theo Luật Kiểm toán độc lập số 67/2011/QH12, 100% doanh nghiệp có vốn đầu tư nước ngoài (FDI) bắt buộc phải kiểm toán báo cáo tài chính hàng năm bởi tổ chức kiểm toán độc lập được cấp phép tại Việt Nam trước khi nộp cho cơ quan Thuế, Thống kê và cơ quan cấp phép đầu tư.',
  },
  {
    q: 'Các mốc báo cáo định kỳ quan trọng nhất mà kế toán FDI cần ghi nhớ là gì?',
    a: 'Kế toán FDI cần hoàn thành: Báo cáo tình hình thực hiện dự án đầu tư trực tuyến hàng quý trên hệ thống fdi.gov.vn; Báo cáo tình hình vay và trả nợ nước ngoài (hàng quý với Ngân hàng Nhà nước); Báo cáo lao động người nước ngoài; và Quyết toán thuế TNDN, TNCN cùng Báo cáo tài chính kiểm toán chậm nhất vào ngày cuối cùng của tháng thứ 3 kể từ ngày kết thúc năm tài chính.',
  },
  {
    q: 'Tài khoản vốn đầu tư trực tiếp (DICA) có vai trò gì trong kế toán FDI?',
    a: 'Mọi giao dịch thu/chi liên quan đến vốn góp, chuyển nhượng vốn, vay và trả nợ nước ngoài, cũng như chuyển lợi nhuận hợp pháp ra nước ngoài của doanh nghiệp FDI bắt buộc phải thực hiện thông qua Tài khoản vốn đầu tư trực tiếp (DICA) mở tại một ngân hàng được phép tại Việt Nam theo Thông tư 06/2019/TT-NHNN.',
  },
  {
    q: 'Tải các biểu mẫu, tài liệu kế toán FDI tại AZTAX có mất phí không?',
    a: 'Toàn bộ tài liệu, biểu mẫu, cẩm nang và checklist kế toán FDI tại Thư viện AZTAX đều được chia sẻ miễn phí 100% nhằm hỗ trợ cộng đồng doanh nghiệp FDI và các chuyên viên kế toán tại Việt Nam.',
  },
]

export default function SeoFdiSection() {
  const [openFaq, setOpenFaq] = useState(0)

  const toggleFaq = (index) => {
    setOpenFaq((prev) => (prev === index ? -1 : index))
  }

  const scrollToFilter = () => {
    document.getElementById('kho-tai-lieu')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  return (
    <section className="section seo-fdi-section" id="kien-thuc-fdi">
      <div className="container">
        {/* Phần 1: Nội dung tổng quan chuẩn SEO */}
        <div className="section-head text-center">
          <span className="eyebrow">Cẩm nang chuyên sâu</span>
          <h2>Tổng quan về tài liệu kế toán FDI tại Việt Nam</h2>
          <p className="section-subtitle">
            Hệ thống kiến thức, biểu mẫu và quy định kế toán thuế đặc thù dành riêng cho các doanh nghiệp có vốn đầu tư nước ngoài.
          </p>
        </div>

        <div className="seo-pillars-grid">
          <article className="seo-pillar-card">
            <div className="seo-pillar-icon">
              <Scale size={24} />
            </div>
            <h3>Chuẩn mực kế toán & Báo cáo kiểm toán</h3>
            <p>
              Doanh nghiệp FDI tại Việt Nam vận hành dưới sự điều chỉnh của Luật Kế toán và Chế độ Kế toán Doanh nghiệp (Thông tư 200/2014/TT-BTC). Điểm bắt buộc mang tính pháp lý là <strong>100% doanh nghiệp FDI phải kiểm toán BCTC hàng năm</strong> độc lập trước khi nộp cho cơ quan Thuế và Ban Quản lý Khu công nghiệp/Sở KH&ĐT.
            </p>
          </article>

          <article className="seo-pillar-card">
            <div className="seo-pillar-icon">
              <ShieldCheck size={24} />
            </div>
            <h3>Quản lý dòng vốn & Báo cáo Ngân hàng Nhà nước</h3>
            <p>
              Kế toán FDI cần quản lý chặt chẽ <strong>Tài khoản vốn đầu tư trực tiếp (DICA)</strong> theo Thông tư 06/2019/TT-NHNN. Các khoản vay nước ngoài trung và dài hạn phải đăng ký với Ngân hàng Nhà nước Việt Nam (SBV) và thực hiện chế độ báo cáo quý đầy đủ để bảo toàn tính hợp pháp khi chuyển vốn và lợi nhuận.
            </p>
          </article>

          <article className="seo-pillar-card">
            <div className="seo-pillar-icon">
              <FileText size={24} />
            </div>
            <h3>Giao dịch liên kết & Hồ sơ chống chuyển giá</h3>
            <p>
              Đối với công ty mẹ - con xuyên biên giới, kế toán phải tuân thủ nghiêm ngặt <strong>Nghị định 132/2020/NĐ-CP</strong> về quản lý thuế đối với giao dịch liên kết. Việc chuẩn bị Hồ sơ quốc gia (Local file), Hồ sơ toàn cầu (Master file) và kiểm soát trần chi phí lãi vay (EBITDA 30%) là chìa khóa tránh bị ấn định thuế.
            </p>
          </article>

          <article className="seo-pillar-card">
            <div className="seo-pillar-icon">
              <HelpCircle size={24} />
            </div>
            <h3>Thuế nhà thầu nước ngoài (FCT) & Thuế TNCN Expat</h3>
            <p>
              Các hợp đồng cung cấp dịch vụ, phần mềm, bản quyền từ nước ngoài vào Việt Nam đều chịu thuế Nhà thầu (Thông tư 103/2014/TT-BTC). Ngoài ra, chính sách thuế TNCN đối với chuyên gia nước ngoài (cư trú và không cư trú) đòi hỏi kế toán phải nắm chắc các Hiệp định tránh đánh thuế hai lần (DTA).
            </p>
          </article>
        </div>

        {/* Phần 2: Khối FAQ câu hỏi thường gặp */}
        <div className="seo-faq-wrapper">
          <div className="section-head text-center" style={{ marginTop: '3.5rem' }}>
            <span className="eyebrow">Giải đáp thắc mắc</span>
            <h2>Câu hỏi thường gặp về tài liệu kế toán FDI (FAQ)</h2>
            <p>Các câu hỏi phổ biến nhất từ Giám đốc tài chính (CFO) và Kế toán trưởng doanh nghiệp FDI.</p>
          </div>

          <div className="faq-accordion" role="region" aria-label="FAQ Tài liệu kế toán FDI">
            {FAQ_LIST.map((item, idx) => {
              const isOpen = openFaq === idx
              return (
                <div key={idx} className={`faq-item ${isOpen ? 'active' : ''}`}>
                  <button
                    type="button"
                    className="faq-question"
                    onClick={() => toggleFaq(idx)}
                    aria-expanded={isOpen}
                  >
                    <span>{item.q}</span>
                    <span className="faq-toggle-icon">
                      {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="faq-answer">
                      <p>{item.a}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="seo-cta-box">
            <div className="seo-cta-text">
              <strong>Bạn cần tìm kiếm biểu mẫu hoặc tài liệu kế toán FDI cụ thể?</strong>
              <p>Khám phá kho hơn 50+ checklist, biểu mẫu và cẩm nang thực chiến được cập nhật liên tục.</p>
            </div>
            <button type="button" className="btn btn-primary" onClick={scrollToFilter}>
              Xem kho tài liệu FDI ngay
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
