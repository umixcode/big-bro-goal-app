-- Remembers the originally-prescribed exercise for a slot once it's been
-- swapped, so the user can swap back to it later. Null means "never swapped".
alter table workout_phase_exercises
  add column if not exists original_exercise_name text;
