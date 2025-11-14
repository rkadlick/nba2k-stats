-- 2KCompare Database Schema v2 - Complete Redesign
-- Run this AFTER migrate_to_text_ids.sql if you have existing data
-- Or use this as the base schema for new installations

-- Users table (Supabase Auth handles auth.users, this is for app-specific user data)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  display_name text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Teams table
create table if not exists teams (
  id text primary key,
  name text not null,
  primary_color text,
  secondary_color text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Seasons table
create table if not exists seasons (
  id text primary key,
  year_start int not null,
  year_end int not null,
  champion_team_id text references teams(id),
  champion_player_id text, -- Finals MVP (references players(id) - added after players table)
  playoff_tree jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Players table
create table if not exists players (
  id text primary key,
  user_id uuid references users(id) not null,
  player_name text not null,
  position text,
  height int,
  weight int,
  archetype text,
  team_id text references teams(id),
  career_highs jsonb, -- Manual input: {points: 52, rebounds: 15, etc.}
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Player Game Stats table (detailed individual game stats)
create table if not exists player_game_stats (
  id uuid primary key default gen_random_uuid(),
  player_id text references players(id) not null,
  season_id text references seasons(id) not null,
  game_date date not null, -- Date played (in-game date)
  opponent_team_id text references teams(id),
  opponent_team_name text, -- For teams not in DB
  is_home boolean not null default true,
  is_win boolean not null,
  player_score int not null,
  opponent_score int not null,
  is_key_game boolean default false,
  is_playoff_game boolean default false,
  playoff_series_id text, -- Links to playoff series
  playoff_game_number int, -- e.g., Game 3 of second round
  -- Stat fields
  minutes numeric(4,1), -- e.g., 36.5
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
  -- Metadata
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Season Totals table (for seasons with full game data OR manual input for past seasons)
create table if not exists season_totals (
  id uuid primary key default gen_random_uuid(),
  player_id text references players(id) not null,
  season_id text references seasons(id) not null,
  is_manual_entry boolean default false, -- true = manually entered, false = calculated from games
  -- Games
  games_played int not null default 0,
  games_started int default 0,
  -- Totals
  total_points int default 0,
  total_rebounds int default 0,
  total_assists int default 0,
  total_steals int default 0,
  total_blocks int default 0,
  total_turnovers int default 0,
  total_minutes numeric(6,1) default 0,
  total_fouls int default 0,
  total_plus_minus int default 0,
  total_fg_made int default 0,
  total_fg_attempted int default 0,
  total_threes_made int default 0,
  total_threes_attempted int default 0,
  total_ft_made int default 0,
  total_ft_attempted int default 0,
  -- Per game averages (calculated or manual)
  avg_points numeric(5,2),
  avg_rebounds numeric(5,2),
  avg_assists numeric(5,2),
  avg_steals numeric(4,2),
  avg_blocks numeric(4,2),
  avg_turnovers numeric(4,2),
  avg_minutes numeric(4,1),
  avg_fouls numeric(4,2),
  avg_plus_minus numeric(5,2),
  -- Percentages
  fg_percentage numeric(5,3), -- e.g., 0.452
  ft_percentage numeric(5,3),
  three_pt_percentage numeric(5,3),
  -- Special achievements
  double_doubles int default 0,
  triple_doubles int default 0,
  -- Metadata
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(player_id, season_id)
);

-- Awards table (can include awards player won OR didn't win)
create table if not exists awards (
  id uuid primary key default gen_random_uuid(),
  season_id text references seasons(id) not null,
  award_name text not null, -- e.g., "MVP", "Finals MVP", "DPOY", etc.
  winner_player_id text references players(id), -- Player who won (if tracked)
  winner_player_name text, -- Name if player not in DB
  winner_team_id text references teams(id), -- Team of winner
  winner_team_name text, -- Team name if not in DB
  is_league_award boolean default true, -- true = league award, false = player-specific
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Player Awards table (links players to awards - for tracking which awards player won)
create table if not exists player_awards (
  id uuid primary key default gen_random_uuid(),
  player_id text references players(id) not null,
  award_id uuid references awards(id) not null,
  season_id text references seasons(id) not null,
  created_at timestamp with time zone default now(),
  unique(player_id, award_id)
);

-- Playoff Series table (structure for playoff brackets)
create table if not exists playoff_series (
  id text primary key, -- e.g., 'series-2024-25-round1-lakers-warriors'
  season_id text references seasons(id) not null,
  round_name text not null, -- e.g., 'Round 1', 'Conference Finals', 'Finals'
  round_number int not null, -- 1, 2, 3, 4 (for ordering)
  team1_id text references teams(id),
  team1_name text, -- If team not in DB
  team2_id text references teams(id),
  team2_name text, -- If team not in DB
  team1_wins int default 0,
  team2_wins int default 0,
  winner_team_id text references teams(id),
  winner_team_name text,
  is_complete boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create indexes for better query performance
create index if not exists idx_player_game_stats_player_id on player_game_stats(player_id);
create index if not exists idx_player_game_stats_season_id on player_game_stats(season_id);
create index if not exists idx_player_game_stats_playoff_series on player_game_stats(playoff_series_id);
create index if not exists idx_season_totals_player_id on season_totals(player_id);
create index if not exists idx_season_totals_season_id on season_totals(season_id);
create index if not exists idx_players_user_id on players(user_id);
create index if not exists idx_awards_season_id on awards(season_id);
create index if not exists idx_player_awards_player_id on player_awards(player_id);
create index if not exists idx_player_awards_season_id on player_awards(season_id);
create index if not exists idx_playoff_series_season_id on playoff_series(season_id);

-- Create function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add triggers for updated_at
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

-- Add foreign key constraint for champion_player_id after players table exists
alter table seasons add constraint if not exists seasons_champion_player_id_fkey 
  foreign key (champion_player_id) references players(id);

