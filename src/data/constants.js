/**
 * Nút lọc nhóm tài liệu.
 * `id` = giá trị cột `category` trên Supabase (khớp chính xác).
 */
export const CATEGORIES = [
  { id: 'all', label: 'Tất cả', short: 'Tất cả' },
  { id: 'Pháp lý - FDI', label: 'Pháp lý - FDI', short: 'Pháp lý' },
  { id: 'Kế toán - Thuế', label: 'Kế toán - Thuế', short: 'Kế toán' },
  { id: 'Nhân sự', label: 'Nhân sự', short: 'Nhân sự' },
  { id: 'Chính sách mới', label: 'Chính sách mới', short: 'Chính sách' },
  { id: 'Biểu mẫu', label: 'Biểu mẫu', short: 'Biểu mẫu' },
  { id: 'Sai sót', label: 'Sai sót', short: 'Sai sót' },
]

/** Alias (slug cũ / biến thể) → giá trị category chuẩn trên Supabase */
const CATEGORY_ALIASES = {
  'phap-ly': 'Pháp lý - FDI',
  'pháp lý - fdi': 'Pháp lý - FDI',
  'pháp lý': 'Pháp lý - FDI',
  'ke-toan': 'Kế toán - Thuế',
  'kế toán - thuế': 'Kế toán - Thuế',
  'kế toán': 'Kế toán - Thuế',
  'nhan-su': 'Nhân sự',
  'nhân sự': 'Nhân sự',
  'chinh-sach': 'Chính sách mới',
  'chính sách mới': 'Chính sách mới',
  'chính sách': 'Chính sách mới',
  'bieu-mau': 'Biểu mẫu',
  'biểu mẫu': 'Biểu mẫu',
  'sai-sot': 'Sai sót',
  'sai sót': 'Sai sót',
}

/**
 * Chuẩn hóa category về giá trị cột Supabase (nếu nhận diện được).
 * Giữ nguyên chuỗi gốc nếu không map được.
 */
export function canonicalCategory(raw) {
  if (raw == null) return ''
  const s = String(raw).trim().replace(/\s+/g, ' ')
  if (!s) return ''
  if (s === 'all') return 'all'

  const exact = CATEGORIES.find(
    (c) => c.id !== 'all' && (c.id === s || c.label === s),
  )
  if (exact) return exact.id

  const lower = s.toLowerCase()
  if (CATEGORY_ALIASES[lower]) return CATEGORY_ALIASES[lower]

  const byLabel = CATEGORIES.find(
    (c) => c.id !== 'all' && c.label.toLowerCase() === lower,
  )
  if (byLabel) return byLabel.id

  return s
}

/** So khớp category tài liệu với id nút lọc (hỗ trợ slug cũ + label). */
export function matchesCategory(docCategory, filterId) {
  if (!filterId || filterId === 'all') return true
  return canonicalCategory(docCategory) === canonicalCategory(filterId)
}

/** Nhãn hiển thị cho category (chip, trang chi tiết). */
export function getCategoryLabel(raw) {
  const key = canonicalCategory(raw)
  if (!key || key === 'all') return (raw && String(raw).trim()) || ''
  return CATEGORIES.find((c) => c.id === key)?.label || String(raw).trim()
}

export const DOC_TYPES = [
  { id: 'all', label: 'Tất cả loại' },
  { id: 'PDF', label: 'PDF' },
  { id: 'Excel', label: 'Excel' },
  { id: 'Word', label: 'Word' },
]

export const YEARS = [
  { id: 'all', label: 'Tất cả năm' },
  { id: '2026', label: '2026' },
  { id: '2025', label: '2025' },
]

/**
 * Nút lọc Infographic.
 * `id` = giá trị cột `category` trên Supabase (khớp chính xác với label).
 */
export const INFO_CATEGORIES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'Thuế', label: 'Thuế' },
  { id: 'Lao động', label: 'Lao động' },
  { id: 'BHXH/BHYT', label: 'BHXH/BHYT' },
  { id: 'Hải quan & XNK', label: 'Hải quan & XNK' },
  { id: 'Pháp lý', label: 'Pháp lý' },
]

/** Alias slug / biến thể → giá trị category chuẩn trên Supabase */
const INFO_CATEGORY_ALIASES = {
  thue: 'Thuế',
  thuế: 'Thuế',
  'lao-dong': 'Lao động',
  'lao động': 'Lao động',
  bhxh: 'BHXH/BHYT',
  'bhxh/bhyt': 'BHXH/BHYT',
  bhyt: 'BHXH/BHYT',
  'hai-quan': 'Hải quan & XNK',
  'hải quan & xnk': 'Hải quan & XNK',
  'hải quan': 'Hải quan & XNK',
  'phap-ly': 'Pháp lý',
  'pháp lý': 'Pháp lý',
}

