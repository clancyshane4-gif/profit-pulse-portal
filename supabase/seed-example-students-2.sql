-- Five more example students, and wins spread over the last 10 days so the feed rotates through people.
-- Display only (no password). Remove all examples: delete from auth.users where email like '%@example.com';
do $$
declare ids uuid[] := array['11111111-1111-4111-8111-000000000004','11111111-1111-4111-8111-000000000005','11111111-1111-4111-8111-000000000006','11111111-1111-4111-8111-000000000007','11111111-1111-4111-8111-000000000008']::uuid[];
        emails text[] := array['jordan.price@example.com','sofia.martin@example.com','luis.ortega@example.com','kyle.nguyen@example.com','isaiah.cole@example.com'];
        names text[] := array['Jordan Price','Sofia Martin','Luis Ortega','Kyle Nguyen','Isaiah Cole'];
        cities text[] := array['Dallas, TX','San Antonio, TX','Seattle, WA','Atlanta, GA','Orlando, FL'];
        lats float[] := array[32.78,29.42,47.61,33.75,28.54]; lngs float[] := array[-96.80,-98.49,-122.33,-84.39,-81.38];
        photos text[] := array['https://randomuser.me/api/portraits/men/41.jpg','https://randomuser.me/api/portraits/women/65.jpg','https://randomuser.me/api/portraits/men/22.jpg','https://randomuser.me/api/portraits/men/90.jpg','https://randomuser.me/api/portraits/men/12.jpg'];
        nmods int[] := array[8,5,7,4,2];
        nach text[] := array['niche,offer,dashboard,website,agent,call,client','niche,offer,website','niche,offer,dashboard,out50,call','niche,offer','niche'];
        ndays int[] := array[27,15,19,11,5];
        i int; j int; m record; k text;
begin
  for i in 1..5 loop
    insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_sso_user)
    values (ids[i], '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', emails[i], now(), '{"provider":"email","providers":["email"]}', jsonb_build_object('name', names[i]), now() - (30 - i*3) * interval '1 day', now(), false)
    on conflict (id) do nothing;
    insert into public.profiles (id, email, name, role) values (ids[i], emails[i], names[i], 'student') on conflict (id) do nothing;
    update public.profiles set name = names[i], city = cities[i], lat = lats[i], lng = lngs[i], photo_url = photos[i], discord = split_part(emails[i], '@', 1),
      onboarded = true, must_change_password = false, active = true, created_at = now() - (30 - i*3) * interval '1 day' where id = ids[i];
    j := 0;
    for m in select id from public.modules where published order by sort loop
      exit when j >= nmods[i]; j := j + 1;
      insert into public.lesson_progress (profile_id, module_id, completed_at) values (ids[i], m.id, now() - (nmods[i] - j) * interval '2 day') on conflict do nothing;
    end loop;
    foreach k in array string_to_array(nach[i], ',') loop
      insert into public.submissions (profile_id, achievement_key, proof, status, reviewed_at, seen_at, created_at)
      values (ids[i], k, 'Example proof', 'approved', now(), now(), now()) on conflict do nothing;
    end loop;
    for j in 0..ndays[i]-1 loop
      insert into public.activity_days (profile_id, day, points) values (ids[i], current_date - j, 3) on conflict do nothing;
    end loop;
  end loop;
  -- spread every example win over the last 10 days, newest ones mixed across people
  update public.submissions s set reviewed_at = now() - (abs(hashtext(s.profile_id::text || s.achievement_key)) % 14400) * interval '1 minute'
  from public.profiles p where p.id = s.profile_id and p.email like '%@example.com' and s.status = 'approved';
end $$;
select p.name || ' · ' || l.points || ' pts' as row from public.leaderboard l join public.profiles p on p.id = l.id order by l.points desc;
