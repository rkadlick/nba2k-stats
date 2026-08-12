-- Fix ai_generation_logs SELECT policy: it was scoped to the requesting user's
-- own player_id, so the /logs page only ever showed each user's own generation
-- logs instead of all logs across users.
-- Run in Supabase SQL Editor.

drop policy if exists "Users can view own generation logs" on ai_generation_logs;

create policy "Authenticated users can view generation logs"
  on ai_generation_logs for select
  to authenticated
  using (true);
