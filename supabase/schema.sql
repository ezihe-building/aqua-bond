-- Run this once in the Supabase SQL editor for your Aqua Bond project.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 32),
  invite_code text not null unique,
  daily_goal_ml integer not null default 2000 check (daily_goal_ml between 500 and 8000),
  reminder_time text check (reminder_time is null or reminder_time ~ '^(?:[01][0-9]|2[0-3]):[0-5][0-9]$'),
  sound_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function public.create_aqua_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, invite_code)
    values (
      new.id,
      coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 'Aqua friend'),
      'AQUA-' || upper(left(replace(gen_random_uuid()::text, '-', ''), 12))
    );
  return new;
end;
$$;

revoke all on function public.create_aqua_profile_for_new_user() from public, anon, authenticated;
drop trigger if exists aqua_profile_after_signup on auth.users;
create trigger aqua_profile_after_signup
  after insert on auth.users
  for each row execute function public.create_aqua_profile_for_new_user();

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  friend_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint friendships_not_self check (user_id <> friend_id),
  constraint friendships_unique_pair unique (user_id, friend_id)
);

drop index if exists public.friendships_one_link_per_user;
drop index if exists public.friendships_one_link_per_friend;
create index if not exists friendships_friend_id_idx on public.friendships (friend_id);

create table if not exists public.daily_challenges (
  user_id uuid not null references public.profiles (id) on delete cascade,
  challenge_date date not null,
  goal_ml integer not null check (goal_ml between 500 and 8000),
  completed_at timestamptz,
  primary key (user_id, challenge_date)
);

create table if not exists public.water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount_ml integer not null check (amount_ml between 1 and 5000),
  challenge_date date not null,
  created_at timestamptz not null default now()
);

create index if not exists water_logs_user_date_idx on public.water_logs (user_id, challenge_date desc, created_at desc);
create index if not exists daily_challenges_date_idx on public.daily_challenges (challenge_date desc);

create or replace function public.refresh_daily_challenge_after_log_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed_user_id uuid;
  changed_date date;
begin
  if tg_op = 'INSERT' then
    changed_user_id := new.user_id;
    changed_date := new.challenge_date;
    insert into public.daily_challenges (user_id, challenge_date, goal_ml)
      select changed_user_id, changed_date, p.daily_goal_ml
      from public.profiles p
      where p.id = changed_user_id
      on conflict (user_id, challenge_date) do nothing;
  else
    changed_user_id := old.user_id;
    changed_date := old.challenge_date;
  end if;

  update public.daily_challenges dc
    set completed_at = case
      when (select coalesce(sum(w.amount_ml), 0)
            from public.water_logs w
            where w.user_id = changed_user_id and w.challenge_date = changed_date) >= dc.goal_ml
        then coalesce(dc.completed_at, now())
      else null
    end
    where dc.user_id = changed_user_id and dc.challenge_date = changed_date;

  return null;
end;
$$;

revoke all on function public.refresh_daily_challenge_after_log_change() from public, anon, authenticated;
drop trigger if exists water_log_refresh_daily_challenge on public.water_logs;
create trigger water_log_refresh_daily_challenge
  after insert or delete on public.water_logs
  for each row execute function public.refresh_daily_challenge_after_log_change();

create or replace function public.log_water(p_amount_ml integer, p_challenge_date date)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_goal integer;
  prior_completion timestamptz;
  final_completion timestamptz;
begin
  if current_user_id is null then
    raise exception 'Sign in before logging water.';
  end if;
  if p_amount_ml is null or p_amount_ml < 1 or p_amount_ml > 5000 then
    raise exception 'Water amount must be between 1 and 5,000 ml.';
  end if;
  if p_challenge_date is null then
    raise exception 'A challenge date is required.';
  end if;

  select p.daily_goal_ml into current_goal
    from public.profiles p
    where p.id = current_user_id;
  if not found then
    raise exception 'Create your Aqua Bond profile before logging water.';
  end if;

  insert into public.daily_challenges (user_id, challenge_date, goal_ml)
    values (current_user_id, p_challenge_date, current_goal)
    on conflict (user_id, challenge_date) do nothing;

  select dc.completed_at into prior_completion
    from public.daily_challenges dc
    where dc.user_id = current_user_id and dc.challenge_date = p_challenge_date
    for update;

  insert into public.water_logs (user_id, amount_ml, challenge_date)
    values (current_user_id, p_amount_ml, p_challenge_date);

  select dc.completed_at into final_completion
    from public.daily_challenges dc
    where dc.user_id = current_user_id and dc.challenge_date = p_challenge_date;

  return prior_completion is null and final_completion is not null;
