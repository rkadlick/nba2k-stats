-- Fix duplicate awards in awards_public: the winner lookup joined
-- players_public on base ID (regexp_replace(id, '-2k\d+$', '')) with a plain
-- equality LEFT JOIN. Since add_game_version.sql gives most players two rows
-- (old unsuffixed ID + new -2k26 ID) sharing the same base ID, that join
-- matched multiple player rows per award and fanned out each award into
-- duplicate rows. Switched to a LATERAL join capped at 1 row, preferring an
-- exact ID match and falling back deterministically to the base-ID match.
-- Run in Supabase SQL Editor.
--
-- NOTE: if your awards_public view does not include winner_team_name (some
-- prod deployments dropped it separately), remove that column from both the
-- select list and keep the rest unchanged.

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
left join lateral (
  select pp.player_name
  from players_public pp
  where regexp_replace(pp.id, '-2k\d+$', '') = regexp_replace(a.winner_player_id, '-2k\d+$', '')
  order by (pp.id = a.winner_player_id) desc, pp.id desc
  limit 1
) wp on true;
