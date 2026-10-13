-- Migration 2: phases, quizzes, call calendar, recordings, leaderboard breakdowns.
-- Re-runnable. Run after schema.sql.

-- ---------- phases (course sections) ----------
create table if not exists public.phases (
  id text primary key,
  sort int not null,
  group_key text not null default 'core' check (group_key in ('core','bonus')),
  title text not null,
  description text default '',
  icon text default 'play',      -- key into the portal's icon set
  color text default '#22e36b'   -- accent for the phase card
);
alter table public.modules add column if not exists phase_id text references public.phases(id);
alter table public.modules add column if not exists kind text not null default 'video' check (kind in ('video','quiz'));
alter table public.modules add column if not exists quiz jsonb default '[]'::jsonb; -- [{q, options:[..], answer:index}]
alter table public.modules add column if not exists pass_pct int default 80;

alter table public.phases enable row level security;
drop policy if exists "phases read" on public.phases;
create policy "phases read" on public.phases for select to authenticated using (true);
drop policy if exists "phases admin write" on public.phases;
create policy "phases admin write" on public.phases for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.phases (id, sort, group_key, title, description, icon, color) values
('p1', 1, 'core', 'Start Here', 'How the bootcamp works, who your coaches are, and getting set up on Base44 with your coach.', 'bulb', '#4f8cff'),
('p2', 2, 'core', 'Niche & Offer', 'Pick a niche with money and pain, and shape an offer local businesses say yes to.', 'target', '#22e36b'),
('p3', 3, 'core', 'Build The Software', 'Client dashboards, AI websites and super agents. The product you walk in with.', 'monitor', '#a78bfa'),
('p4', 4, 'core', 'Ads & Brand', 'Full AI ad scripting, creatives and setup, plus the personal brand businesses trust.', 'megaphone', '#3dd6f5'),
('p5', 5, 'core', 'Close The Deal', 'The pitch, the pricing model, and the Stripe + GHL setup to sign and bill your first client.', 'dollar', '#f5c652'),
('p6', 6, 'core', 'Scale', 'The 30-day launch plan: from portfolio to paying clients in your first month.', 'chart', '#ff8a5c'),
('pb', 7, 'bonus', 'Case Studies & Masterclass', 'Two students walk through their first months, plus the full live masterclass with Jakey.', 'star', '#f5c652')
on conflict (id) do nothing;

update public.modules set phase_id = case id
  when 'm01' then 'p1' when 'm00' then 'p1'
  when 'm02' then 'p2'
  when 'm03' then 'p3' when 'm04' then 'p3' when 'm06' then 'p3'
  when 'm05' then 'p4' when 'm07' then 'p4'
  when 'm08' then 'p5'
  when 'm09' then 'p6'
  when 'm10' then 'pb' when 'm11' then 'pb' when 'm12' then 'pb'
  else phase_id end
where phase_id is null;

-- ---------- quiz attempts ----------
create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  module_id text references public.modules(id) on delete cascade,
  score_pct int not null,
  passed boolean not null,
  created_at timestamptz default now()
);
alter table public.quiz_attempts enable row level security;
drop policy if exists "quiz read own" on public.quiz_attempts;
create policy "quiz read own" on public.quiz_attempts for select to authenticated using (profile_id = auth.uid() or public.is_admin());
drop policy if exists "quiz insert own" on public.quiz_attempts;
create policy "quiz insert own" on public.quiz_attempts for insert to authenticated with check (profile_id = auth.uid());

-- ---------- call calendar ----------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  coach text default '',
  description text default '',
  weekday int not null check (weekday between 0 and 6),   -- 0 = Sunday
  start_time time not null,                              -- Eastern time
  duration_min int not null default 60,
  color text default '#22e36b',
  join_url text default '',
  active boolean not null default true,
  sort int default 0
);
alter table public.events enable row level security;
drop policy if exists "events read" on public.events;
create policy "events read" on public.events for select to authenticated using (true);
drop policy if exists "events admin write" on public.events;
create policy "events admin write" on public.events for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.events (title, coach, description, weekday, start_time, duration_min, color, sort)
select * from (values
  ('AI Integration', 'Coach Adriel', 'Setting up and running AI agents inside your business. Base44 builds, super agents, automations and live troubleshooting.', 1, time '17:00', 60, '#3dd6f5', 1),
  ('Lead Gen', 'Coach Adriel', 'Outreach that books calls: lead scraping, Instagram and cold email agents, follow-up and pipeline reviews.', 3, time '19:00', 60, '#22e36b', 2),
  ('Media Buying', 'Coach Adriel', 'Delivering results for clients: campaign structure, creatives, reading ad data and what to change.', 5, time '21:00', 60, '#a78bfa', 3),
  ('Q&A with Jake', 'Jake', 'Bring your builds, client replies and stuck points. Open floor.', 6, time '14:00', 60, '#f5c652', 4)
) as v(title, coach, description, weekday, start_time, duration_min, color, sort)
where not exists (select 1 from public.events);

