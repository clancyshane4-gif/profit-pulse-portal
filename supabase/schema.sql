-- Profit Pulse AI Portal — Supabase schema
-- Run this once in the Supabase SQL editor on a fresh project.
-- Re-runnable: everything uses IF NOT EXISTS / OR REPLACE.

-- ---------- admins (bootstrap) ----------
-- Anyone who signs up with one of these emails becomes an admin automatically.
create table if not exists public.admin_emails (
  email text primary key
);
insert into public.admin_emails (email) values ('scalewdrew@gmail.com') on conflict do nothing;

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text default '',
  city text default '',
  discord text default '',
  photo_url text default '',
  q1 text default '',
  q2 text default '',
  onboarded boolean default false,
  lat double precision,
  lng double precision,
  role text not null default 'student' check (role in ('student','setter','coach','admin')),
  must_change_password boolean not null default false,
  added_by uuid,
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', ''),
    case when exists (select 1 from public.admin_emails a where lower(a.email) = lower(new.email)) then 'admin' else 'student' end
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','coach'));
$$;

-- setters, coaches and admins (can add students from the rep panel)
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','coach','setter'));
$$;

-- ---------- course content ----------
create table if not exists public.modules (
  id text primary key,
  sort int not null,
  group_key text not null check (group_key in ('core','bonus')),
  phase text not null,
  title text not null,
  description text default '',
  cover_url text default '',
  video_url text default '',      -- embed URL (Vimeo/YouTube/Bunny iframe src). Empty = not uploaded yet.
  external_url text default '',   -- fallback link (Skool) while video_url is empty
  minutes int default 5,
  points int default 3,
  resources jsonb default '[]'::jsonb,  -- [{title, url}]
  published boolean default true
);

create table if not exists public.achievements (
  key text primary key,
  sort int not null,
  title text not null,
  how text default '',
  points int not null,
  category text default 'implement' check (category in ('implement','revenue'))
);

-- ---------- student activity ----------
create table if not exists public.lesson_progress (
  profile_id uuid references public.profiles(id) on delete cascade,
  module_id text references public.modules(id) on delete cascade,
  completed_at timestamptz default now(),
  primary key (profile_id, module_id)
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  achievement_key text references public.achievements(key) on delete cascade,
  proof text default '',
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz default now(),
  unique (profile_id, achievement_key)
);

create table if not exists public.activity_days (
  profile_id uuid references public.profiles(id) on delete cascade,
  day date not null default current_date,
  points int default 0,
  primary key (profile_id, day)
);

-- ---------- settings (challenge, schedule, etc.) ----------
create table if not exists public.settings (
  key text primary key,
  value jsonb not null
);

alter table public.profiles add column if not exists lat double precision;
alter table public.profiles add column if not exists must_change_password boolean not null default false;
alter table public.profiles add column if not exists added_by uuid;
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('student','setter','coach','admin'));
alter table public.profiles add column if not exists lng double precision;

-- ---------- leaderboard view ----------
drop view if exists public.leaderboard;
create view public.leaderboard as
select
  p.id,
  p.name,
  p.city,
  p.photo_url,
  p.onboarded,
  p.lat,
  p.lng,
  coalesce(lp.pts, 0) + coalesce(sb.pts, 0) + coalesce(ad.pts, 0) as points,
  coalesce(lp.pts, 0) as course_points,
  coalesce(sb.impl, 0) as implementation_points,
  coalesce(sb.rev, 0) as revenue_points,
  coalesce(ad.pts, 0) as activity_points,
  coalesce(lp.done, 0) as lessons_done,
  coalesce(ad.days, 0) as active_days
