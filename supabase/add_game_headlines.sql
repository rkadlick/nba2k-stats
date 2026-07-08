-- Add AI-generated headline columns to player_game_stats
-- Run in Supabase SQL Editor after create_database.sql

alter table player_game_stats
  add column if not exists headline text,
  add column if not exists headline_generated_at timestamptz,
  add column if not exists headline_status text default 'pending'
    check (headline_status in ('pending', 'ready', 'failed', 'skipped'));
