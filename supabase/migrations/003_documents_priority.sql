-- Manual sort for "Tài liệu nổi bật tháng này"
-- Số nhỏ hơn = ưu tiên cao hơn (hiển thị trước). Mặc định 100.

alter table public.documents
  add column if not exists priority integer not null default 100;

comment on column public.documents.priority is
  'Thứ tự thủ công cho featured: số nhỏ hơn = hiện trước (1,2,3…). Mặc định 100.';

create index if not exists documents_featured_priority_idx
  on public.documents (featured, priority asc, created_at desc);