from public.profiles p
left join (
  select l.profile_id, sum(m.points) as pts, count(*) as done
  from public.lesson_progress l join public.modules m on m.id = l.module_id
  group by l.profile_id
) lp on lp.profile_id = p.id
left join (
  select s.profile_id,
    sum(a.points) as pts,
    sum(case when a.category = 'implement' then a.points else 0 end) as impl,
    sum(case when a.category = 'revenue' then a.points else 0 end) as rev
  from public.submissions s join public.achievements a on a.key = s.achievement_key
  where s.status = 'approved'
  group by s.profile_id
) sb on sb.profile_id = p.id
left join (
  select profile_id, count(*) * 3 as pts, count(*) as days
  from public.activity_days group by profile_id
) ad on ad.profile_id = p.id
where p.active and p.role = 'student';

-- ---------- row level security ----------
alter table public.profiles enable row level security;
alter table public.modules enable row level security;
alter table public.achievements enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.submissions enable row level security;
alter table public.activity_days enable row level security;
alter table public.settings enable row level security;
alter table public.admin_emails enable row level security;

-- profiles: everyone signed in can read (leaderboard/map), you edit your own, admins edit anyone
drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles for select to authenticated using (true);
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- students can't promote themselves or re-enable a disabled account
create or replace function public.protect_profile_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    new.role := old.role;
    new.active := old.active;
    new.email := old.email;
    new.added_by := old.added_by;
    if new.must_change_password and not old.must_change_password then new.must_change_password := false; end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists protect_profile_fields on public.profiles;
create trigger protect_profile_fields before update on public.profiles
  for each row execute function public.protect_profile_fields();
drop policy if exists "profiles admin update" on public.profiles;
create policy "profiles admin update" on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- content: read for all signed in, write for admins
drop policy if exists "modules read" on public.modules;
create policy "modules read" on public.modules for select to authenticated using (true);
drop policy if exists "modules admin write" on public.modules;
create policy "modules admin write" on public.modules for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "achievements read" on public.achievements;
create policy "achievements read" on public.achievements for select to authenticated using (true);
drop policy if exists "achievements admin write" on public.achievements;
create policy "achievements admin write" on public.achievements for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "settings read" on public.settings;
create policy "settings read" on public.settings for select to authenticated using (true);
drop policy if exists "settings admin write" on public.settings;
create policy "settings admin write" on public.settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin_emails admin" on public.admin_emails;
create policy "admin_emails admin" on public.admin_emails for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- progress: insert your own, read all (leaderboard), admins can delete
drop policy if exists "progress read" on public.lesson_progress;
create policy "progress read" on public.lesson_progress for select to authenticated using (true);
drop policy if exists "progress insert own" on public.lesson_progress;
create policy "progress insert own" on public.lesson_progress for insert to authenticated with check (profile_id = auth.uid());
drop policy if exists "progress admin delete" on public.lesson_progress;
create policy "progress admin delete" on public.lesson_progress for delete to authenticated using (public.is_admin());

-- submissions: see your own, admins see all; insert your own; admins update
drop policy if exists "submissions read" on public.submissions;
create policy "submissions read" on public.submissions for select to authenticated using (profile_id = auth.uid() or public.is_admin());
drop policy if exists "submissions insert own" on public.submissions;
create policy "submissions insert own" on public.submissions for insert to authenticated with check (profile_id = auth.uid());
drop policy if exists "submissions admin update" on public.submissions;
create policy "submissions admin update" on public.submissions for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "submissions admin delete" on public.submissions;
create policy "submissions admin delete" on public.submissions for delete to authenticated using (public.is_admin());

-- activity: read all, write own
drop policy if exists "activity read" on public.activity_days;
create policy "activity read" on public.activity_days for select to authenticated using (true);
drop policy if exists "activity upsert own" on public.activity_days;
create policy "activity upsert own" on public.activity_days for insert to authenticated with check (profile_id = auth.uid());
drop policy if exists "activity update own" on public.activity_days;
create policy "activity update own" on public.activity_days for update to authenticated using (profile_id = auth.uid());

