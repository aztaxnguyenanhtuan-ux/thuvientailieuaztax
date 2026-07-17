-- Bảng lưu lead từ form tải tài liệu / tư vấn
-- Chạy trên Supabase SQL Editor nếu chưa có public.leads

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null default '',
  email text not null default '',
  phone text default '',
  position text default '',
  company text default '',
  need text default '',
  document_id text default '',
  document_title text default '',
  source text default '',
  submitted_at timestamptz not null default now()
);

create index if not exists leads_email_idx on public.leads (email);
create index if not exists leads_submitted_at_idx on public.leads (submitted_at desc);

alter table public.leads enable row level security;

-- Ai cũng insert được (form public, không bắt login)
drop policy if exists "leads_public_insert" on public.leads;
create policy "leads_public_insert" on public.leads
  for insert
  with check (true);

-- Chỉ admin đọc được danh sách lead (role trong profiles)
drop policy if exists "leads_admin_select" on public.leads;
create policy "leads_admin_select" on public.leads
  for select
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );

comment on table public.leads is
  'Lead từ form tải tài liệu (source=download-modal) và form tư vấn (consultation-cta).';
