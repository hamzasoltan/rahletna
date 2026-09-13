-- رحلتنا V2.1: أهداف وعادات وسجل متقدم
alter table public.goals add column if not exists start_date date;
alter table public.habits add column if not exists days_of_week int[] not null default '{0,1,2,3,4,5,6}';

create table if not exists public.milestones(
 id uuid primary key default gen_random_uuid(),
 goal_id uuid not null references public.goals(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 title text not null,
 completed boolean not null default false,
 position int not null default 0,
 created_at timestamptz not null default now()
);
create index if not exists milestones_goal_idx on public.milestones(goal_id,position);
alter table public.milestones enable row level security;
drop policy if exists milestones_all on public.milestones;
create policy milestones_all on public.milestones for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
grant select,insert,update,delete on public.milestones to authenticated;

-- Allow habits to be created/updated with the new scheduling data.

drop policy if exists encouragements_delete on public.encouragements;
create policy encouragements_delete on public.encouragements for delete to authenticated using(sender_id=auth.uid());