-- ---------- storage: avatars ----------
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;
drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read" on storage.objects for select using (bucket_id = 'avatars');
drop policy if exists "avatars upload own" on storage.objects;
create policy "avatars upload own" on storage.objects for insert to authenticated with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatars update own" on storage.objects;
create policy "avatars update own" on storage.objects for update to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- seed: modules (from the Skool classroom) ----------
insert into public.modules (id, sort, group_key, phase, title, description, cover_url, external_url, minutes, points, resources) values
('m01', 1, 'core', 'Phase 1 · Start here', 'Watch Before Starting', 'How the bootcamp works and what to do first.', '/img/m01.jpg', 'https://www.skool.com/profit-pulse-ai-bootcamp-5273/classroom/fe8fdca8?md=2c01c311182b4c5c961e933ee09d35b5', 3, 1, '[]'),
('m00', 2, 'core', 'Phase 1 · Start here', 'Base44 Tools / Setup', 'Set up the AI tool everything in the bootcamp is built on. Your coach does this with you on the onboarding call.', '', 'https://base44.com', 8, 3, '[]'),
('m02', 3, 'core', 'Phase 2 · Offer', 'Picking The Right Niche & Offer', 'Choose a niche with money and pain, and shape an offer businesses say yes to.', '/img/m02.jpg', 'https://www.skool.com/profit-pulse-ai-bootcamp-5273/classroom/fe8fdca8?md=32db88222243456589a291e8b992d209', 9, 3, '[]'),
('m03', 4, 'core', 'Phase 3 · Build', 'Building Your Personal / Client Dashboard', 'Build a working CRM dashboard you can run your own business on and resell to clients.', '/img/m03.jpg', 'https://www.skool.com/profit-pulse-ai-bootcamp-5273/classroom/fe8fdca8?md=a28aa6a678eb4fb392ef73f50a42f716', 11, 3, '[{"title":"Custom Dashboard Prompts","url":"https://docs.google.com/document/d/1sM6t17P-yV753g7Dn5OdjJWHb_SDz_iIKBEPCHSHYOo/edit?usp=sharing"}]'),
('m04', 5, 'core', 'Phase 3 · Build', 'Creating & Selling AI Websites', 'Launch client websites with AI and package them as a service.', '/img/m04.jpg', 'https://www.skool.com/profit-pulse-ai-bootcamp-5273/classroom/fe8fdca8?md=8613752cf5e740f2afb7bdfea2104193', 10, 3, '[{"title":"Custom Website Prompts","url":"https://docs.google.com/document/d/1sM6t17P-yV753g7Dn5OdjJWHb_SDz_iIKBEPCHSHYOo/edit?usp=sharing"}]'),
('m06', 6, 'core', 'Phase 3 · Build', 'AI Super Agents', 'Deploy agents that do outreach and qualify leads while you sleep.', '/img/m06.jpg', 'https://www.skool.com/profit-pulse-ai-bootcamp-5273/classroom/fe8fdca8?md=8c3a0e89d83f48bd874866a9cc4b1e35', 6, 2, '[{"title":"Custom Agent Prompts","url":"https://docs.google.com/document/d/1RgVpwuVmlUQ9uJOP_RG2sfIGzTZrokoXvs6ilJy4Cpk/edit?usp=sharing"}]'),
('m05', 7, 'core', 'Phase 4 · Grow', 'Full AI Ad Scripting / Creatives / Set Up', 'Write, produce and launch full ad campaigns for clients using AI.', '/img/m05.jpg', 'https://www.skool.com/profit-pulse-ai-bootcamp-5273/classroom/fe8fdca8?md=4596006e603d444aa008ea4c6191608a', 9, 3, '[]'),
('m07', 8, 'core', 'Phase 4 · Grow', 'Starting Your Personal Brand', 'Become the person businesses already trust before you ever pitch.', '/img/m07.jpg', 'https://www.skool.com/profit-pulse-ai-bootcamp-5273/classroom/fe8fdca8?md=ac5db417eee4436bb5dd5dc9eff53494', 7, 2, '[]'),
('m08', 9, 'core', 'Phase 5 · Close', 'Closing Your First Deal', 'The scripts, pricing model and Stripe + GHL setup to sign and bill your first client.', '/img/m08.jpg', 'https://www.skool.com/profit-pulse-ai-bootcamp-5273/classroom/fe8fdca8?md=ac3765aa70714f6588e11fa08fb088d4', 31, 8, '[]'),
('m09', 10, 'core', 'Phase 6 · Scale', 'Time To Scale (30 Day Launch Plan)', 'A day-by-day plan to go from portfolio to paying clients in your first month.', '/img/m09.jpg', 'https://www.skool.com/profit-pulse-ai-bootcamp-5273/classroom/fe8fdca8?md=77a8d4f1b91e479085b62d9cbc8ab525', 2, 1, '[]'),
('m10', 11, 'bonus', 'Case study', 'He Went From $0-$10K In 6 Months With AI Agency', 'A student walks through his first six months.', '/img/m10.jpg', 'https://www.skool.com/profit-pulse-ai-bootcamp-5273/classroom/fe8fdca8?md=dad02376af7c4b21987acfcbfad7b431', 10, 3, '[]'),
('m11', 12, 'bonus', 'Case study', 'He Went From $0-$25K In 3 Months With AI Agency', 'A student walks through his first three months.', '/img/m11.jpg', 'https://www.skool.com/profit-pulse-ai-bootcamp-5273/classroom/fe8fdca8?md=0eb80773235e437c8c03c93f95571989', 15, 5, '[]'),
('m12', 13, 'bonus', 'Live call', 'Full Masterclass (Live Call)', 'The full live masterclass recording with Jakey.', '/img/m12.jpg', 'https://www.skool.com/profit-pulse-ai-bootcamp-5273/classroom/fe8fdca8?md=e6362683c06f4c96b00a4de45727c5cb', 37, 8, '[]')
on conflict (id) do nothing;

