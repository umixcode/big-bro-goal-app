-- Tracks whether a set was logged via "hit it" or "miss" so the UI can
-- distinguish an explicit miss from a hit that merely came in below target.
alter table logged_sets
  add column if not exists is_miss boolean not null default false;
