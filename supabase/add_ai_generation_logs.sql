-- Add AI generation logging table (prompts/responses for LLM-backed features)
-- Run in Supabase SQL Editor after create_database.sql

create table if not exists ai_generation_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  feature text not null default 'headline_generation',
  game_id uuid references player_game_stats(id) on delete set null,
  player_id text references players(id) on delete set null,
  model text,
  system_prompt text,
  user_prompt text not null,
  response_text text,
  status text not null check (status in ('success', 'fallback', 'error')),
  error_message text,
  latency_ms int
);

alter table ai_generation_logs enable row level security;

create policy "Users can view own generation logs"
  on ai_generation_logs for select
  using (
    player_id is null
    or exists (select 1 from players where players.id = ai_generation_logs.player_id and players.user_id = auth.uid())
  );

create policy "Users can insert own generation logs"
  on ai_generation_logs for insert
  with check (
    player_id is null
    or exists (select 1 from players where players.id = ai_generation_logs.player_id and players.user_id = auth.uid())
  );