-- ---------- seed: achievements ----------
insert into public.achievements (key, sort, title, how, points, category) values
('niche', 1, 'Pick a niche', 'Write out your niche selection and post it in Discord.', 5, 'implement'),
('offer', 2, 'Write your offer', 'Submit your one-paragraph offer for review.', 5, 'implement'),
('dashboard', 3, 'Build your client dashboard', 'Share a screenshot or link to your working dashboard.', 10, 'implement'),
('website', 4, 'Launch an AI website', 'Link to a live site you built.', 10, 'implement'),
('agent', 5, 'Set up a super agent', 'Show your outreach or lead agent running.', 10, 'implement'),
('adaccount', 6, 'Set up an ad account', 'Meta or Google ad account created and verified.', 10, 'implement'),
('proposal', 7, 'Build a client proposal', 'Share the proposal or pitch deck.', 10, 'implement'),
('out50', 8, 'Do 50 outreaches', 'Screenshot of 50 outreach messages sent.', 10, 'implement'),
('out100', 9, 'Do 100 outreaches', 'Screenshot of 100 outreach messages sent.', 15, 'implement'),
('out200', 10, 'Do 200+ outreaches', 'Screenshot of 200+ outreach messages sent.', 25, 'implement'),
('call', 11, 'Book a sales call', 'Calendar or message proof of a booked call.', 20, 'implement'),
('client', 12, 'Sign your first client', 'Signed agreement or first invoice.', 40, 'revenue'),
('firstdollar', 13, 'First dollar earned', 'Payment confirmation.', 60, 'revenue'),
('k1', 14, 'Hit $1,000 earned', 'Stripe or invoice totals.', 100, 'revenue'),
('k5', 15, 'Hit $5,000 earned', 'Stripe or invoice totals.', 200, 'revenue'),
('k10', 16, 'Hit $10,000 earned', 'Stripe or invoice totals.', 300, 'revenue')
on conflict (key) do nothing;

