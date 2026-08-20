-- ============================================
-- Migration: playoff_career_highs table + regular-season career_highs fix
--
-- Two changes:
--  1. recalc_career_highs() previously scanned ALL player_game_stats rows,
--     so a big playoff game could overwrite a player's regular-season
--     career high. It's now scoped to regular-season games only.
--  2. Adds a parallel playoff_career_highs table (same shape as
--     career_highs), computed only from playoff games, so playoff and
--     regular-season highs are tracked independently.
--
-- Run this file once against an existing Supabase project.
-- create_database.sql has been updated to include this schema for fresh
-- installs, so do not run both.
-- ============================================

-- ============================================
-- PART 1: TABLE + VIEW
-- ============================================

create table if not exists playoff_career_highs (
  id uuid primary key default gen_random_uuid(),
  player_id text references players(id) not null,
  stat_key text not null, -- matches CAREER_HIGHS_FIELDS keys (points, rebounds, ...)
  value numeric not null,
  game_id uuid references player_game_stats(id) on delete set null,
  achieved_at date,
  is_manual boolean not null default false, -- true = manually entered floor, false = computed from games
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (player_id, stat_key)
);

create index if not exists idx_playoff_career_highs_player_id on playoff_career_highs(player_id);

-- Public read view joining in the game that earned each high, for display context
create or replace view playoff_career_highs_with_game as
select
  ch.id,
  ch.player_id,
  ch.stat_key,
  ch.value,
  ch.is_manual,
  ch.game_id,
  ch.achieved_at,
  pgs.opponent_team_id,
  pgs.opponent_team_name,
  pgs.game_date,
  pgs.is_win,
  pgs.player_score,
  pgs.opponent_score
from playoff_career_highs ch
left join player_game_stats pgs on pgs.id = ch.game_id;

-- ============================================
-- PART 2: FIX regular-season recalc_career_highs, ADD playoff equivalent
-- ============================================

create or replace function recalc_career_highs(p_player_id text)
returns void as $$
declare
  stat_keys text[] := array['points', 'rebounds', 'assists', 'steals', 'blocks', 'minutes', 'fg_made', 'threes_made', 'ft_made'];
  k text;
  best_value numeric;
  best_game_id uuid;
  best_game_date date;
begin
  foreach k in array stat_keys loop
    execute format(
      'select %I, id, game_date from player_game_stats
       where player_id = $1 and coalesce(is_playoff_game, false) = false and %I is not null
       order by %I desc, game_date asc
       limit 1',
      k, k, k
    ) into best_value, best_game_id, best_game_date using p_player_id;

    if best_value is null then
      continue; -- no games recorded for this stat; leave any existing (manual) row untouched
    end if;

    insert into career_highs (player_id, stat_key, value, game_id, achieved_at, is_manual, updated_at)
    values (p_player_id, k, best_value, best_game_id, best_game_date, false, now())
    on conflict (player_id, stat_key)
    do update set
      value = excluded.value,
      game_id = excluded.game_id,
      achieved_at = excluded.achieved_at,
      is_manual = false,
      updated_at = now()
    where career_highs.is_manual = false or excluded.value >= career_highs.value;
  end loop;
end;
$$ language plpgsql;

create or replace function recalc_playoff_career_highs(p_player_id text)
returns void as $$
declare
  stat_keys text[] := array['points', 'rebounds', 'assists', 'steals', 'blocks', 'minutes', 'fg_made', 'threes_made', 'ft_made'];
  k text;
  best_value numeric;
  best_game_id uuid;
  best_game_date date;
begin
  foreach k in array stat_keys loop
    execute format(
      'select %I, id, game_date from player_game_stats
       where player_id = $1 and is_playoff_game = true and %I is not null
       order by %I desc, game_date asc
       limit 1',
      k, k, k
    ) into best_value, best_game_id, best_game_date using p_player_id;

    if best_value is null then
      continue; -- no playoff games recorded for this stat; leave any existing (manual) row untouched
    end if;

    insert into playoff_career_highs (player_id, stat_key, value, game_id, achieved_at, is_manual, updated_at)
    values (p_player_id, k, best_value, best_game_id, best_game_date, false, now())
    on conflict (player_id, stat_key)
    do update set
      value = excluded.value,
      game_id = excluded.game_id,
      achieved_at = excluded.achieved_at,
      is_manual = false,
      updated_at = now()
    where playoff_career_highs.is_manual = false or excluded.value >= playoff_career_highs.value;
  end loop;
end;
$$ language plpgsql;

create or replace function trigger_recalc_playoff_career_highs()
returns trigger as $$
begin
  if tg_op = 'DELETE' then
    perform recalc_playoff_career_highs(old.player_id);
    return old;
  else
    perform recalc_playoff_career_highs(new.player_id);
    if tg_op = 'UPDATE' and old.player_id is distinct from new.player_id then
      perform recalc_playoff_career_highs(old.player_id);
    end if;
    return new;
  end if;
end;
$$ language plpgsql;

drop trigger if exists trg_playoff_career_highs_recalc on player_game_stats;
create trigger trg_playoff_career_highs_recalc after insert or update or delete on player_game_stats
  for each row execute function trigger_recalc_playoff_career_highs();

drop trigger if exists update_playoff_career_highs_updated_at on playoff_career_highs;
create trigger update_playoff_career_highs_updated_at before update on playoff_career_highs
  for each row execute function update_updated_at_column();

-- ============================================
-- PART 3: RLS
-- ============================================

alter table playoff_career_highs enable row level security;

drop policy if exists "Public can view all playoff career highs" on playoff_career_highs;
drop policy if exists "Users can insert own playoff career highs" on playoff_career_highs;
drop policy if exists "Users can update own playoff career highs" on playoff_career_highs;
drop policy if exists "Users can delete own playoff career highs" on playoff_career_highs;

create policy "Public can view all playoff career highs"
  on playoff_career_highs for select
  using (true);

create policy "Users can insert own playoff career highs"
  on playoff_career_highs for insert
  with check (
    exists (select 1 from players where players.id = playoff_career_highs.player_id and players.user_id = auth.uid())
  );

create policy "Users can update own playoff career highs"
  on playoff_career_highs for update
  using (
    exists (select 1 from players where players.id = playoff_career_highs.player_id and players.user_id = auth.uid())
  );

create policy "Users can delete own playoff career highs"
  on playoff_career_highs for delete
  using (
    exists (select 1 from players where players.id = playoff_career_highs.player_id and players.user_id = auth.uid())
  );

-- ============================================
-- PART 4: BACKFILL
-- ============================================

-- Recompute regular-season career_highs for every player now that playoff
-- games are excluded (corrects any high currently inflated by a playoff game),
-- and populate playoff_career_highs for the first time.
do $$
declare
  p record;
begin
  for p in select id from players loop
    perform recalc_career_highs(p.id);
    perform recalc_playoff_career_highs(p.id);
  end loop;
end $$;
