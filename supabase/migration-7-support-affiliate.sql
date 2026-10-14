-- Migration 7: support chat, affiliate tools page, phase emojis, tidy call times.

-- ---------- support chat ----------
create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,   -- the student the thread belongs to
  author_id uuid references public.profiles(id) on delete set null,   -- who wrote it (student or staff)
  from_staff boolean not null default false,
  body text not null,
  read_at timestamptz,
  created_at timestamptz default now()
);
alter table public.support_messages enable row level security;
drop policy if exists "support read" on public.support_messages;
create policy "support read" on public.support_messages for select to authenticated using (profile_id = auth.uid() or public.is_admin());
drop policy if exists "support insert" on public.support_messages;
create policy "support insert" on public.support_messages for insert to authenticated
  with check (author_id = auth.uid() and ((profile_id = auth.uid() and from_staff = false) or (public.is_admin() and from_staff = true)));
drop policy if exists "support update" on public.support_messages;
create policy "support update" on public.support_messages for update to authenticated using (profile_id = auth.uid() or public.is_admin());

insert into public.settings (key, value) values ('support', '{"email": "support@aiprofitpulse.com", "auto_reply": "Got it. A coach reads every message and replies here (and to your email) within 24 hours, usually much faster. If it is urgent, email support@aiprofitpulse.com.", "hours": "Mon–Fri, 9am–6pm ET"}'::jsonb)
on conflict (key) do update set value = excluded.value;

-- ---------- affiliate tools (paid / low-ticket) ----------
-- [name, blurb, category, url, price, commission, logo_domain]
insert into public.settings (key, value) values ('affiliate_tools', '[
 ["Base44","The AI builder every dashboard, site and agent in the bootcamp runs on. Students and clients both need an account.","Builder","https://base44.com","From $20/mo","","base44.com"],
 ["GoHighLevel","CRM, pipelines, calendars and invoicing for your clients. White-label it as your own software.","CRM","https://www.gohighlevel.com","From $97/mo","","gohighlevel.com"],
 ["Hyros","Ad tracking and attribution for clients who run ads. The upsell once campaigns are live.","Tracking","https://hyros.com","From $99/mo","","hyros.com"],
 ["Loom","Video DMs and client walkthroughs. The outreach channel that gets replies.","Outreach","https://www.loom.com","Free / $15/mo","","loom.com"],
 ["Canva Pro","Creatives, proposals and client mockups in minutes.","Creative","https://www.canva.com","$15/mo","","canva.com"]
]'::jsonb) on conflict (key) do nothing;

-- ---------- phase emojis ----------
update public.phases set icon = v.i from (values ('p1','🚀'),('p2','🎯'),('p3','🛠️'),('p4','📣'),('p5','💰'),('p6','📈'),('pb','⭐')) as v(id, i) where phases.id = v.id;

-- ---------- calls at 5, 6, 7 PM ET ----------
update public.events set start_time = time '17:00' where title = 'AI Integration';
update public.events set start_time = time '18:00' where title = 'Lead Gen';
update public.events set start_time = time '19:00' where title = 'Media Buying';
