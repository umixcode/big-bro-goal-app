-- Journal becomes a single daily photo instead of a free-text prompt: one
-- capture per calendar day, enforced here (not just in the app) via a
-- unique index on (user, date). Written idempotently since an earlier
-- failed attempt may have partially applied.
alter table journal_entries
  add column if not exists photo_path text;

alter table journal_entries
  drop column if exists content,
  drop column if exists mood_score;

-- A plain `entry_at::date` cast depends on the session's TimeZone setting
-- (STABLE, not IMMUTABLE), so Postgres rejects it in an index expression.
-- Normalizing to UTC explicitly makes the result independent of session
-- settings, which is what lets this be marked IMMUTABLE for indexing.
create or replace function journal_entry_date(ts timestamptz) returns date
  language sql immutable as $$
    select (ts at time zone 'UTC')::date;
  $$;

drop index if exists journal_entries_user_date_idx;
create unique index journal_entries_user_date_idx on journal_entries (user_id, journal_entry_date(entry_at));

-- Private bucket — photos are only ever readable via a signed URL requested
-- by their owner.
insert into storage.buckets (id, name, public)
values ('journal-photos', 'journal-photos', false)
on conflict (id) do nothing;

drop policy if exists "owner_select" on storage.objects;
create policy "owner_select" on storage.objects for select
  using (bucket_id = 'journal-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "owner_insert" on storage.objects;
create policy "owner_insert" on storage.objects for insert
  with check (bucket_id = 'journal-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "owner_delete" on storage.objects;
create policy "owner_delete" on storage.objects for delete
  using (bucket_id = 'journal-photos' and (storage.foldername(name))[1] = auth.uid()::text);
