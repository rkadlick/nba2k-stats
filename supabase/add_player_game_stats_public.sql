-- Public read-only view for player_game_stats (anon / logged-out users)
-- Headlines on the base table use public player names only.
-- Use security_invoker = false so anon can read without a base-table SELECT policy.
-- Run in Supabase SQL Editor after add_game_headlines.sql

drop view if exists public.player_game_stats_public;

create view public.player_game_stats_public
with (security_invoker = false)
as
select
  id,
  player_id,
  season_id,
  game_date,
  opponent_team_id,
  opponent_team_name,
  is_home,
  is_win,
  player_score,
  opponent_score,
  is_key_game,
  is_playoff_game,
  playoff_series_id,
  playoff_game_number,
  minutes,
  points,
  rebounds,
  offensive_rebounds,
  assists,
  steals,
  blocks,
  turnovers,
  fouls,
  plus_minus,
  fg_made,
  fg_attempted,
  threes_made,
  threes_attempted,
  ft_made,
  ft_attempted,
  is_overtime,
  is_simulated,
  is_cup_game,
  headline,
  headline_generated_at,
  headline_status,
  created_at,
  updated_at
from player_game_stats;

grant select on public.player_game_stats_public to anon, authenticated;
