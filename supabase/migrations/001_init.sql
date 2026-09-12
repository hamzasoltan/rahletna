-- رحلتنا: production-oriented Supabase schema
create extension if not exists pgcrypto;
create type public.task_status as enum ('pending','in_progress','completed','skipped');
create type public.task_priority as enum ('low','medium','high');
create type public.connection_status as enum ('pending','connected','revoked');
create type public.goal_status as enum ('active','completed','paused');

create table public.profiles(id uuid primary key references auth.users(id) on delete cascade,display_name text not null default '',avatar_url text,bio text,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.connections(id uuid primary key default gen_random_uuid(),requester_id uuid not null references public.profiles(id) on delete cascade,recipient_id uuid references public.profiles(id) on delete cascade,invite_code text not null unique,status public.connection_status not null default 'pending',created_at timestamptz not null default now(),updated_at timestamptz not null default now(),constraint no_self_connection check (recipient_id is null or requester_id<>recipient_id));
create unique index one_active_connection_per_user on public.connections(requester_id) where status in ('pending','connected');
create table public.goals(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,title text not null,description text,target_date date,status public.goal_status not null default 'active',created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.tasks(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,title text not null,description text,task_date date not null,due_time time,status public.task_status not null default 'pending',category text not null default 'عام',priority public.task_priority not null default 'medium',goal_id uuid references public.goals(id) on delete set null,completed_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create index tasks_user_date_idx on public.tasks(user_id,task_date);
create table public.habits(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,goal_id uuid references public.goals(id) on delete set null,title text not null,frequency text not null default 'يومي',target_per_week int not null default 7,active boolean not null default true,created_at timestamptz not null default now());
create table public.habit_logs(id uuid primary key default gen_random_uuid(),habit_id uuid not null references public.habits(id) on delete cascade,user_id uuid not null references public.profiles(id) on delete cascade,log_date date not null,completed boolean not null default true,unique(habit_id,log_date));
create table public.encouragements(id uuid primary key default gen_random_uuid(),sender_id uuid not null references public.profiles(id) on delete cascade,recipient_id uuid not null references public.profiles(id) on delete cascade,message text not null check(length(trim(message)) between 1 and 500),created_at timestamptz not null default now());

create or replace function public.is_connected_to(target uuid) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.connections c where c.status='connected' and ((c.requester_id=auth.uid() and c.recipient_id=target) or (c.recipient_id=auth.uid() and c.requester_id=target))); $$;
create or replace function public.accept_invite(p_invite_code text) returns public.connections language plpgsql security definer set search_path='' as $$ declare c public.connections; me uuid:=auth.uid(); begin if me is null then raise exception 'not authenticated'; end if; select * into c from public.connections where invite_code=upper(trim(p_invite_code)) and status='pending' for update; if c.id is null then raise exception 'invite not found'; end if; if c.requester_id=me then raise exception 'cannot join your own invite'; end if; if c.recipient_id is not null then raise exception 'invite already used'; end if; update public.connections set recipient_id=me,status='connected',updated_at=now() where id=c.id returning * into c; return c; end; $$;
revoke execute on function public.accept_invite(text) from public; grant execute on function public.accept_invite(text) to authenticated;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$ begin insert into public.profiles(id,display_name) values(new.id,coalesce(new.raw_user_meta_data->>'display_name','')); return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;alter table public.connections enable row level security;alter table public.goals enable row level security;alter table public.tasks enable row level security;alter table public.habits enable row level security;alter table public.habit_logs enable row level security;alter table public.encouragements enable row level security;
create policy profiles_select on public.profiles for select to authenticated using (id=auth.uid() or public.is_connected_to(id));
create policy profiles_insert on public.profiles for insert to authenticated with check(id=auth.uid());
create policy profiles_update on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy connections_select on public.connections for select to authenticated using(requester_id=auth.uid() or recipient_id=auth.uid());
create policy connections_insert on public.connections for insert to authenticated with check(requester_id=auth.uid() and recipient_id is null);
create policy goals_all on public.goals for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy tasks_select on public.tasks for select to authenticated using(user_id=auth.uid() or public.is_connected_to(user_id));
create policy tasks_insert on public.tasks for insert to authenticated with check(user_id=auth.uid());
create policy tasks_update on public.tasks for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy tasks_delete on public.tasks for delete to authenticated using(user_id=auth.uid());
create policy habits_all on public.habits for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy habit_logs_all on public.habit_logs for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy encouragements_select on public.encouragements for select to authenticated using(sender_id=auth.uid() or recipient_id=auth.uid());
create policy encouragements_insert on public.encouragements for insert to authenticated with check(sender_id=auth.uid() and public.is_connected_to(recipient_id));

revoke all on all tables in schema public from anon;grant select,insert,update,delete on public.profiles,public.connections,public.goals,public.tasks,public.habits,public.habit_logs,public.encouragements to authenticated;


-- ============================================
-- PROFILE AVATARS STORAGE
-- ============================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/png','image/jpeg','image/webp','image/gif'];

drop policy if exists "Avatar public read" on storage.objects;
create policy "Avatar public read"
on storage.objects for select
to public
using (bucket_id = 'avatars');

drop policy if exists "Avatar owner upload" on storage.objects;
create policy "Avatar owner upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "Avatar owner update" on storage.objects;
create policy "Avatar owner update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "Avatar owner delete" on storage.objects;
create policy "Avatar owner delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
