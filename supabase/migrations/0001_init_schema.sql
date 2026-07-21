-- Big Bro — initial schema
-- Run this once against a fresh Supabase project (SQL Editor, or `supabase db push` if using the CLI).

create extension if not exists "pgcrypto";
create extension if not exists moddatetime;

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- 1. Identity & goal inputs
-- ============================================================

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  gender text check (gender in ('male','female')),
  date_of_birth date,
  height_cm numeric,
  current_weight_kg numeric,
  activity_level text check (activity_level in ('sedentary','light','moderate','active','very_active')) default 'moderate',
  units_preference text check (units_preference in ('metric','imperial')) default 'imperial',
  timezone text default 'UTC',
  onboarding_completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger set_updated_at before update on profiles for each row execute function set_updated_at();

create table user_goals (
  user_id uuid primary key references auth.users(id) on delete cascade,
  desired_weight_kg numeric,
  target_date date,
  sleep_goal_hours numeric default 8,
  step_goal int default 4000,
  water_bottle_ml int default 500,
  water_cup_ml int default 240,
  calorie_goal_override int,
  protein_goal_override_g numeric,
  fat_goal_override_g numeric,
  carbs_goal_override_g numeric,
  water_goal_override_ml numeric,
  updated_at timestamptz default now()
);
create trigger set_updated_at before update on user_goals for each row execute function set_updated_at();

create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  category text check (category in ('weight','sleep','food','reading','prayer','workout','custom')) default 'custom',
  target_value numeric,
  target_unit text,
  target_date date,
  status text check (status in ('active','completed','archived')) default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger set_updated_at before update on goals for each row execute function set_updated_at();

-- ============================================================
-- 2. Daily trackers
-- ============================================================

create table sleep_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  source text check (source in ('healthkit','manual')) default 'manual',
  total_minutes int not null,
  rem_minutes int,
  light_minutes int,
  deep_minutes int,
  awake_minutes int,
  start_time timestamptz,
  end_time timestamptz,
  score numeric,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, date)
);
create trigger set_updated_at before update on sleep_logs for each row execute function set_updated_at();

create table food_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  logged_at timestamptz default now(),
  name text not null,
  calories numeric not null,
  protein_g numeric default 0,
  carbs_g numeric default 0,
  fat_g numeric default 0,
  created_at timestamptz default now()
);
create index food_entries_user_date_idx on food_entries (user_id, date);

create table water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  logged_at timestamptz default now(),
  amount_ml numeric not null,
  created_at timestamptz default now()
);
create index water_logs_user_date_idx on water_logs (user_id, date);

create table weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  weight_kg numeric not null,
  source text check (source in ('healthkit','manual')) default 'manual',
  created_at timestamptz default now(),
  unique (user_id, date)
);

create table steps_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  steps int not null,
  source text check (source in ('healthkit','manual')) default 'manual',
  created_at timestamptz default now(),
  unique (user_id, date)
);

-- ============================================================
-- 3. Workout — template (imported) + logged performance
-- ============================================================

create table workout_programs (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  split_type text check (split_type in ('ppl_upper_lower','full_body')) not null,
  description text,
  created_at timestamptz default now()
);

create table workout_phases (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references workout_programs(id) on delete cascade,
  phase_number int not null,
  name text,
  start_date date,
  end_date date,
  notes text,
  created_at timestamptz default now(),
  unique (program_id, phase_number)
);

create table workout_phase_days (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references workout_phases(id) on delete cascade,
  day_key text not null,
  day_name text not null,
  day_order int not null,
  created_at timestamptz default now(),
  unique (phase_id, day_order)
);

create table workout_phase_exercises (
  id uuid primary key default gen_random_uuid(),
  phase_day_id uuid not null references workout_phase_days(id) on delete cascade,
  exercise_order int not null,
  exercise_name text not null,
  last_set_intensity_technique text,
  warm_up_sets text,
  working_sets int,
  reps_range text,
  early_set_rpe text,
  last_set_rpe text,
  rest text,
  substitution_option_1 text,
  substitution_option_2 text,
  notes text,
  created_at timestamptz default now(),
  unique (phase_day_id, exercise_order)
);

