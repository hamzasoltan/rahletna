-- رحلتنا V2.6 — date safety
-- Keep task_date as a DATE, but make the database default explicitly use Egypt time.
-- This does not modify existing tasks.

ALTER TABLE public.tasks
ALTER COLUMN task_date
SET DEFAULT ((now() AT TIME ZONE 'Africa/Cairo')::date);
