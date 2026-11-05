-- Run this migration in the Supabase SQL editor to enable sip limits on an
-- existing project. It also preserves the cooldown when a recent entry is undone.
create index if not exists water_logs_user_created_idx on public.water_logs (user_id, created_at desc);

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
  if p_amount_ml is null or p_amount_ml < 1 or p_amount_ml > 500 then
    raise exception 'Water amount must be between 1 and 500 ml.';
  end if;
  if p_challenge_date is null then
    raise exception 'A challenge date is required.';
  end if;

  select p.daily_goal_ml into current_goal
    from public.profiles p
    where p.id = current_user_id
    for update;
  if not found then
    raise exception 'Create your Aqua Bond profile before logging water.';
  end if;

  if exists (
    select 1
      from public.water_logs w
      where w.user_id = current_user_id
        and w.created_at > now() - interval '1 hour'
  ) then
    raise exception 'Please wait one hour between drinks.';
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

drop policy if exists "Users delete their own water logs" on public.water_logs;
create policy "Users delete their own water logs"
  on public.water_logs for delete to authenticated
  using (user_id = (select auth.uid()) and created_at <= now() - interval '1 hour');
