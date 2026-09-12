-- Habit + message delete permissions for the existing database.
-- Run this after 001_init.sql (or on your already-created Supabase database).

-- Users can delete only the encouragement messages they sent.
drop policy if exists encouragements_delete on public.encouragements;
create policy encouragements_delete
on public.encouragements for delete to authenticated
using (sender_id = auth.uid());

-- Grants are already present in 001_init.sql, but this keeps the migration safe on older databases.
grant delete on public.encouragements to authenticated;