/** Chuẩn hóa category infographic về giá trị cột Supabase. */
export function canonicalInfoCategory(raw) {
  if (raw == null) return ''
  const s = String(raw).trim().replace(/\s+/g, ' ')
  if (!s) return ''
  if (s === 'all') return 'all'

  const exact = INFO_CATEGORIES.find(
    (c) => c.id !== 'all' && (c.id === s || c.label === s),
  )
  if (exact) return exact.id

  const lower = s.toLowerCase()
  if (INFO_CATEGORY_ALIASES[lower]) return INFO_CATEGORY_ALIASES[lower]

  const byLabel = INFO_CATEGORIES.find(
    (c) => c.id !== 'all' && c.label.toLowerCase() === lower,
  )
  if (byLabel) return byLabel.id

  return s
}

/** So khớp category infographic với id nút lọc. */
export function matchesInfoCategory(itemCategory, filterId) {
  if (!filterId || filterId === 'all') return true
  return canonicalInfoCategory(itemCategory) === canonicalInfoCategory(filterId)
}

export const POSITIONS = [
  'CEO / Founder / Chủ DN',
  'CFO / Finance Director',
  'Kế toán trưởng',
  'HR Manager',
  'Kế toán tổng hợp',
  'Kế toán viên',
  'Sinh viên/Học viên',
  'Khác',
]

export const INDUSTRIES = [
  { icon: 'factory', label: 'Doanh nghiệp sản xuất' },
  { icon: 'sparkles', label: 'Công ty mới thành lập' },
  { icon: 'shopping-cart', label: 'Công ty thương mại' },
  { icon: 'package', label: 'Doanh nghiệp chế xuất' },
  { icon: 'hard-hat', label: 'Công ty xây dựng' },
  { icon: 'cpu', label: 'Doanh nghiệp công nghệ' },
]

export const BUNDLES = [
  {
    id: 'bundle-new-fdi',
    title: 'Công ty FDI mới thành lập',
    subtitle: 'Checklist đầu việc cho năm đầu tiên',
    items: [
      'Checklist ban đầu từ A - Z',
      'Các loại thuế cần khai ngay',
      'Báo cáo bắt buộc phải nộp',
      'Hệ thống chứng từ ban đầu',
    ],
    color: '#0B3A5C',
  },
  {
    id: 'bundle-ops',
    title: 'Kế toán thuế vận hành',
    subtitle: 'Lịch kê khai + biểu mẫu + quy trình',
    items: [
      'Deadline kê khai cả năm 2026',
      'Bộ biểu mẫu đầy đủ VAT, TNDN',
      'Quy trình luân chuyển chứng từ',
      'Checklist đối soát cuối tháng',
    ],
    color: '#1A5F7A',
  },
  {
    id: 'bundle-risk',
    title: 'Sai sót và rủi ro thanh tra',
    subtitle: 'Các sai phạm phổ biến & cách khắc phục',
    items: [
      'Nhận diện sai sót truy thu thuế',
      'Khắc phục báo cáo sai',
      'Chuẩn bị hồ sơ đối phó thanh tra',
      'Mẫu công văn giải trình',
    ],
    color: '#E85D04',
  },
  {
    id: 'bundle-policy',
    title: 'Cập nhật chính sách mới',
    subtitle: 'Tổng hợp nghị định, thông tư mới',
    items: [
      'Thay đổi quyết định mới nhất',
      'Nghị định ảnh hưởng đến FDI',
      'Thuế tối thiểu toàn cầu',
      'Đăng ký nhận cập nhật hàng tháng',
    ],
    color: '#159895',
  },
]

export const CONTACT = {
  address:
    '135 Đường số 12, KDC Cityland, Phường Gò Vấp, TP.HCM',
  /** Điện thoại bàn */
  officePhone: '(+84) 28 6271 0811',
  officePhoneHref: 'tel:+842862710811',
  /** Hotline — dùng cho header / CTA gọi nhanh */
  phone: '(+84) 932 383 089',
  phoneHref: 'tel:+84932383089',
  email: 'cs@aztax.com.vn',
  hours: 'Thứ 2 - Thứ 6, 08:00 - 18:00',
  company: 'AZTAX Co., LTD',
}

export const PAGE_SIZE = 6

/** Số tài liệu tối đa trong khối "Tài liệu nổi bật tháng này" */
export const FEATURED_LIMIT = 6
