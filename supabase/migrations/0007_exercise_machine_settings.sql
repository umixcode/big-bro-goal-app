-- Per-user machine settings (seat/pulley height, and pulley width for cable
-- stations) keyed by exercise name, so they're remembered across sessions.
create table exercise_machine_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_name text not null,
  height text,
  width text,
  updated_at timestamptz default now(),
  unique (user_id, exercise_name)
);

alter table exercise_machine_settings enable row level security;
create policy "owner_full_access" on exercise_machine_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
