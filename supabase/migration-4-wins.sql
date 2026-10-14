-- Migration 4: wins feed, certificate, Discord role tracking, streak reminder log
alter table public.profiles add column if not exists certified_at timestamptz;
alter table public.profiles add column if not exists discord_role_granted boolean not null default false;
alter table public.profiles add column if not exists last_streak_reminder date;

-- wins feed: approved achievements with who earned them (readable by every signed-in student)
drop view if exists public.wins;
create view public.wins as
select s.id, s.profile_id, p.name, p.photo_url, p.city, a.key as achievement_key, a.title, a.points, a.category, coalesce(s.reviewed_at, s.created_at) as won_at
from public.submissions s join public.profiles p on p.id = s.profile_id join public.achievements a on a.key = s.achievement_key
where s.status = 'approved' and p.active;

-- streak helper used by the daily job: days with activity per student
create or replace function public.streak_days()
returns table (profile_id uuid, email text, name text, discord text, last_day date, streak int)
language sql stable security definer set search_path = public as $$
  with d as (select profile_id, day from public.activity_days),
  ranked as (select profile_id, day, day - (row_number() over (partition by profile_id order by day))::int * interval '1 day' as grp from d),
  runs as (select profile_id, max(day) as last_day, count(*)::int as len from ranked group by profile_id, grp)
  select p.id, p.email, p.name, p.discord, r.last_day, r.len
  from public.profiles p join runs r on r.profile_id = p.id
  where p.role = 'student' and p.active and r.last_day >= current_date - 1
    and r.len = (select max(len) from runs r2 where r2.profile_id = p.id and r2.last_day >= current_date - 1);
$$;
