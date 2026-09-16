-- رحلتنا V2.6: تكرار خطوات الأهداف يوميًا + تحسين جدولة العادات
-- الهدف: السماح لهدف مدته شهر/فترة أن يحتوي على خطوات تتكرر كل يوم،
-- مع تسجيل إنجاز كل خطوة لكل يوم بشكل مستقل.

alter table public.goals
  add column if not exists steps_repeat_daily boolean not null default true;

create table if not exists public.goal_step_logs(
  id uuid primary key default gen_random_uuid(),
  milestone_id uuid not null references public.milestones(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  log_date date not null,
  completed boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(milestone_id, log_date)
);

create index if not exists goal_step_logs_user_date_idx
  on public.goal_step_logs(user_id, log_date);

create index if not exists goal_step_logs_goal_date_idx
  on public.goal_step_logs(goal_id, log_date);

alter table public.goal_step_logs enable row level security;

drop policy if exists goal_step_logs_select on public.goal_step_logs;
create policy goal_step_logs_select
  on public.goal_step_logs
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists goal_step_logs_insert on public.goal_step_logs;
create policy goal_step_logs_insert
  on public.goal_step_logs
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.milestones m
      join public.goals g on g.id = m.goal_id
      where m.id = goal_step_logs.milestone_id
        and m.goal_id = goal_step_logs.goal_id
        and m.user_id = auth.uid()
        and g.user_id = auth.uid()
    )
  );

drop policy if exists goal_step_logs_update on public.goal_step_logs;
create policy goal_step_logs_update
  on public.goal_step_logs
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists goal_step_logs_delete on public.goal_step_logs;
create policy goal_step_logs_delete
  on public.goal_step_logs
  for delete to authenticated
  using (user_id = auth.uid());

grant select, insert, update, delete on public.goal_step_logs to authenticated;

-- existing goals become daily-step goals by default.
update public.goals set steps_repeat_daily = true where steps_repeat_daily is null;

-- Keep PostgREST aware of the new table/column immediately.
notify pgrst, 'reload schema';
