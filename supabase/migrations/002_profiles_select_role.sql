-- Đảm bảo user đọc được profiles của chính mình (kể cả cột role)
-- Chạy nếu role luôn ra 'user' dù DB đã set 'admin'

alter table public.profiles
  add column if not exists role text not null default 'user';

-- Cho phép authenticated user SELECT row của mình
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select
  using (auth.uid() = id);

-- Cho phép update thông tin cá nhân (không bắt buộc cho đọc role)
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert
  with check (auth.uid() = id);

-- Kiểm tra nhanh (thay email):
-- select id, email, role from public.profiles where email = 'ban@aztax.com.vn';
