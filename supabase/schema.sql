-- ============================================================
-- AZTAX Thư viện tài liệu FDI — schema Supabase
-- Chạy toàn bộ file trong: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ---------- profiles (mở rộng auth.users) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  company_name text default '',
  position text default '',
  phone text default '',
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- ---------- documents ----------
create table if not exists public.documents (
  id text primary key,
  type text not null default 'PDF',
  category text not null default 'ke-toan',
  tags text[] not null default '{}',
  title text not null,
  description text not null default '',
  thumbnail_url text default '',
  icon text default 'file-text',
  view_preview_url text default '#',
  direct_download_url text default '#',
  year int default 2026,
  featured boolean default false,
  popular boolean default false,
  -- Số nhỏ hơn = ưu tiên cao hơn trong "Tài liệu nổi bật tháng này"
  priority integer not null default 100,
  created_at date default current_date
);

-- ---------- infographics ----------
create table if not exists public.infographics (
  id text primary key,
  title text not null,
  thumbnail_url text default '',
  detailed_view_url text default '',
  direct_download_url text default '#',
  tags text[] not null default '{}',
  category text default 'thue',
  year int default 2026,
  color text default '#004AAD'
);

-- ---------- leads (form tải / tư vấn) ----------
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

-- ---------- saved library ----------
create table if not exists public.saved_documents (
  user_id uuid not null references auth.users (id) on delete cascade,
  document_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, document_id)
);

-- ---------- indexes ----------
create index if not exists documents_category_idx on public.documents (category);
create index if not exists documents_year_idx on public.documents (year);
create index if not exists infographics_category_idx on public.infographics (category);
create index if not exists leads_email_idx on public.leads (email);
create index if not exists saved_documents_user_idx on public.saved_documents (user_id);

-- ---------- auto profile on signup ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, company_name, position, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.email, ''),
    coalesce(
      new.raw_user_meta_data->>'company_name',
      new.raw_user_meta_data->>'company',
      ''
    ),
    coalesce(new.raw_user_meta_data->>'position', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    'user'
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    email = excluded.email,
    company_name = excluded.company_name,
    position = excluded.position,
    phone = excluded.phone;
    -- role không cập nhật từ signup (tránh leo thang quyền)
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.infographics enable row level security;
alter table public.leads enable row level security;
alter table public.saved_documents enable row level security;

-- Profiles: user sees/edits own
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- Documents / Infographics: public read (anon + authenticated)
drop policy if exists "documents_public_read" on public.documents;
create policy "documents_public_read" on public.documents
  for select using (true);

drop policy if exists "infographics_public_read" on public.infographics;
create policy "infographics_public_read" on public.infographics
  for select using (true);

-- CMS writes: chỉ admin (profiles.role = 'admin')
drop policy if exists "documents_auth_write" on public.documents;
drop policy if exists "documents_admin_write" on public.documents;
create policy "documents_admin_write" on public.documents
  for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "infographics_auth_write" on public.infographics;
drop policy if exists "infographics_admin_write" on public.infographics;
create policy "infographics_admin_write" on public.infographics
  for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Leads: anyone can insert (lead form)
drop policy if exists "leads_public_insert" on public.leads;
create policy "leads_public_insert" on public.leads
  for insert with check (true);

-- Saved library: own rows only
drop policy if exists "saved_select_own" on public.saved_documents;
create policy "saved_select_own" on public.saved_documents
  for select using (auth.uid() = user_id);

drop policy if exists "saved_insert_own" on public.saved_documents;
create policy "saved_insert_own" on public.saved_documents
  for insert with check (auth.uid() = user_id);

drop policy if exists "saved_delete_own" on public.saved_documents;
create policy "saved_delete_own" on public.saved_documents
  for delete using (auth.uid() = user_id);