end;
$$;

revoke all on function public.log_water(integer, date) from public, anon;
grant execute on function public.log_water(integer, date) to authenticated;
revoke insert on public.water_logs from anon, authenticated;

alter table public.profiles enable row level security;
alter table public.friendships enable row level security;
alter table public.daily_challenges enable row level security;
alter table public.water_logs enable row level security;

drop policy if exists "Profiles are visible to self and friend" on public.profiles;
create policy "Profiles are visible to self and friend"
  on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or exists (
      select 1 from public.friendships f
      where (f.user_id = (select auth.uid()) and f.friend_id = profiles.id)
         or (f.friend_id = (select auth.uid()) and f.user_id = profiles.id)
    )
  );
drop policy if exists "Users create their own profile" on public.profiles;
create policy "Users create their own profile"
  on public.profiles for insert to authenticated
  with check (id = (select auth.uid()));
drop policy if exists "Users update their own profile" on public.profiles;
create policy "Users update their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists "Friend links are visible to participants" on public.friendships;
create policy "Friend links are visible to participants"
  on public.friendships for select to authenticated
  using (user_id = (select auth.uid()) or friend_id = (select auth.uid()));
drop policy if exists "Participants can remove friend links" on public.friendships;
create policy "Participants can remove friend links"
  on public.friendships for delete to authenticated
  using (user_id = (select auth.uid()) or friend_id = (select auth.uid()));

drop policy if exists "Challenge history is visible to self and friend" on public.daily_challenges;
create policy "Challenge history is visible to self and friend"
  on public.daily_challenges for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.friendships f
      where (f.user_id = (select auth.uid()) and f.friend_id = daily_challenges.user_id)
         or (f.friend_id = (select auth.uid()) and f.user_id = daily_challenges.user_id)
    )
  );
drop policy if exists "Users create their own daily challenges" on public.daily_challenges;
create policy "Users create their own daily challenges"
  on public.daily_challenges for insert to authenticated
  with check (user_id = (select auth.uid()));
drop policy if exists "Users update their own daily challenges" on public.daily_challenges;
create policy "Users update their own daily challenges"
  on public.daily_challenges for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Water logs are visible to self and friend" on public.water_logs;
create policy "Water logs are visible to self and friend"
  on public.water_logs for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.friendships f
      where (f.user_id = (select auth.uid()) and f.friend_id = water_logs.user_id)
         or (f.friend_id = (select auth.uid()) and f.user_id = water_logs.user_id)
    )
  );
drop policy if exists "Users delete their own water logs" on public.water_logs;
create policy "Users delete their own water logs"
  on public.water_logs for delete to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.connect_friend(p_invite_code text)
returns table (friend_id uuid, friend_name text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target public.profiles%rowtype;
begin
  if current_user_id is null then
    raise exception 'Sign in before connecting a friend.';
  end if;

  select p.* into target
    from public.profiles p
    where p.invite_code = upper(trim(p_invite_code))
    limit 1;

  if not found then
    raise exception 'We could not find that invite code.';
  end if;
  if target.id = current_user_id then
    raise exception 'That invite code belongs to you.';
  end if;

  perform 1
    from public.profiles p
    where p.id in (current_user_id, target.id)
    order by p.id
    for update;

  if exists (
    select 1 from public.friendships f
    where (f.user_id = current_user_id and f.friend_id = target.id)
       or (f.user_id = target.id and f.friend_id = current_user_id)
  ) then
    raise exception 'You are already following this person.';
  end if;

  insert into public.friendships (user_id, friend_id)
    values (current_user_id, target.id);
  return query select target.id, target.display_name;
end;
$$;

revoke all on function public.connect_friend(text) from public;
grant execute on function public.connect_friend(text) to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'friendships'
  ) then
    alter publication supabase_realtime add table public.friendships;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'daily_challenges'
  ) then
    alter publication supabase_realtime add table public.daily_challenges;
  end if;
end
$$;
7