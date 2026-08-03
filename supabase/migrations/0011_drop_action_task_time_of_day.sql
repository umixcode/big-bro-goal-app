-- Actions are back to a single flat list — no more morning/evening/night split.
alter table action_tasks drop column time_of_day;
