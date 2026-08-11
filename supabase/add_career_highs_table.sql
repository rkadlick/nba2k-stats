-- ============================================
-- Migration: career_highs table
-- Replaces players.career_highs (manual-only jsonb) with a
-- trigger-computed table, mirroring the season_totals /
-- playoff_totals pattern (computed from player_game_stats,
-- with a manual floor for pre-tracking history).
--
-- Run this file once against an existing Supabase project.
-- create_database.sql has been updated to include this schema
-- for fresh installs, so do not run both.
-- ============================================

-- ============================================
-- PART 1: TABLE + VIEW
-- ============================================

create table if not exists career_highs (
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

create index if not exists idx_career_highs_player_id on career_highs(player_id);

-- Public read view joining in the game that earned each high, for display context
create or replace view career_highs_with_game as
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
from career_highs ch
left join player_game_stats pgs on pgs.id = ch.game_id;

-- ============================================
-- PART 2: RECALC FUNCTION + TRIGGER
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
       where player_id = $1 and %I is not null
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

create or replace function trigger_recalc_career_highs()
returns trigger as $$
begin
  if tg_op = 'DELETE' then
    perform recalc_career_highs(old.player_id);
    return old;
  else
    perform recalc_career_highs(new.player_id);
    if tg_op = 'UPDATE' and old.player_id is distinct from new.player_id then
      perform recalc_career_highs(old.player_id);
    end if;
    return new;
  end if;
end;
$$ language plpgsql;

drop trigger if exists trg_career_highs_recalc on player_game_stats;
create trigger trg_career_highs_recalc after insert or update or delete on player_game_stats
  for each row execute function trigger_recalc_career_highs();

drop trigger if exists update_career_highs_updated_at on career_highs;
create trigger update_career_highs_updated_at before update on career_highs
  for each row execute function update_updated_at_column();

-- ============================================
-- PART 3: RLS
-- ============================================

alter table career_highs enable row level security;

drop policy if exists "Public can view all career highs" on career_highs;
drop policy if exists "Users can insert own career highs" on career_highs;
drop policy if exists "Users can update own career highs" on career_highs;
drop policy if exists "Users can delete own career highs" on career_highs;

create policy "Public can view all career highs"
  on career_highs for select
  using (true);

create policy "Users can insert own career highs"
  on career_highs for insert
  with check (
    exists (select 1 from players where players.id = career_highs.player_id and players.user_id = auth.uid())
  );

create policy "Users can update own career highs"
  on career_highs for update
  using (
    exists (select 1 from players where players.id = career_highs.player_id and players.user_id = auth.uid())
  );

create policy "Users can delete own career highs"
  on career_highs for delete
  using (
    exists (select 1 from players where players.id = career_highs.player_id and players.user_id = auth.uid())
  );

-- ============================================
-- PART 4: BACKFILL + CLEANUP
-- ============================================

-- Compute initial career highs from existing game data for every player
do $$
declare
  p record;
begin
  for p in select id from players loop
    perform recalc_career_highs(p.id);
  end loop;
end $$;

-- Carry forward any manually-entered values that games haven't matched yet
insert into career_highs (player_id, stat_key, value, is_manual, updated_at)
select
  p.id,
  kv.key,
  (kv.value)::numeric,
  true,
  now()
from players p
cross join lateral jsonb_each_text(p.career_highs) as kv(key, value)
where p.career_highs is not null
  and kv.value ~ '^[0-9]+(\.[0-9]+)?$'
on conflict (player_id, stat_key) do update set
  value = excluded.value,
  is_manual = true,
  updated_at = now()
where career_highs.value < excluded.value;

-- Must redefine the view (which still selects career_highs) before the column
-- can be dropped, since a view referencing a column is a dependent object.
-- CREATE OR REPLACE VIEW can't drop a column from an existing view's column
-- list, so this has to be a real drop + recreate. awards_public depends on
-- players_public, so it gets cascade-dropped and rebuilt right after.
drop view if exists players_public cascade;

create view players_public as
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
  created_at,
  updated_at
from players;

-- Note: winner_team_name is intentionally omitted here — it doesn't exist on
-- the awards table in every environment (schema drift predating this
-- migration); winner_team_id is sufficient and already selected below.
create or replace view awards_public as
select
  a.id,
  a.player_id,
  a.season_id,
  a.award_name,
  a.winner_player_id,
  a.winner_player_name,
  a.winner_team_id,
  a.is_league_award,
  a.allstar_starter,
  a.created_at,
  a.updated_at
from awards a
inner join players_public p on p.id = a.player_id;

alter table players drop column if exists career_highs;
