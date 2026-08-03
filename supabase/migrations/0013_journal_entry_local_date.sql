-- 0012's uniqueness check normalized entry_at to a UTC calendar date, but
-- every other date-scoped concept in this app (workout sessions, actions)
-- uses the device's LOCAL calendar date instead. Near midnight in any
-- non-UTC timezone those two disagree, which could let a duplicate slip
-- through or wrongly block a legitimate day. Switch to a plain date column
-- set explicitly by the client (the same local date string already used
-- for the storage path), matching the rest of the app's convention, and
-- drop the now-unnecessary expression index/function.
alter table journal_entries add column if not exists entry_date date;

update journal_entries set entry_date = journal_entry_date(entry_at) where entry_date is null;

alter table journal_entries alter column entry_date set not null;

drop index if exists journal_entries_user_date_idx;
create unique index journal_entries_user_date_idx on journal_entries (user_id, entry_date);

drop function if exists journal_entry_date(timestamptz);
