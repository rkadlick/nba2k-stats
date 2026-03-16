-- ============================================
-- 2KCompare Complete Database Setup
-- Run this file in Supabase SQL Editor for a fresh install
-- ============================================

-- ============================================
-- PART 1: CREATE TABLES
-- ============================================

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
  champion_player_id text, -- Finals MVP (foreign key added after players table)
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

-- Add foreign key constraint for champion_player_id
-- Use DO block to check if constraint exists before adding
do $$
begin
  if not exists (
    select 1 from pg_constraint 
    where conname = 'seasons_champion_player_id_fkey'
  ) then
    alter table seasons add constraint seasons_champion_player_id_fkey 
      foreign key (champion_player_id) references players(id);
  end if;
end $$;

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
  -- Game type flags
  is_overtime boolean default false,
  is_simulated boolean default false,
  is_cup_game boolean default false,
  -- Metadata
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint chk_playoff_requires_series check (
    is_playoff_game = false or playoff_series_id is not null
  )
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
  total_offensive_rebounds int default 0,
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
  -- Per game averages (calculated or manual) - 1 decimal place
  avg_points numeric(5,1),
  avg_rebounds numeric(5,1),
  avg_offensive_rebounds numeric(5,1),
  avg_assists numeric(5,1),
  avg_steals numeric(4,1),
  avg_blocks numeric(4,1),
  avg_turnovers numeric(4,1),
  avg_minutes numeric(4,1),
  avg_fouls numeric(4,1),
  avg_plus_minus numeric(5,1),
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

-- Awards table (single table for all awards - user-specific and player-specific)
create table if not exists awards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) not null, -- Each user has their own awards
  player_id text references players(id), -- Links award to specific player's league (null = general league award)
  season_id text references seasons(id) not null,
  award_name text not null, -- e.g., "MVP", "Finals MVP", "DPOY", etc.
  winner_player_id text references players(id), -- Player who won (if tracked)
  winner_player_name text, -- Name if player not in DB
  winner_team_id text references teams(id), -- Team of winner
  winner_team_name text, -- Team name if not in DB
  is_league_award boolean default true, -- true = league award, false = player-specific
  allstar_starter boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Index for performance
create index if not exists idx_awards_player_id on awards(player_id);
create index if not exists idx_awards_user_id on awards(user_id);