-- ---------- seed: settings ----------
insert into public.settings (key, value) values
('challenge', '{"eyebrow":"Q4 Challenge","title":"Top 10 build with Jakey, live.","description":"Earn points by learning, building and getting results. The ten members with the most points at the end of Q4 get a full build day with Jakey and the coaching team.","ends_at":"2026-12-31T23:59:00-05:00","ends_label":"Challenge ends December 31, 2026 · 11:59 PM ET","prizes":[["Build day with Jakey","A full day building dashboards, sites and agents alongside Jakey."],["Private dinner","Dinner with Jakey, the coaches and the other nine."],["Client hand-off","Jakey''s team hands each winner a warm lead to pitch."]]}'),
('schedule', '[["Monday","5:00 PM ET","AI Integration · Coach Adriel","Setting up and running AI agents inside your business."],["Wednesday","7:00 PM ET","Lead Gen · Coach Adriel","Outreach, lead scraping and booking calls."],["Friday","9:00 PM ET","Media Buying · Coach Adriel","Campaigns, creatives and reading ad data."],["Saturday","2:00 PM ET","Q&A with Jake","Bring your builds, replies and stuck points."],["Weekly","Time TBD","Sales Training · Jake","Jake''s second call each week. Time posted in Discord."]]'),
('tiers', '[["Activated",50],["In Motion",150],["Builder",350],["Operator",650],["Elite",1000],["Legend",1500]]'),
('resources', '[["Base44","The AI tool everything in the bootcamp is built on. Dashboards, sites and agents.","AI & Automation","https://base44.com"],["Claude","Anthropic''s AI assistant. Used throughout the program for research, writing and analysis.","AI & Automation","https://claude.ai"],["ChatGPT","OpenAI''s assistant. Pair with Claude for scripts and creative drafts.","AI & Automation","https://chatgpt.com"],["n8n","Automation platform. Connect APIs and build agent workflows.","AI & Automation","https://n8n.io"],["Meta Business Manager","The home base for running Meta ads. Covered in Phase 4.","Ad Platforms","https://business.facebook.com"],["Meta Ads Library","Search live and past Meta ads for any brand or page.","Ad Platforms","https://www.facebook.com/ads/library"],["Google Ads","Search, display and performance max campaigns.","Ad Platforms","https://ads.google.com"],["TikTok Creative Center","Trending TikTok ads, top-performing creatives and sounds.","Ad Platforms","https://ads.tiktok.com/business/creativecenter"],["GoHighLevel","All-in-one CRM, pipelines and invoicing for your clients. Covered in Phase 5.","CRM & Tracking","https://www.gohighlevel.com"],["Stripe","Billing clients monthly.","CRM & Tracking","https://stripe.com"],["Canva","Creatives, proposals and quick mockups.","Creative","https://www.canva.com"],["Loom","Record walkthroughs for prospects and clients.","Creative","https://www.loom.com"],["Discord","The community. Calls, wins and questions.","Community","https://discord.com"]]'),
('onboarding_steps', '[["Book your onboarding call","Your coach sets you up on the tool live and builds your roadmap."],["Join the Discord","Introduce yourself in #introductions with your niche."],["Add your photo","Done in this portal. It shows on the leaderboard and the member map."],["Finish Phase 1","Watch Before Starting, then get set up on Base44 with your coach."],["Show up to Saturday''s Q&A with Jake","2 PM ET. Bring one question. Attendance earns daily activity points."]]')
on conflict (key) do nothing;

-- ---------- watch progress (how much of each video a student has actually played) ----------
create table if not exists public.watch_progress (
  profile_id uuid references public.profiles(id) on delete cascade,
  module_id text references public.modules(id) on delete cascade,
  seconds int not null default 0,
  duration int not null default 0,
  updated_at timestamptz default now(),
  primary key (profile_id, module_id)
);
alter table public.watch_progress enable row level security;
drop policy if exists "watch read own" on public.watch_progress;
create policy "watch read own" on public.watch_progress for select to authenticated using (profile_id = auth.uid() or public.is_admin());
drop policy if exists "watch insert own" on public.watch_progress;
create policy "watch insert own" on public.watch_progress for insert to authenticated with check (profile_id = auth.uid());
drop policy if exists "watch update own" on public.watch_progress;
create policy "watch update own" on public.watch_progress for update to authenticated using (profile_id = auth.uid());
