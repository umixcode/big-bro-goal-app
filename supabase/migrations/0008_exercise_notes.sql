-- Per-user personal notes on an exercise (form cues, injury reminders,
-- etc.), keyed by exercise name so they're remembered across every session
-- that exercise shows up in — mirrors exercise_machine_settings.
create table exercise_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_name text not null,
  notes text,
  updated_at timestamptz default now(),
  unique (user_id, exercise_name)
);

alter table exercise_notes enable row level security;
create policy "owner_full_access" on exercise_notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
