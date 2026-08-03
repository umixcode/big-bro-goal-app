-- Extends steps_logs with the rest of Apple Health's daily activity signals
-- so the dedicated Steps page can show real distance/floors/active time/
-- calories instead of just a step count.
alter table steps_logs
  add column if not exists distance_m numeric,
  add column if not exists floors_climbed int,
  add column if not exists active_minutes int,
  add column if not exists active_calories numeric;
