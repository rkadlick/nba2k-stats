-- Add a real public/private name split for players, and lock down direct
-- access to the raw players/awards/player_game_stats tables so anonymous
-- visitors can only reach data through the *_public views.
-- Run in Supabase SQL Editor after create_database.sql.

-- ============================================================
-- STEP 1: Add public_name and backfill
-- ============================================================
alter table players add column if not exists public_name text;

-- Backfill however you'd like real players to appear when logged out, e.g.:
-- update players set public_name = 'Jim Simms' where id = 'player-1';
-- update players set public_name = 'Phil Nantz' where id = 'player-2';

-- ============================================================
-- STEP 2: Recreate players_public to expose public_name as player_name
-- ============================================================
create or replace view players_public as
select
  id,
  user_id,
  game_version,
  public_name as player_name,
  position,
  height,
  weight,
  archetype,
  team_id,
  created_at,
  updated_at
from players;

-- ============================================================
-- STEP 3: Lock down raw-table SELECT to authenticated users only.
-- The *_public views keep working for anon since Postgres views run with
-- their owner's privileges by default, independent of the base table's RLS.
-- ============================================================
drop policy if exists "Public can read players" on players;
create policy "Authenticated users can read players"
  on players for select
  to authenticated
  using (true);

drop policy if exists "Awards are viewable by everyone" on awards;
create policy "Authenticated users can read awards"
  on awards for select
  to authenticated
  using (true);

-- player_game_stats select policy was already locked down previously
-- ("Authenticated can view player game stats", to authenticated); no change here.

-- ============================================================
-- STEP 4: Redact winner_player_name in awards_public when the winner is a
-- tracked league player, matched by base ID (winner_player_id may predate
-- game-version-suffixed player IDs).
--
-- NOTE: this version includes winner_team_name, matching create_database.sql
-- and the dev database. Prod's awards_public intentionally omits
-- winner_team_name (dropped there separately, prior to this migration) —
-- running this exact statement against prod will fail with "cannot
-- drop/reorder columns from view" unless winner_team_name is removed first.
-- ============================================================
create or replace view awards_public as
select
  a.id,
  a.player_id,
  a.season_id,
  a.award_name,
  a.winner_player_id,
  coalesce(wp.player_name, a.winner_player_name) as winner_player_name,
  a.winner_team_id,
  a.winner_team_name,
  a.is_league_award,
  a.allstar_starter,
  a.created_at,
  a.updated_at
from awards a
inner join players_public p on p.id = a.player_id
left join players_public wp
  on regexp_replace(wp.id, '-2k\d+$', '') = regexp_replace(a.winner_player_id, '-2k\d+$', '');