create table user_program_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  phase_id uuid not null references workout_phases(id),
  started_at date not null default current_date,
  is_active boolean not null default true,
  created_at timestamptz default now()
);
create unique index one_active_enrollment_per_user
  on user_program_enrollments (user_id) where (is_active);

create table workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  phase_day_id uuid references workout_phase_days(id),
  session_date date not null default current_date,
  started_at timestamptz default now(),
  ended_at timestamptz,
  notes text,
  created_at timestamptz default now()
);

create table logged_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references workout_sessions(id) on delete cascade,
  phase_exercise_id uuid references workout_phase_exercises(id),
  exercise_name text not null,
  set_number int not null,
  is_warmup boolean default false,
  weight numeric,
  weight_unit text check (weight_unit in ('lb','kg')) default 'lb',
  reps int,
  rpe numeric,
  created_at timestamptz default now()
);
create index logged_sets_exercise_name_idx on logged_sets (exercise_name);

create table one_rep_max_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_name text not null default 'Barbell Bench Press',
  estimated_1rm numeric not null,
  source_set_id uuid references logged_sets(id),
  logged_at timestamptz default now(),
  created_at timestamptz default now()
);

-- ============================================================
-- 4. Salah, prayer times, reminders
-- ============================================================

create table salah_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  prayer text check (prayer in ('fajr','dhuhr','asr','maghrib','isha')) not null,
  prayed boolean not null default false,
  location text check (location in ('masjid','home','other')),
  prayed_at timestamptz,
  created_at timestamptz default now(),
  unique (user_id, date, prayer)
);

create table prayer_times_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  latitude numeric not null,
  longitude numeric not null,
  calculation_method int not null default 3,
  school int not null default 1,
  fajr time, sunrise time, dhuhr time, asr time, maghrib time, isha time,
  fetched_at timestamptz default now(),
  unique (user_id, date)
);

create table iqama_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  fajr_offset_minutes int default 20,
  dhuhr_offset_minutes int default 10,
  asr_offset_minutes int default 10,
  maghrib_offset_minutes int default 5,
  isha_offset_minutes int default 10,
  notifications_enabled boolean default true,
  updated_at timestamptz default now()
);
create trigger set_updated_at before update on iqama_settings for each row execute function set_updated_at();

-- ============================================================
-- 5. Brain, calendar, planner, journal, dhikr, AI mentor stub
-- ============================================================

create table books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  author text,
  cover_image_url text,
  status text check (status in ('not_started','in_progress','done')) default 'not_started',
  total_pages int,
  last_page_read int default 0,
  started_at date,
  finished_at date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger set_updated_at before update on books for each row execute function set_updated_at();

create table calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  start_at timestamptz not null,
  end_at timestamptz,
  all_day boolean default false,
  category text check (category in ('goal','prayer','workout','custom')) default 'custom',
  reminder_minutes_before int,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger set_updated_at before update on calendar_events for each row execute function set_updated_at();

create table planner_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  title text not null,
  is_completed boolean default false,
  completed_at timestamptz,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index planner_tasks_user_date_idx on planner_tasks (user_id, date);
create trigger set_updated_at before update on planner_tasks for each row execute function set_updated_at();

create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_at timestamptz default now(),
  mood_score smallint check (mood_score between 1 and 5),
  content text,
  created_at timestamptz default now()
);

create table dhikr_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  dhikr_type text not null default 'General',
  count int not null default 0,
  target_count int,
  updated_at timestamptz default now(),
  unique (user_id, date, dhikr_type)
);

create or replace function increment_dhikr(p_user_id uuid, p_date date, p_type text, p_delta int)
returns dhikr_logs language sql as $$
  insert into dhikr_logs (user_id, date, dhikr_type, count)
  values (p_user_id, p_date, p_type, p_delta)
  on conflict (user_id, date, dhikr_type)
  do update set count = dhikr_logs.count + excluded.count, updated_at = now()
  returning *;
