-- Progressive-overload helper: most recent prior top (non-warmup) set for an
-- exercise, scoped to the calling user. Ordering picks the most recent session
-- date first, then the latest session that day, then the heaviest set logged.
create or replace function previous_top_set(
  p_exercise_name text,
  p_exclude_session_id uuid default null
)
returns table (
  weight numeric,
  weight_unit text,
  reps int,
  rpe numeric,
  session_date date,
  session_id uuid
)
language sql
stable
as $$
  select ls.weight, ls.weight_unit, ls.reps, ls.rpe, ws.session_date, ws.id
  from logged_sets ls
  join workout_sessions ws on ws.id = ls.session_id
  where ls.exercise_name = p_exercise_name
    and ws.user_id = auth.uid()
    and ls.is_warmup = false
    and ls.weight is not null
    and (p_exclude_session_id is null or ls.session_id <> p_exclude_session_id)
  order by ws.session_date desc, ws.started_at desc, ls.weight desc
  limit 1;
$$;
