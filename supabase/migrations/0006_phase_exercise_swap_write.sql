-- workout_phase_exercises only had a select policy, so swapping an exercise
-- (an update) was silently blocked by RLS. This table is shared program
-- data rather than per-user, matching the existing authenticated_read
-- policies on its sibling tables, so any authenticated user can update it.
create policy "authenticated_update" on workout_phase_exercises
  for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
