-- The Planner feature is now called Actions, split into three
-- time-of-day sections (morning/evening/night) instead of one flat list.
alter table planner_tasks rename to action_tasks;
alter index planner_tasks_user_date_idx rename to action_tasks_user_date_idx;

alter table action_tasks
  add column time_of_day text not null default 'morning'
    check (time_of_day in ('morning', 'evening', 'night'));