$$;

create table ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references ai_conversations(id) on delete cascade,
  role text check (role in ('user','assistant','system')) not null,
  content text not null,
  created_at timestamptz default now()
);

create table ai_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  insight_type text not null,
  title text not null,
  body text not null,
  generated_at timestamptz default now(),
  is_read boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- 6. Row Level Security
-- ============================================================

alter table profiles enable row level security;
create policy "owner_full_access" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);

alter table user_goals enable row level security;
create policy "owner_full_access" on user_goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table goals enable row level security;
create policy "owner_full_access" on goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table sleep_logs enable row level security;
create policy "owner_full_access" on sleep_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table food_entries enable row level security;
create policy "owner_full_access" on food_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table water_logs enable row level security;
create policy "owner_full_access" on water_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table weight_logs enable row level security;
create policy "owner_full_access" on weight_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table steps_logs enable row level security;
create policy "owner_full_access" on steps_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table user_program_enrollments enable row level security;
create policy "owner_full_access" on user_program_enrollments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table workout_sessions enable row level security;
create policy "owner_full_access" on workout_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table logged_sets enable row level security;
create policy "owner_via_session" on logged_sets for all
  using (exists (select 1 from workout_sessions s where s.id = logged_sets.session_id and s.user_id = auth.uid()))
  with check (exists (select 1 from workout_sessions s where s.id = logged_sets.session_id and s.user_id = auth.uid()));

alter table one_rep_max_logs enable row level security;
create policy "owner_full_access" on one_rep_max_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table salah_logs enable row level security;
create policy "owner_full_access" on salah_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table prayer_times_cache enable row level security;
create policy "owner_full_access" on prayer_times_cache for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table iqama_settings enable row level security;
create policy "owner_full_access" on iqama_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table books enable row level security;
create policy "owner_full_access" on books for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table calendar_events enable row level security;
create policy "owner_full_access" on calendar_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table planner_tasks enable row level security;
create policy "owner_full_access" on planner_tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table journal_entries enable row level security;
create policy "owner_full_access" on journal_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table dhikr_logs enable row level security;
create policy "owner_full_access" on dhikr_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table ai_conversations enable row level security;
create policy "owner_full_access" on ai_conversations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table ai_messages enable row level security;
create policy "owner_via_conversation" on ai_messages for all
  using (exists (select 1 from ai_conversations c where c.id = ai_messages.conversation_id and c.user_id = auth.uid()))
  with check (exists (select 1 from ai_conversations c where c.id = ai_messages.conversation_id and c.user_id = auth.uid()));

alter table ai_insights enable row level security;
create policy "owner_full_access" on ai_insights for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Reference/template tables: read-only to authenticated users.
-- Writes only ever happen via the service-role import script (scripts/import-workout-program.ts),
-- which bypasses RLS entirely, so no insert/update/delete policies are defined here.
alter table workout_programs enable row level security;
create policy "authenticated_read" on workout_programs for select using (auth.role() = 'authenticated');

alter table workout_phases enable row level security;
create policy "authenticated_read" on workout_phases for select using (auth.role() = 'authenticated');

alter table workout_phase_days enable row level security;
create policy "authenticated_read" on workout_phase_days for select using (auth.role() = 'authenticated');

alter table workout_phase_exercises enable row level security;
create policy "authenticated_read" on workout_phase_exercises for select using (auth.role() = 'authenticated');

-- ============================================================
-- 7. Storage buckets
-- ============================================================

insert into storage.buckets (id, name, public) values ('book-covers', 'book-covers', false)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('progress-photos', 'progress-photos', false)
  on conflict (id) do nothing;

create policy "owner_storage_book_covers" on storage.objects for all
  using (bucket_id = 'book-covers' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'book-covers' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "owner_storage_progress_photos" on storage.objects for all
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);