-- ---------- recordings ----------
create table if not exists public.recordings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  coach text default '',
  category text default 'Q&A',
  held_on date not null default current_date,
  duration_min int default 60,
  video_url text default '',
  notes text default '',
  color text default '#22e36b',
  created_at timestamptz default now()
);
create table if not exists public.recording_watches (
  profile_id uuid references public.profiles(id) on delete cascade,
  recording_id uuid references public.recordings(id) on delete cascade,
  watched_at timestamptz default now(),
  primary key (profile_id, recording_id)
);
alter table public.recordings enable row level security;
alter table public.recording_watches enable row level security;
drop policy if exists "recordings read" on public.recordings;
create policy "recordings read" on public.recordings for select to authenticated using (true);
drop policy if exists "recordings admin write" on public.recordings;
create policy "recordings admin write" on public.recordings for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "rw read own" on public.recording_watches;
create policy "rw read own" on public.recording_watches for select to authenticated using (profile_id = auth.uid() or public.is_admin());
drop policy if exists "rw insert own" on public.recording_watches;
create policy "rw insert own" on public.recording_watches for insert to authenticated with check (profile_id = auth.uid());
drop policy if exists "rw delete own" on public.recording_watches;
create policy "rw delete own" on public.recording_watches for delete to authenticated using (profile_id = auth.uid());

-- ---------- leaderboard breakdowns: approved submissions are visible to everyone ----------
drop policy if exists "submissions read" on public.submissions;
create policy "submissions read" on public.submissions for select to authenticated using (profile_id = auth.uid() or status = 'approved' or public.is_admin());

-- quarter-scoped leaderboard: same math as the view, limited to activity since a date
create or replace function public.leaderboard_since(since timestamptz)
returns table (id uuid, name text, city text, photo_url text, points bigint, course_points bigint, implementation_points bigint, revenue_points bigint, activity_points bigint)
language sql stable security definer set search_path = public as $$
  select p.id, p.name, p.city, p.photo_url,
    coalesce(lp.pts,0) + coalesce(sb.pts,0) + coalesce(ad.pts,0) as points,
    coalesce(lp.pts,0), coalesce(sb.impl,0), coalesce(sb.rev,0), coalesce(ad.pts,0)
  from public.profiles p
  left join (select l.profile_id, sum(m.points) pts from public.lesson_progress l join public.modules m on m.id=l.module_id where l.completed_at >= since group by l.profile_id) lp on lp.profile_id=p.id
  left join (select s.profile_id, sum(a.points) pts, sum(case when a.category='implement' then a.points else 0 end) impl, sum(case when a.category='revenue' then a.points else 0 end) rev
             from public.submissions s join public.achievements a on a.key=s.achievement_key where s.status='approved' and coalesce(s.reviewed_at, s.created_at) >= since group by s.profile_id) sb on sb.profile_id=p.id
  left join (select profile_id, count(*)*3 pts from public.activity_days where day >= since::date group by profile_id) ad on ad.profile_id=p.id
  where p.active and p.role='student';
$$;

-- tiers with colors
update public.settings set value = '[["Activated",50,"#8f97ad"],["In Motion",150,"#f5c652"],["Builder",350,"#22e36b"],["Operator",650,"#3dd6f5"],["Elite",1000,"#a78bfa"],["Legend",1500,"#f5c652"],["Mythic",3000,"#ff8a5c"]]'::jsonb where key = 'tiers';

-- resources with payments category and more tools
update public.settings set value = '[["Base44","The AI tool everything in the bootcamp is built on. Dashboards, sites and agents.","AI & Automation","https://base44.com"],["Claude","Anthropic''s AI assistant. Used throughout the program for research, writing and analysis.","AI & Automation","https://claude.ai"],["ChatGPT","OpenAI''s assistant. Pair with Claude for scripts and creative drafts.","AI & Automation","https://chatgpt.com"],["n8n","Automation platform. Connect APIs and build agent workflows.","AI & Automation","https://n8n.io"],["Meta Business Manager","The home base for running Meta ads. Covered in Ads & Brand.","Ad Platforms","https://business.facebook.com"],["Meta Ads Library","Search live and past Meta ads for any brand or page. Competitor research.","Ad Platforms","https://www.facebook.com/ads/library"],["Google Ads","Search, display and performance max campaigns.","Ad Platforms","https://ads.google.com"],["Google Ads Transparency Center","Search any advertiser''s live Google Ads. See what competitors are running.","Ad Platforms","https://adstransparency.google.com"],["TikTok Creative Center","Trending TikTok ads, top-performing creatives and sounds.","Ad Platforms","https://ads.tiktok.com/business/creativecenter"],["GoHighLevel","All-in-one CRM, pipelines and invoicing for your clients. Covered in Close The Deal.","CRM & Tracking","https://www.gohighlevel.com"],["Hyros","Server-side ad tracking and attribution. Standard for high-ticket.","CRM & Tracking","https://hyros.com"],["Loom","Record quick video walkthroughs for clients and prospects.","CRM & Tracking","https://www.loom.com"],["Canva","Fast creative and graphic design. Proposals, ads and mockups.","Creative","https://www.canva.com"],["Stripe","Payment processing for client invoicing. The default for most offers.","Payments","https://stripe.com"],["Wise","International payments with low fees. Useful for foreign clients.","Payments","https://wise.com"],["Square","Payments, invoices and POS. For B2B invoice flows and non-Stripe clients.","Payments","https://squareup.com"],["Discord","The community. Calls, wins and questions.","Community","https://discord.com"]]'::jsonb where key = 'resources';
