-- Migration 3: announcements popup
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text default '',
  link_url text default '',
  link_label text default 'Open link',
  active boolean not null default true,
  created_at timestamptz default now()
);
alter table public.announcements enable row level security;
drop policy if exists "ann read" on public.announcements;
create policy "ann read" on public.announcements for select to authenticated using (true);
drop policy if exists "ann admin write" on public.announcements;
create policy "ann admin write" on public.announcements for all to authenticated using (public.is_admin()) with check (public.is_admin());
