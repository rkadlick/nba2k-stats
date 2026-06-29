-- Migration: add game_version support for multiple NBA 2K editions per user
-- Run in Supabase SQL Editor. Safe to re-run.

-- ============================================================
-- STEP 1: Add game_version column
-- ============================================================
alter table players
  add column if not exists game_version text not null default '2k25';

-- ============================================================
-- STEP 2: One MyPlayer per user per game edition
-- (drop first so re-runs don't fail)
-- ============================================================
alter table players drop constraint if exists players_user_game_version_unique;

alter table players
  add constraint players_user_game_version_unique unique (user_id, game_version);

-- ============================================================
-- STEP 3: Create 2K26 player rows
-- ============================================================
insert into players (id, user_id, game_version, player_name, position, height, weight, archetype, team_id, career_highs)
select
  p.id || '-2k26',
  p.user_id,
  '2k26',
  p.player_name,
  p.position,
  p.height,
  p.weight,
  p.archetype,
  p.team_id,
  p.career_highs
from players p
where p.game_version = '2k25'
on conflict (id) do nothing;

-- ============================================================
-- STEP 4: Recreate public views
-- awards_public depends on players_public — drop it first.
-- Optional: run this first and save the result as a backup:
--   select pg_get_viewdef('public.awards_public'::regclass, true);
-- ============================================================
drop view if exists public.awards_public;
drop view if exists public.players_public;

create view public.players_public as
select
  id,
  user_id,
  game_version,
  player_name,
  position,
  height,
  weight,
  archetype,
  team_id,
  career_highs,
  created_at,
  updated_at
from players;

create view public.awards_public as
select
  a.id,
  a.player_id,
  a.season_id,
  a.award_name,
  a.winner_player_id,
  a.winner_player_name,
  a.winner_team_id,
  a.winner_team_name,
  a.is_league_award,
  a.allstar_starter,
  a.created_at,
  a.updated_at
from awards a
inner join players_public p on p.id = a.player_id;
