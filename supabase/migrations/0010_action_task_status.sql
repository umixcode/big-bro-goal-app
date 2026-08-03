-- Replaces the plain is_completed/completed_at boolean with a bullet-journal
-- style status: completed, partially completed, migrated, scheduled,
-- cancelled, priority, event, or note. Null means "open" (not yet marked).
alter table action_tasks
  add column status text
    check (status in (
      'completed', 'partially_completed', 'migrated', 'scheduled',
      'cancelled', 'priority', 'event', 'note'
    ));

update action_tasks set status = 'completed' where is_completed = true;

alter table action_tasks
  drop column is_completed,
  drop column completed_at;
