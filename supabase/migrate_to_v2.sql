-- Migration: Upgrade from v1 schema to v2 schema
-- Run this if you have existing data from the old schema
-- This migrates data to the new structure

-- Step 1: Add new columns to existing tables
alter table users add column if not exists updated_at timestamp with time zone default now();
alter table teams add column if not exists updated_at timestamp with time zone default now();
alter table seasons add column if not exists updated_at timestamp with time zone default now();
alter table seasons add column if not exists champion_player_id text references players(id);
alter table players add column if not exists updated_at timestamp with time zone default now();

-- Step 2: Create new tables
create table if not exists player_game_stats (
  id uuid primary key default gen_random_uuid(),
  player_id text references players(id) not null,
  season_id text references seasons(id) not null,
  game_date date not null,
  opponent_team_id text references teams(id),
  opponent_team_name text,
  is_home boolean not null default true,
  is_win boolean not null,
  player_score int not null,
  opponent_score int not null,
  is_key_game boolean default false,
  is_playoff_game boolean default false,
  playoff_series_id text,
  playoff_game_number int,
  minutes numeric(4,1),
  points int,
  rebounds int,
  offensive_rebounds int,
  assists int,
  steals int,
  blocks int,
  turnovers int,
  fouls int,
  plus_minus int,
  fg_made int,
  fg_attempted int,
  threes_made int,
  threes_attempted int,
  ft_made int,
  ft_attempted int,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Migrate old player_stats to new player_game_stats
insert into player_game_stats (
  player_id,
  season_id,
  game_date,
  opponent_team_id,
  opponent_team_name,
  is_home,
  is_win,
  player_score,
  opponent_score,
  is_playoff_game,
  playoff_series_id,
  points,
  rebounds,
  assists,
  steals,
  blocks,
  turnovers,
  minutes,
  fg_made,
  fg_attempted,
  threes_made,
  threes_attempted,
  created_at
)
select 
  player_id,
  season_id,
  created_at::date as game_date,
  opponent_team_id,
  opponent_team_name,
  is_home,
  false as is_win, -- Default, will need manual update
  0 as player_score, -- Default, will need manual update
  0 as opponent_score, -- Default, will need manual update
  coalesce(is_playoff_game, false),
  playoff_series_id,
  (stats->>'points')::int,
  (stats->>'rebounds')::int,
  (stats->>'assists')::int,
  (stats->>'steals')::int,
  (stats->>'blocks')::int,
  (stats->>'turnovers')::int,
  (stats->>'minutes')::numeric,
  (stats->>'fg_made')::int,
  (stats->>'fg_attempted')::int,
  (stats->>'threes_made')::int,
  (stats->>'threes_attempted')::int,
  created_at
from player_stats
where stats is not null;

-- Step 3: Update season_totals table structure
alter table season_totals add column if not exists is_manual_entry boolean default false;
alter table season_totals add column if not exists games_started int default 0;
alter table season_totals add column if not exists total_points int default 0;
alter table season_totals add column if not exists total_rebounds int default 0;
alter table season_totals add column if not exists total_assists int default 0;
alter table season_totals add column if not exists total_steals int default 0;
alter table season_totals add column if not exists total_blocks int default 0;
alter table season_totals add column if not exists total_turnovers int default 0;
alter table season_totals add column if not exists total_minutes numeric(6,1) default 0;
alter table season_totals add column if not exists total_fouls int default 0;
alter table season_totals add column if not exists total_plus_minus int default 0;
alter table season_totals add column if not exists total_fg_made int default 0;
alter table season_totals add column if not exists total_fg_attempted int default 0;
alter table season_totals add column if not exists total_threes_made int default 0;
alter table season_totals add column if not exists total_threes_attempted int default 0;
alter table season_totals add column if not exists total_ft_made int default 0;
alter table season_totals add column if not exists total_ft_attempted int default 0;
alter table season_totals add column if not exists avg_points numeric(5,2);
alter table season_totals add column if not exists avg_rebounds numeric(5,2);
alter table season_totals add column if not exists avg_assists numeric(5,2);
alter table season_totals add column if not exists avg_steals numeric(4,2);
alter table season_totals add column if not exists avg_blocks numeric(4,2);
alter table season_totals add column if not exists avg_turnovers numeric(4,2);
alter table season_totals add column if not exists avg_minutes numeric(4,1);
alter table season_totals add column if not exists avg_fouls numeric(4,2);
alter table season_totals add column if not exists avg_plus_minus numeric(5,2);
alter table season_totals add column if not exists fg_percentage numeric(5,3);
alter table season_totals add column if not exists ft_percentage numeric(5,3);
alter table season_totals add column if not exists three_pt_percentage numeric(5,3);
alter table season_totals add column if not exists double_doubles int default 0;
alter table season_totals add column if not exists triple_doubles int default 0;
alter table season_totals add column if not exists updated_at timestamp with time zone default now();

-- Migrate old stats JSON to new columns
update season_totals set
  total_points = coalesce((stats->>'points')::int, 0),
  total_rebounds = coalesce((stats->>'rebounds')::int, 0),
  total_assists = coalesce((stats->>'assists')::int, 0),
  total_steals = coalesce((stats->>'steals')::int, 0),
  total_blocks = coalesce((stats->>'blocks')::int, 0),
  total_turnovers = coalesce((stats->>'turnovers')::int, 0),
  total_minutes = coalesce((stats->>'minutes')::numeric, 0),
  games_played = coalesce(games_played, 0)
where stats is not null;

-- Step 4: Create new awards tables
create table if not exists awards (
  id uuid primary key default gen_random_uuid(),
  season_id text references seasons(id) not null,
  award_name text not null,
  winner_player_id text references players(id),
  winner_player_name text,
  winner_team_id text references teams(id),
  winner_team_name text,
  is_league_award boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists player_awards (
  id uuid primary key default gen_random_uuid(),
  player_id text references players(id) not null,
  award_id uuid references awards(id) not null,
  season_id text references seasons(id) not null,
  created_at timestamp with time zone default now(),
  unique(player_id, award_id)
);

-- Migrate old season_awards to new structure
insert into awards (season_id, award_name, winner_player_id, is_league_award, created_at)
select distinct
  season_id,
  award_name,
  player_id as winner_player_id,
  true as is_league_award,
  created_at
from season_awards;

-- Link players to awards
insert into player_awards (player_id, award_id, season_id, created_at)
select 
  sa.player_id,
  a.id as award_id,
  sa.season_id,
  sa.created_at
from season_awards sa
join awards a on a.season_id = sa.season_id and a.award_name = sa.award_name and a.winner_player_id = sa.player_id;

-- Step 5: Create playoff_series table
create table if not exists playoff_series (
  id text primary key,
  season_id text references seasons(id) not null,
  round_name text not null,
  round_number int not null,
  team1_id text references teams(id),
  team1_name text,
  team2_id text references teams(id),
  team2_name text,
  team1_wins int default 0,
  team2_wins int default 0,
  winner_team_id text references teams(id),
  winner_team_name text,
  is_complete boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Step 6: Add indexes
create index if not exists idx_player_game_stats_player_id on player_game_stats(player_id);
create index if not exists idx_player_game_stats_season_id on player_game_stats(season_id);
create index if not exists idx_player_game_stats_playoff_series on player_game_stats(playoff_series_id);
create index if not exists idx_awards_season_id on awards(season_id);
create index if not exists idx_player_awards_player_id on player_awards(player_id);
create index if not exists idx_player_awards_season_id on player_awards(season_id);
create index if not exists idx_playoff_series_season_id on playoff_series(season_id);

-- Step 7: Create updated_at trigger function and triggers
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_users_updated_at before update on users
  for each row execute function update_updated_at_column();

create trigger update_teams_updated_at before update on teams
  for each row execute function update_updated_at_column();

create trigger update_seasons_updated_at before update on seasons
  for each row execute function update_updated_at_column();

create trigger update_players_updated_at before update on players
  for each row execute function update_updated_at_column();

create trigger update_player_game_stats_updated_at before update on player_game_stats
  for each row execute function update_updated_at_column();

create trigger update_season_totals_updated_at before update on season_totals
  for each row execute function update_updated_at_column();

create trigger update_awards_updated_at before update on awards
  for each row execute function update_updated_at_column();

create trigger update_playoff_series_updated_at before update on playoff_series
  for each row execute function update_updated_at_column();

-- Step 8: Add unique constraint to season_totals
alter table season_totals add constraint season_totals_player_season_unique unique(player_id, season_id);

-- Note: Old player_stats and season_awards tables are kept for reference
-- You can drop them later after verifying migration:
-- drop table if exists player_stats;
-- drop table if exists season_awards;