-- Playoff Series table (structure for playoff brackets)
create table if not exists playoff_series (
  id text primary key, -- e.g., 'series-2024-25-round1-lakers-warriors'
  player_id text references players(id), -- Each player has their own playoff bracket (nullable for shared brackets)
  season_id text references seasons(id) not null,
  round_name text not null, -- e.g., 'Play-In Tournament', 'Round 1', 'Conference Finals', 'Finals'
  round_number int not null, -- 0 (Play-In), 1, 2, 3, 4 (for ordering)
  team1_id text references teams(id),
  team1_name text, -- If team not in DB
  team1_seed int, -- Regular season seed (1-10). Seeds 1-6 auto-qualify, 7-10 are play-in teams.
  team2_id text references teams(id),
  team2_name text, -- If team not in DB
  team2_seed int, -- Regular season seed (1-10). Seeds 1-6 auto-qualify, 7-10 are play-in teams.
  team1_wins int default 0,
  team2_wins int default 0,
  winner_team_id text references teams(id),
  winner_team_name text,
  is_complete boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Playoff Totals table (aggregated per player per series, maintained by triggers)
create table if not exists playoff_totals (
  id uuid primary key default gen_random_uuid(),
  player_id text references players(id) not null,
  playoff_series_id text not null,
  games_played int not null default 0,
  total_minutes numeric(6,1) default 0,
  total_points int default 0,
  total_rebounds int default 0,
  total_offensive_rebounds int default 0,
  total_assists int default 0,
  total_steals int default 0,
  total_blocks int default 0,
  total_turnovers int default 0,
  total_fouls int default 0,
  total_plus_minus int default 0,
  total_fg_made int default 0,
  total_fg_attempted int default 0,
  total_threes_made int default 0,
  total_threes_attempted int default 0,
  total_ft_made int default 0,
  total_ft_attempted int default 0,
  avg_points numeric(5,1),
  avg_rebounds numeric(5,1),
  avg_offensive_rebounds numeric(5,1),
  avg_assists numeric(5,1),
  avg_steals numeric(4,1),
  avg_blocks numeric(4,1),
  avg_turnovers numeric(4,1),
  avg_fouls numeric(4,1),
  avg_minutes numeric(4,1),
  avg_plus_minus numeric(5,1),
  fg_percentage numeric(5,3),
  ft_percentage numeric(5,3),
  three_pt_percentage numeric(5,3),
  double_doubles int default 0,
  triple_doubles int default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(player_id, playoff_series_id)
);

-- Roster table (per-player, per-season roster entries)
create table if not exists roster (
  id uuid primary key default gen_random_uuid(),
  player_id text references players(id),
  season_id text references seasons(id) not null,
  player_name text not null,
  position text,
  secondary_position text,
  is_starter boolean default false,
  overall int,
  start_end text default 'start', -- 'start' or 'end' of season
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- ============================================
-- PART 2: CREATE INDEXES
-- ============================================

create index if not exists idx_player_game_stats_player_id on player_game_stats(player_id);
create index if not exists idx_player_game_stats_season_id on player_game_stats(season_id);
create index if not exists idx_player_game_stats_playoff_series on player_game_stats(playoff_series_id);
create index if not exists idx_season_totals_player_id on season_totals(player_id);
create index if not exists idx_season_totals_season_id on season_totals(season_id);
create index if not exists idx_players_user_id on players(user_id);
create index if not exists idx_awards_season_id on awards(season_id);
create index if not exists idx_awards_user_id on awards(user_id);
create index if not exists idx_playoff_series_season_id on playoff_series(season_id);
create index if not exists idx_playoff_series_player_id on playoff_series(player_id);
create index if not exists idx_playoff_totals_player_id on playoff_totals(player_id);
create index if not exists idx_playoff_totals_series_id on playoff_totals(playoff_series_id);
create index if not exists idx_roster_player_id on roster(player_id);
create index if not exists idx_roster_season_id on roster(season_id);

-- ============================================
-- PART 3: CREATE TRIGGERS FOR updated_at
-- ============================================

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_users_updated_at on users;
create trigger update_users_updated_at before update on users
  for each row execute function update_updated_at_column();

drop trigger if exists update_teams_updated_at on teams;
create trigger update_teams_updated_at before update on teams
  for each row execute function update_updated_at_column();

drop trigger if exists update_seasons_updated_at on seasons;
create trigger update_seasons_updated_at before update on seasons
  for each row execute function update_updated_at_column();

drop trigger if exists update_players_updated_at on players;
create trigger update_players_updated_at before update on players
  for each row execute function update_updated_at_column();

drop trigger if exists update_player_game_stats_updated_at on player_game_stats;
create trigger update_player_game_stats_updated_at before update on player_game_stats
  for each row execute function update_updated_at_column();

drop trigger if exists update_season_totals_updated_at on season_totals;
create trigger update_season_totals_updated_at before update on season_totals
  for each row execute function update_updated_at_column();

drop trigger if exists update_awards_updated_at on awards;
create trigger update_awards_updated_at before update on awards
  for each row execute function update_updated_at_column();

drop trigger if exists update_playoff_series_updated_at on playoff_series;
create trigger update_playoff_series_updated_at before update on playoff_series
  for each row execute function update_updated_at_column();

drop trigger if exists update_playoff_totals_updated_at on playoff_totals;
create trigger update_playoff_totals_updated_at before update on playoff_totals
  for each row execute function update_updated_at_column();

-- ============================================
-- PART 3B: RECALC FUNCTIONS AND TRIGGERS
-- ============================================

create or replace function recalc_playoff_totals(p_player_id text, p_playoff_series_id text)
returns void as $$
declare
    totals record;
begin
    select
        count(*) as games_played,
        coalesce(sum(minutes), 0) as total_minutes,
        coalesce(sum(points), 0) as total_points,
        coalesce(sum(rebounds), 0) as total_rebounds,
        coalesce(sum(offensive_rebounds), 0) as total_offensive_rebounds,
        coalesce(sum(assists), 0) as total_assists,
        coalesce(sum(steals), 0) as total_steals,
        coalesce(sum(blocks), 0) as total_blocks,
        coalesce(sum(turnovers), 0) as total_turnovers,
        coalesce(sum(fouls), 0) as total_fouls,
        coalesce(sum(plus_minus), 0) as total_plus_minus,
        coalesce(sum(fg_made), 0) as total_fg_made,
        coalesce(sum(fg_attempted), 0) as total_fg_attempted,
        coalesce(sum(threes_made), 0) as total_threes_made,
        coalesce(sum(threes_attempted), 0) as total_threes_attempted,
        coalesce(sum(ft_made), 0) as total_ft_made,
        coalesce(sum(ft_attempted), 0) as total_ft_attempted,
        sum(case when (case when points >= 10 then 1 else 0 end) + (case when rebounds >= 10 then 1 else 0 end) + (case when assists >= 10 then 1 else 0 end) + (case when steals >= 10 then 1 else 0 end) + (case when blocks >= 10 then 1 else 0 end) >= 2 then 1 else 0 end) as double_doubles,
        sum(case when (case when points >= 10 then 1 else 0 end) + (case when rebounds >= 10 then 1 else 0 end) + (case when assists >= 10 then 1 else 0 end) + (case when steals >= 10 then 1 else 0 end) + (case when blocks >= 10 then 1 else 0 end) >= 3 then 1 else 0 end) as triple_doubles
    into totals
    from player_game_stats
    where player_id = p_player_id and playoff_series_id = p_playoff_series_id and is_playoff_game = true;

    if totals.games_played is null or totals.games_played = 0 then
        delete from playoff_totals where player_id = p_player_id and playoff_series_id = p_playoff_series_id;
        return;
    end if;

    insert into playoff_totals (player_id, playoff_series_id, games_played, total_minutes, total_points, total_rebounds, total_offensive_rebounds, total_assists, total_steals, total_blocks, total_turnovers, total_fouls, total_plus_minus, total_fg_made, total_fg_attempted, total_threes_made, total_threes_attempted, total_ft_made, total_ft_attempted, avg_points, avg_rebounds, avg_offensive_rebounds, avg_assists, avg_steals, avg_blocks, avg_turnovers, avg_fouls, avg_minutes, avg_plus_minus, fg_percentage, ft_percentage, three_pt_percentage, double_doubles, triple_doubles)
    values (p_player_id, p_playoff_series_id, totals.games_played, totals.total_minutes, totals.total_points, totals.total_rebounds, totals.total_offensive_rebounds, totals.total_assists, totals.total_steals, totals.total_blocks, totals.total_turnovers, totals.total_fouls, totals.total_plus_minus, totals.total_fg_made, totals.total_fg_attempted, totals.total_threes_made, totals.total_threes_attempted, totals.total_ft_made, totals.total_ft_attempted,
        round(totals.total_points::numeric / totals.games_played, 1), round(totals.total_rebounds::numeric / totals.games_played, 1), round(totals.total_offensive_rebounds::numeric / totals.games_played, 1), round(totals.total_assists::numeric / totals.games_played, 1), round(totals.total_steals::numeric / totals.games_played, 1), round(totals.total_blocks::numeric / totals.games_played, 1), round(totals.total_turnovers::numeric / totals.games_played, 1), round(totals.total_fouls::numeric / totals.games_played, 1), round(totals.total_minutes::numeric / totals.games_played, 1), round(totals.total_plus_minus::numeric / totals.games_played, 1),
        case when totals.total_fg_attempted > 0 then totals.total_fg_made::numeric / totals.total_fg_attempted else null end,
        case when totals.total_ft_attempted > 0 then totals.total_ft_made::numeric / totals.total_ft_attempted else null end,
        case when totals.total_threes_attempted > 0 then totals.total_threes_made::numeric / totals.total_threes_attempted else null end,
        totals.double_doubles, totals.triple_doubles)
    on conflict (player_id, playoff_series_id)
    do update set games_played = excluded.games_played, total_minutes = excluded.total_minutes, total_points = excluded.total_points, total_rebounds = excluded.total_rebounds, total_offensive_rebounds = excluded.total_offensive_rebounds, total_assists = excluded.total_assists, total_steals = excluded.total_steals, total_blocks = excluded.total_blocks, total_turnovers = excluded.total_turnovers, total_fouls = excluded.total_fouls, total_plus_minus = excluded.total_plus_minus, total_fg_made = excluded.total_fg_made, total_fg_attempted = excluded.total_fg_attempted, total_threes_made = excluded.total_threes_made, total_threes_attempted = excluded.total_threes_attempted, total_ft_made = excluded.total_ft_made, total_ft_attempted = excluded.total_ft_attempted, avg_points = excluded.avg_points, avg_rebounds = excluded.avg_rebounds, avg_offensive_rebounds = excluded.avg_offensive_rebounds, avg_assists = excluded.avg_assists, avg_steals = excluded.avg_steals, avg_blocks = excluded.avg_blocks, avg_turnovers = excluded.avg_turnovers, avg_fouls = excluded.avg_fouls, avg_minutes = excluded.avg_minutes, avg_plus_minus = excluded.avg_plus_minus, fg_percentage = excluded.fg_percentage, ft_percentage = excluded.ft_percentage, three_pt_percentage = excluded.three_pt_percentage, double_doubles = excluded.double_doubles, triple_doubles = excluded.triple_doubles, updated_at = now();
end;
$$ language plpgsql;

create or replace function recalc_season_totals(p_player_id text, p_season_id text)
returns void as $$
declare
    totals record;
    existing_manual boolean;
begin
    select is_manual_entry into existing_manual from season_totals where player_id = p_player_id and season_id = p_season_id;
    if existing_manual is true then return; end if;

    select count(*) as games_played, count(*) as games_started, coalesce(sum(minutes), 0) as total_minutes, coalesce(sum(points), 0) as total_points, coalesce(sum(rebounds), 0) as total_rebounds, coalesce(sum(offensive_rebounds), 0) as total_offensive_rebounds, coalesce(sum(assists), 0) as total_assists, coalesce(sum(steals), 0) as total_steals, coalesce(sum(blocks), 0) as total_blocks, coalesce(sum(turnovers), 0) as total_turnovers, coalesce(sum(fouls), 0) as total_fouls, coalesce(sum(plus_minus), 0) as total_plus_minus, coalesce(sum(fg_made), 0) as total_fg_made, coalesce(sum(fg_attempted), 0) as total_fg_attempted, coalesce(sum(threes_made), 0) as total_threes_made, coalesce(sum(threes_attempted), 0) as total_threes_attempted, coalesce(sum(ft_made), 0) as total_ft_made, coalesce(sum(ft_attempted), 0) as total_ft_attempted,
        sum(case when (case when points >= 10 then 1 else 0 end) + (case when rebounds >= 10 then 1 else 0 end) + (case when assists >= 10 then 1 else 0 end) + (case when steals >= 10 then 1 else 0 end) + (case when blocks >= 10 then 1 else 0 end) >= 2 then 1 else 0 end) as double_doubles,
        sum(case when (case when points >= 10 then 1 else 0 end) + (case when rebounds >= 10 then 1 else 0 end) + (case when assists >= 10 then 1 else 0 end) + (case when steals >= 10 then 1 else 0 end) + (case when blocks >= 10 then 1 else 0 end) >= 3 then 1 else 0 end) as triple_doubles
    into totals from player_game_stats where player_id = p_player_id and season_id = p_season_id and is_playoff_game = false;

    if totals.games_played = 0 then
        delete from season_totals where player_id = p_player_id and season_id = p_season_id;
        return;
    end if;

    insert into season_totals (player_id, season_id, is_manual_entry, games_played, games_started, total_minutes, total_points, total_rebounds, total_offensive_rebounds, total_assists, total_steals, total_blocks, total_turnovers, total_fouls, total_plus_minus, total_fg_made, total_fg_attempted, total_threes_made, total_threes_attempted, total_ft_made, total_ft_attempted, avg_points, avg_rebounds, avg_offensive_rebounds, avg_assists, avg_steals, avg_blocks, avg_turnovers, avg_fouls, avg_minutes, avg_plus_minus, fg_percentage, ft_percentage, three_pt_percentage, double_doubles, triple_doubles)
    values (p_player_id, p_season_id, false, totals.games_played, totals.games_started, totals.total_minutes, totals.total_points, totals.total_rebounds, totals.total_offensive_rebounds, totals.total_assists, totals.total_steals, totals.total_blocks, totals.total_turnovers, totals.total_fouls, totals.total_plus_minus, totals.total_fg_made, totals.total_fg_attempted, totals.total_threes_made, totals.total_threes_attempted, totals.total_ft_made, totals.total_ft_attempted,
        round(totals.total_points::numeric / totals.games_played, 1), round(totals.total_rebounds::numeric / totals.games_played, 1), round(totals.total_offensive_rebounds::numeric / totals.games_played, 1), round(totals.total_assists::numeric / totals.games_played, 1), round(totals.total_steals::numeric / totals.games_played, 1), round(totals.total_blocks::numeric / totals.games_played, 1), round(totals.total_turnovers::numeric / totals.games_played, 1), round(totals.total_fouls::numeric / totals.games_played, 1), round(totals.total_minutes::numeric / totals.games_played, 1), round(totals.total_plus_minus::numeric / totals.games_played, 1),
        case when totals.total_fg_attempted > 0 then totals.total_fg_made::numeric / totals.total_fg_attempted else null end, case when totals.total_ft_attempted > 0 then totals.total_ft_made::numeric / totals.total_ft_attempted else null end, case when totals.total_threes_attempted > 0 then totals.total_threes_made::numeric / totals.total_threes_attempted else null end,
        totals.double_doubles, totals.triple_doubles)
    on conflict (player_id, season_id)
    do update set is_manual_entry = excluded.is_manual_entry, games_played = excluded.games_played, games_started = excluded.games_started, total_minutes = excluded.total_minutes, total_points = excluded.total_points, total_rebounds = excluded.total_rebounds, total_offensive_rebounds = excluded.total_offensive_rebounds, total_assists = excluded.total_assists, total_steals = excluded.total_steals, total_blocks = excluded.total_blocks, total_turnovers = excluded.total_turnovers, total_fouls = excluded.total_fouls, total_plus_minus = excluded.total_plus_minus, total_fg_made = excluded.total_fg_made, total_fg_attempted = excluded.total_fg_attempted, total_threes_made = excluded.total_threes_made, total_threes_attempted = excluded.total_threes_attempted, total_ft_made = excluded.total_ft_made, total_ft_attempted = excluded.total_ft_attempted, avg_points = excluded.avg_points, avg_rebounds = excluded.avg_rebounds, avg_offensive_rebounds = excluded.avg_offensive_rebounds, avg_assists = excluded.avg_assists, avg_steals = excluded.avg_steals, avg_blocks = excluded.avg_blocks, avg_turnovers = excluded.avg_turnovers, avg_fouls = excluded.avg_fouls, avg_minutes = excluded.avg_minutes, avg_plus_minus = excluded.avg_plus_minus, fg_percentage = excluded.fg_percentage, ft_percentage = excluded.ft_percentage, three_pt_percentage = excluded.three_pt_percentage, double_doubles = excluded.double_doubles, triple_doubles = excluded.triple_doubles, updated_at = now();
end;
$$ language plpgsql;

create or replace function trigger_recalc_player_totals()
returns trigger as $$
begin
    if tg_op = 'INSERT' then
        if new.is_playoff_game then
            perform recalc_playoff_totals(new.player_id, new.playoff_series_id);
        else
            perform recalc_season_totals(new.player_id, new.season_id);
        end if;
        return new;
    elsif tg_op = 'UPDATE' then
        -- Old context: game was removed from here
        if old.is_playoff_game then
            perform recalc_playoff_totals(old.player_id, old.playoff_series_id);
        else
            perform recalc_season_totals(old.player_id, old.season_id);
        end if;
        -- New context: game was added here
        if new.is_playoff_game then
            perform recalc_playoff_totals(new.player_id, new.playoff_series_id);
        else
            perform recalc_season_totals(new.player_id, new.season_id);
        end if;
        return new;
    elsif tg_op = 'DELETE' then
        if old.is_playoff_game then
            perform recalc_playoff_totals(old.player_id, old.playoff_series_id);
        else
            perform recalc_season_totals(old.player_id, old.season_id);
        end if;
        return old;
    end if;
    return null;
end;
$$ language plpgsql;

drop trigger if exists trg_player_game_delete on player_game_stats;
create trigger trg_player_game_delete after delete on player_game_stats
  for each row execute function trigger_recalc_player_totals();

drop trigger if exists trg_player_game_upsert on player_game_stats;
create trigger trg_player_game_upsert after insert or update on player_game_stats
  for each row execute function trigger_recalc_player_totals();

-- ============================================
-- PART 4: INSERT NBA TEAMS
-- ============================================

insert into teams (id, name, primary_color, secondary_color) values
  -- Eastern Conference - Atlantic Division
  ('team-bos', 'Boston Celtics', '#007A33', '#BA9653'),
  ('team-bkn', 'Brooklyn Nets', '#000000', '#FFFFFF'),
  ('team-nyk', 'New York Knicks', '#006BB6', '#F58426'),
  ('team-phi', 'Philadelphia 76ers', '#006BB6', '#ED174C'),
  ('team-tor', 'Toronto Raptors', '#CE1141', '#000000'),

  -- Eastern Conference - Central Division
  ('team-chi', 'Chicago Bulls', '#CE1141', '#000000'),
  ('team-cle', 'Cleveland Cavaliers', '#860038', '#FDBB30'),
  ('team-det', 'Detroit Pistons', '#C8102E', '#1D42BA'),
  ('team-ind', 'Indiana Pacers', '#002D62', '#FDBB30'),
  ('team-mil', 'Milwaukee Bucks', '#00471B', '#EEE1C6'),

  -- Eastern Conference - Southeast Division
  ('team-atl', 'Atlanta Hawks', '#E03A3E', '#C1D32F'),
  ('team-cha', 'Charlotte Hornets', '#1D1160', '#00788C'),
  ('team-mia', 'Miami Heat', '#98002E', '#F9A01B'),
  ('team-orl', 'Orlando Magic', '#0077C0', '#C4CED4'),
  ('team-was', 'Washington Wizards', '#002B5C', '#E31837'),

  -- Western Conference - Northwest Division
  ('team-den', 'Denver Nuggets', '#0E2240', '#FEC524'),
  ('team-min', 'Minnesota Timberwolves', '#0C2340', '#236192'),
  ('team-okc', 'Oklahoma City Thunder', '#007AC1', '#EF1B24'),
  ('team-por', 'Portland Trail Blazers', '#E03A3E', '#000000'),
  ('team-uta', 'Utah Jazz', '#002B5C', '#F9A01B'),

  -- Western Conference - Pacific Division
  ('team-gsw', 'Golden State Warriors', '#1D428A', '#FFC72C'),
  ('team-lac', 'LA Clippers', '#C8102E', '#1D42BA'),
  ('team-lal', 'Los Angeles Lakers', '#552583', '#FDB927'),
  ('team-phx', 'Phoenix Suns', '#1D1160', '#E56020'),
  ('team-sac', 'Sacramento Kings', '#5A2D81', '#63727A'),

  -- Western Conference - Southwest Division
  ('team-dal', 'Dallas Mavericks', '#00538C', '#002B5E'),
  ('team-hou', 'Houston Rockets', '#CE1141', '#000000'),
  ('team-mem', 'Memphis Grizzlies', '#5D76A9', '#12173F'),
  ('team-nop', 'New Orleans Pelicans', '#0C2340', '#C8102E'),
  ('team-sas', 'San Antonio Spurs', '#C4CED4', '#000000')
on conflict (id) do update set
  name = excluded.name,
  primary_color = excluded.primary_color,
  secondary_color = excluded.secondary_color;

-- ============================================
-- PART 5: ENABLE ROW LEVEL SECURITY
-- ============================================

alter table users enable row level security;
alter table teams enable row level security;
alter table seasons enable row level security;
alter table players enable row level security;
alter table player_game_stats enable row level security;
alter table season_totals enable row level security;
alter table awards enable row level security;
alter table playoff_series enable row level security;
alter table playoff_totals enable row level security;
alter table roster enable row level security;

-- ============================================
-- PART 6: CREATE RLS POLICIES
-- ============================================

-- Drop existing policies if they exist (for idempotency)
drop policy if exists "Users can view own profile" on users;
drop policy if exists "Users can update own profile" on users;
drop policy if exists "Teams are viewable by everyone" on teams;
drop policy if exists "Authenticated users can insert teams" on teams;
drop policy if exists "Authenticated users can update teams" on teams;
drop policy if exists "Seasons are viewable by everyone" on seasons;
drop policy if exists "Authenticated users can insert seasons" on seasons;
drop policy if exists "Authenticated users can update seasons" on seasons;
drop policy if exists "Users can view own player" on players;
drop policy if exists "Users can view all players" on players;
drop policy if exists "Users can insert own player" on players;
drop policy if exists "Users can update own player" on players;
drop policy if exists "Users can delete own player" on players;
drop policy if exists "Users can view own player game stats" on player_game_stats;
drop policy if exists "Users can view all player game stats" on player_game_stats;
drop policy if exists "Users can insert own player game stats" on player_game_stats;
drop policy if exists "Users can update own player game stats" on player_game_stats;
drop policy if exists "Users can delete own player game stats" on player_game_stats;
drop policy if exists "Users can view own season totals" on season_totals;
drop policy if exists "Users can view all season totals" on season_totals;
drop policy if exists "Users can insert own season totals" on season_totals;
drop policy if exists "Users can update own season totals" on season_totals;
drop policy if exists "Users can delete own season totals" on season_totals;
drop policy if exists "Awards are viewable by everyone" on awards;
drop policy if exists "Anon can read awards for public view" on awards;
drop policy if exists "Auth users can select awards" on awards;
drop policy if exists "Auth users can insert awards" on awards;
drop policy if exists "Auth users can update awards" on awards;
drop policy if exists "Auth users can delete awards" on awards;
drop policy if exists "Authenticated users can insert awards" on awards;
drop policy if exists "Authenticated users can update awards" on awards;
drop policy if exists "Authenticated can view all awards" on awards;
drop policy if exists "Users can insert own awards" on awards;
drop policy if exists "Users can update own awards" on awards;
drop policy if exists "Users can delete own awards" on awards;
drop policy if exists "Playoff series are viewable by everyone" on playoff_series;
drop policy if exists "Authenticated users can insert playoff series" on playoff_series;
drop policy if exists "Authenticated users can update playoff series" on playoff_series;

-- Users table policies
create policy "Users can view own profile"
  on users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on users for update
  using (auth.uid() = id);

-- Teams table policies
create policy "Teams are viewable by everyone"
  on teams for select
  using (true);

create policy "Authenticated users can insert teams"
  on teams for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update teams"
  on teams for update
  using (auth.role() = 'authenticated');

-- Seasons table policies
create policy "Seasons are viewable by everyone"
  on seasons for select
  using (true);

create policy "Authenticated users can insert seasons"
  on seasons for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update seasons"
  on seasons for update
  using (auth.role() = 'authenticated');

-- Players table policies
create policy "Public can read players"
  on players for select
  using (true);

create policy "Users can insert own player"
  on players for insert
  with check (user_id = auth.uid());

create policy "Users can delete own player"
  on players for delete
  using (user_id = auth.uid());

create policy "Users can update own player"
  on players for update
  using (user_id = auth.uid());

-- Player Game Stats table policies
create policy "Public can view all player game stats"
  on player_game_stats for select
  using (true);

create policy "Users can insert own player game stats"
  on player_game_stats for insert
  with check (
    exists (select 1 from players where players.id = player_game_stats.player_id and players.user_id = auth.uid())
  );

create policy "Users can update own player game stats"
  on player_game_stats for update
  using (
    exists (select 1 from players where players.id = player_game_stats.player_id and players.user_id = auth.uid())
  );

create policy "Users can delete own player game stats"
  on player_game_stats for delete
  using (
    exists (select 1 from players where players.id = player_game_stats.player_id and players.user_id = auth.uid())
  );

-- Season Totals table policies
create policy "Public can view all season totals"
  on season_totals for select
  using (true);

create policy "Users can insert own season totals"
  on season_totals for insert
  with check (
    exists (select 1 from players where players.id = season_totals.player_id and players.user_id = auth.uid())
  );

create policy "Users can update own season totals"
  on season_totals for update
  using (
    exists (select 1 from players where players.id = season_totals.player_id and players.user_id = auth.uid())
  );

create policy "Users can delete own season totals"
  on season_totals for delete
  using (
    exists (select 1 from players where players.id = season_totals.player_id and players.user_id = auth.uid())
  );

-- Awards table policies (user-scoped: users can only modify their own awards)
create policy "Awards are viewable by everyone"
  on awards for select
  using (true);

create policy "Users can insert own awards"
  on awards for insert
  with check (user_id = auth.uid());

create policy "Users can update own awards"
  on awards for update
  using (user_id = auth.uid());

create policy "Users can delete own awards"
  on awards for delete
  using (user_id = auth.uid());

-- Playoff Series table policies
create policy "Playoff series are viewable by everyone"
  on playoff_series for select
  using (true);

create policy "Authenticated users can insert playoff series"
  on playoff_series for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update playoff series"
  on playoff_series for update
  using (auth.role() = 'authenticated');

-- Playoff Totals table policies (trigger-maintained; auth can read/insert/update)
create policy "Enable read access for all users"
  on playoff_totals for select
  using (true);

create policy "Enable insert for authenticated users only"
  on playoff_totals for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update playoff series"
  on playoff_totals for update
  using (auth.role() = 'authenticated');

-- Roster table policies
create policy "Enable read access for all users"
  on roster for select
  using (true);

create policy "Auth users can insert roster"
  on roster for insert
  with check (auth.role() = 'authenticated');

create policy "Auth users can update roster"
  on roster for update
  using (auth.role() = 'authenticated');

create policy "Auth users can delete roster"
  on roster for delete
  using (auth.role() = 'authenticated');

-- Team Standings table (per-player, per-season standings for all 30 teams)
create table if not exists team_standings (
  id uuid primary key default gen_random_uuid(),
  player_id text references players(id) not null,
  season_id text references seasons(id) not null,
  team_id text references teams(id) not null,
  wins int not null default 0,
  losses int not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(player_id, season_id, team_id)
);

alter table team_standings enable row level security;

create policy "Team standings are viewable by everyone"
  on team_standings for select
  using (true);

create policy "Users can insert own team standings"
  on team_standings for insert
  with check (
    player_id in (select id from players where user_id = auth.uid())
  );

create policy "Users can update own team standings"
  on team_standings for update
  using (
    player_id in (select id from players where user_id = auth.uid())
  );

create policy "Users can delete own team standings"
  on team_standings for delete
  using (
    player_id in (select id from players where user_id = auth.uid())
  );

-- ============================================
-- COMPLETE!
-- ============================================
-- Next steps:
-- 1. Create 2 users in Supabase Auth
-- 2. Run seed_data.sql (update user UUIDs first)
-- 3. Start using the app!

