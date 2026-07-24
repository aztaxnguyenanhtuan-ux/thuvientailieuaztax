# AZTAX — Thư viện tài liệu FDI

Nền tảng thư viện tài liệu kế toán – thuế – pháp lý dành cho doanh nghiệp FDI tại Việt Nam. Chuyển đổi từ landing page tĩnh `tailieu.aztax.com.vn` sang ứng dụng động (React + Vite + Supabase).

## Tính năng

- **Sticky header** + Live Search tài liệu + Đăng nhập / Đăng ký + Thư viện đã lưu
- **Trang chủ động**: Hero counter-up, lọc tài liệu theo nhóm / loại / năm (không reload)
- **Card tài liệu**: Chi tiết & Xem thử · Tải xuống nhanh · Bookmark
- **Modal lead generation**: họ tên, email công ty, chức vụ, công ty, SĐT → link tải trực tiếp
- **User account** (Supabase Auth): email công ty, tải không cần form lặp, My Library
- **Infographic gallery**: thumbnail + lightbox (zoom / tải / in)
- **Form tư vấn** CTA cuối trang → bảng `leads`
- **CMS** tại `/admin` → upsert Supabase + cache local

## Chạy dự án

```bash
npm install
# .env đã có:
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...
npm run dev
```

Build:

```bash
npm run build
npm run preview
```

## Supabase setup (bắt buộc 1 lần)

1. Mở **Supabase Dashboard → SQL Editor**
2. Chạy `supabase/schema.sql` (bảng + RLS + trigger profile)
3. Chạy `supabase/seed.sql` (36 documents + 12 infographics)
4. **Authentication → Providers → Email**: bật Email  
   (Dev: tắt *Confirm email* nếu muốn login ngay sau đăng ký)

### Bảng

| Bảng | Mục đích |
|------|----------|
| `documents` | Kho tài liệu |
| `infographics` | Gallery |
| `leads` | Form tải + tư vấn |
| `profiles` | Hồ sơ user |
| `saved_documents` | My Library |

App **fallback** sang `public/data/*.json` + localStorage nếu env thiếu hoặc bảng trống.

## CMS

- `/admin` (nên đăng nhập) → chỉnh JSON → **Lưu** (upsert Supabase)
- Hoặc sửa trực tiếp Table Editor
- Hoặc file: `public/data/documents.json`, `public/data/infographics.json`

## Routes

| Path | Mô tả |
|------|--------|
| `/` | Trang chủ |
| `/tai-lieu/:id` | Chi tiết + xem thử |
| `/infographic` | Gallery infographic |
| `/thu-vien` | My Library |
| `/admin` | CMS |

## Tech stack

- React 19 + Vite 8
- Supabase (`@supabase/supabase-js`)
- React Router DOM · Lucide icons
- CSS brand: `#004AAD` / `#FF7A00` / white

## Ghi chú

- `.env` đã được gitignore — không commit key
- Email confirmation / SMTP cấu hình trong Supabase nếu production
- Tài liệu URL `#` hiển thị “Coming soon”
