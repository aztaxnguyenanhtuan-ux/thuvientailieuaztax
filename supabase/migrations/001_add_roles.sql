-- ============================================================
-- Migration: phân quyền CMS (role trên profiles)
-- Chạy trong Supabase SQL Editor nếu project đã có schema cũ
-- ============================================================

-- Cột role, mặc định 'user'
alter table public.profiles
  add column if not exists role text not null default 'user';

-- Chỉ cho phép các role đã biết (dễ mở rộng: thêm giá trị vào check)
alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('user', 'admin'));

-- Cập nhật trigger signup: luôn gán role = 'user' (không tin metadata client)
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
    -- role KHÔNG update từ signup → tránh leo thang đặc quyền
  return new;
end;
$$;

-- Ghi documents/infographics: chỉ admin
drop policy if exists "documents_auth_write" on public.documents;
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

-- ---------- Gán admin thủ công (chạy 1 lần, đổi email) ----------
-- update public.profiles set role = 'admin' where email = 'ban@aztax.com.vn';
