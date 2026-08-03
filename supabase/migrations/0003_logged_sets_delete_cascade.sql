-- Undoing a logged set should also remove any 1RM record that was derived
-- from it, rather than failing on the foreign key or leaving a dangling PR.
alter table one_rep_max_logs
  drop constraint if exists one_rep_max_logs_source_set_id_fkey;

alter table one_rep_max_logs
  add constraint one_rep_max_logs_source_set_id_fkey
  foreign key (source_set_id) references logged_sets(id) on delete cascade;
