-- Three example students for the leaderboard, map and wins feed.
-- Display only: they have no password and cannot sign in. Re-runnable.
-- To remove them later: delete from auth.users where email like '%@example.com';
do $$
declare ids uuid[] := array['11111111-1111-4111-8111-000000000001','11111111-1111-4111-8111-000000000002','11111111-1111-4111-8111-000000000003']::uuid[];
        emails text[] := array['marcus.reed@example.com','dani.alvarez@example.com','tanner.brooks@example.com'];
        names text[] := array['Marcus Reed','Dani Alvarez','Tanner Brooks'];
        cities text[] := array['Houston, TX','Phoenix, AZ','Brooklyn, NY'];
        lats float[] := array[29.76,33.45,40.68]; lngs float[] := array[-95.37,-112.07,-73.94];
        photos text[] := array['https://randomuser.me/api/portraits/men/32.jpg','https://randomuser.me/api/portraits/women/44.jpg','https://randomuser.me/api/portraits/men/75.jpg'];
        nmods int[] := array[9,6,3];
        nach text[] := array['niche,offer,dashboard,website,call','niche,offer,dashboard','niche'];
        ndays int[] := array[34,21,9];
        i int; j int; m record; k text;
begin
  for i in 1..3 loop
    insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_sso_user)
    values (ids[i], '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', emails[i], now(), '{"provider":"email","providers":["email"]}', jsonb_build_object('name', names[i]), now() - (40 - i*5) * interval '1 day', now(), false)
    on conflict (id) do nothing;
    insert into public.profiles (id, email, name, role) values (ids[i], emails[i], names[i], 'student') on conflict (id) do nothing;
    update public.profiles set name = names[i], city = cities[i], lat = lats[i], lng = lngs[i], photo_url = photos[i], discord = split_part(emails[i], '@', 1),
      onboarded = true, must_change_password = false, active = true, created_at = now() - (40 - i*5) * interval '1 day' where id = ids[i];
    j := 0;
    for m in select id from public.modules where published order by sort loop
      exit when j >= nmods[i]; j := j + 1;
      insert into public.lesson_progress (profile_id, module_id, completed_at) values (ids[i], m.id, now() - (nmods[i] - j) * interval '2 day') on conflict do nothing;
    end loop;
    foreach k in array string_to_array(nach[i], ',') loop
      insert into public.submissions (profile_id, achievement_key, proof, status, reviewed_at, seen_at, created_at)
      values (ids[i], k, 'Example proof', 'approved', now() - interval '3 day', now(), now() - interval '4 day') on conflict do nothing;
    end loop;
    for j in 0..ndays[i]-1 loop
      insert into public.activity_days (profile_id, day, points) values (ids[i], current_date - j, 3) on conflict do nothing;
    end loop;
  end loop;
end $$;
select p.name, p.city, l.points from public.leaderboard l join public.profiles p on p.id = l.id order by l.points desc;
