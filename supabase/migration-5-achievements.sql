-- Migration 5: achievements upgrade (image proof, rejection notes, resubmit, outreach counter, auto-awards, editor)
alter table public.achievements add column if not exists icon text default '';
alter table public.achievements add column if not exists auto_metric text default '';     -- e.g. 'outreach'
alter table public.achievements add column if not exists auto_threshold int default 0;    -- e.g. 50
update public.achievements set auto_metric = 'outreach', auto_threshold = 50 where key = 'out50';
update public.achievements set auto_metric = 'outreach', auto_threshold = 100 where key = 'out100';
update public.achievements set auto_metric = 'outreach', auto_threshold = 200 where key = 'out200';
update public.achievements set how = 'Logged automatically from your outreach counter.' where key in ('out50','out100','out200');
update public.achievements set icon = v.icon from (values ('niche','🎯'),('offer','📝'),('dashboard','📊'),('website','🌐'),('agent','🤖'),('adaccount','📣'),('proposal','📑'),('out50','✉️'),('out100','📨'),('out200','📬'),('call','📞'),('client','🤝'),('firstdollar','💵'),('k1','💰'),('k5','💎'),('k10','🏆')) as v(key, icon) where achievements.key = v.key and coalesce(achievements.icon,'') = '';
-- journey order: build → outreach → close → revenue
update public.achievements set sort = v.s from (values ('niche',1),('offer',2),('dashboard',3),('website',4),('agent',5),('adaccount',6),('proposal',7),('out50',8),('out100',9),('out200',10),('call',11),('client',12),('firstdollar',13),('k1',14),('k5',15),('k10',16)) as v(key, s) where achievements.key = v.key;

alter table public.submissions add column if not exists images jsonb default '[]'::jsonb;
alter table public.submissions add column if not exists reviewer_note text default '';
alter table public.submissions add column if not exists seen_at timestamptz;

-- students may edit their own submission only to resubmit a rejected one or to mark an approval as seen
drop policy if exists "submissions update own" on public.submissions;
create policy "submissions update own" on public.submissions for update to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create or replace function public.protect_submission_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    -- allowed transitions for the owner: rejected -> pending (resubmit), and setting seen_at on an approved one
    if old.status = 'rejected' and new.status = 'pending' then
      new.reviewed_by := null; new.reviewed_at := null; new.reviewer_note := ''; new.created_at := now();
    elsif old.status = new.status then
      new.proof := old.proof; new.images := old.images; new.reviewer_note := old.reviewer_note; new.reviewed_by := old.reviewed_by; new.reviewed_at := old.reviewed_at;
    else
      raise exception 'not allowed';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists protect_submission_fields on public.submissions;
create trigger protect_submission_fields before update on public.submissions for each row execute function public.protect_submission_fields();

-- proof screenshots
insert into storage.buckets (id, name, public) values ('proofs', 'proofs', true) on conflict (id) do nothing;
drop policy if exists "proofs read" on storage.objects;
create policy "proofs read" on storage.objects for select using (bucket_id = 'proofs');
drop policy if exists "proofs upload own" on storage.objects;
create policy "proofs upload own" on storage.objects for insert to authenticated with check (bucket_id = 'proofs' and (storage.foldername(name))[1] = auth.uid()::text);

-- outreach counter
create table if not exists public.outreach_log (
  profile_id uuid references public.profiles(id) on delete cascade,
  day date not null default current_date,
  count int not null default 0,
  primary key (profile_id, day)
);
alter table public.outreach_log enable row level security;
drop policy if exists "outreach read" on public.outreach_log;
create policy "outreach read" on public.outreach_log for select to authenticated using (profile_id = auth.uid() or public.is_admin());
drop policy if exists "outreach insert own" on public.outreach_log;
create policy "outreach insert own" on public.outreach_log for insert to authenticated with check (profile_id = auth.uid());
drop policy if exists "outreach update own" on public.outreach_log;
create policy "outreach update own" on public.outreach_log for update to authenticated using (profile_id = auth.uid());

-- auto-award threshold achievements from the counter
create or replace function public.award_auto_achievements()
returns trigger language plpgsql security definer set search_path = public as $$
declare total int; a record;
begin
  select coalesce(sum(count),0) into total from public.outreach_log where profile_id = new.profile_id;
  for a in select key, auto_threshold from public.achievements where auto_metric = 'outreach' and auto_threshold > 0 and auto_threshold <= total loop
    insert into public.submissions (profile_id, achievement_key, proof, status, reviewed_at)
    values (new.profile_id, a.key, 'Outreach counter reached ' || a.auto_threshold, 'approved', now())
    on conflict (profile_id, achievement_key) do update set status = 'approved', reviewed_at = coalesce(public.submissions.reviewed_at, now()) where public.submissions.status <> 'approved';
  end loop;
  return new;
end $$;
drop trigger if exists award_auto_achievements on public.outreach_log;
create trigger award_auto_achievements after insert or update on public.outreach_log for each row execute function public.award_auto_achievements();
