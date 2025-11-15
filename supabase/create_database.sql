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
  -- Per game averages (calculated or manual) - 1 decimal place
  avg_points numeric(5,1),
  avg_rebounds numeric(5,1),
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
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Index for performance
create index if not exists idx_awards_player_id on awards(player_id);
create index if not exists idx_awards_user_id on awards(user_id);

-- Playoff Series table (structure for playoff brackets)
create table if not exists playoff_series (
  id text primary key, -- e.g., 'series-2024-25-round1-lakers-warriors'
  player_id text references players(id) not null, -- Each player has their own playoff bracket
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
create index if not exists idx_player_awards_player_id on player_awards(player_id);
create index if not exists idx_player_awards_season_id on player_awards(season_id);
create index if not exists idx_playoff_series_season_id on playoff_series(season_id);
create index if not exists idx_playoff_series_player_id on playoff_series(player_id);

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
alter table player_awards enable row level security;
alter table playoff_series enable row level security;

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
drop policy if exists "Authenticated users can insert awards" on awards;
drop policy if exists "Authenticated users can update awards" on awards;
drop policy if exists "Users can view own player awards" on player_awards;
drop policy if exists "Users can view all player awards" on player_awards;
drop policy if exists "Users can insert own player awards" on player_awards;
drop policy if exists "Users can update own player awards" on player_awards;
drop policy if exists "Users can delete own player awards" on player_awards;
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
create policy "Users can view own player"
  on players for select
  using (players.user_id = auth.uid());

create policy "Users can view all players"
  on players for select
  using (auth.role() = 'authenticated');

create policy "Users can insert own player"
  on players for insert
  with check (user_id = auth.uid());

create policy "Users can update own player"
  on players for update
  using (players.user_id = auth.uid());

create policy "Users can delete own player"
  on players for delete
  using (players.user_id = auth.uid());

-- Player Game Stats table policies
create policy "Users can view own player game stats"
  on player_game_stats for select
  using (
    exists (
      select 1 from players
      where players.id = player_game_stats.player_id
      and players.user_id = auth.uid()
    )
  );

create policy "Users can view all player game stats"
  on player_game_stats for select
  using (auth.role() = 'authenticated');

create policy "Users can insert own player game stats"
  on player_game_stats for insert
  with check (
    exists (
      select 1 from players
      where players.id = player_game_stats.player_id
      and players.user_id = auth.uid()
    )
  );

create policy "Users can update own player game stats"
  on player_game_stats for update
  using (
    exists (
      select 1 from players
      where players.id = player_game_stats.player_id
      and players.user_id = auth.uid()
    )
  );

create policy "Users can delete own player game stats"
  on player_game_stats for delete
  using (
    exists (
      select 1 from players
      where players.id = player_game_stats.player_id
      and players.user_id = auth.uid()
    )
  );

-- Season Totals table policies
create policy "Users can view own season totals"
  on season_totals for select
  using (
    exists (
      select 1 from players
      where players.id = season_totals.player_id
      and players.user_id = auth.uid()
    )
  );

create policy "Users can view all season totals"
  on season_totals for select
  using (auth.role() = 'authenticated');

create policy "Users can insert own season totals"
  on season_totals for insert
  with check (
    exists (
      select 1 from players
      where players.id = season_totals.player_id
      and players.user_id = auth.uid()
    )
  );

create policy "Users can update own season totals"
  on season_totals for update
  using (
    exists (
      select 1 from players
      where players.id = season_totals.player_id
      and players.user_id = auth.uid()
    )
  );

create policy "Users can delete own season totals"
  on season_totals for delete
  using (
    exists (
      select 1 from players
      where players.id = season_totals.player_id
      and players.user_id = auth.uid()
    )
  );

-- Awards table policies
-- Users can view all awards (for seeing other users' awards when viewing their players)
-- But awards are still user-specific for creation/update/delete
create policy "Users can view all awards"
  on awards for select
  using (auth.role() = 'authenticated');

create policy "Users can insert own awards"
  on awards for insert
  with check (user_id = auth.uid());

create policy "Users can update own awards"
  on awards for update
  using (user_id = auth.uid());

create policy "Users can delete own awards"
  on awards for delete
  using (user_id = auth.uid());

-- Player Awards table policies
create policy "Users can view own player awards"
  on player_awards for select
  using (
    exists (
      select 1 from players
      where players.id = player_awards.player_id
      and players.user_id = auth.uid()
    )
  );

create policy "Users can view all player awards"
  on player_awards for select
  using (auth.role() = 'authenticated');

create policy "Users can insert own player awards"
  on player_awards for insert
  with check (
    exists (
      select 1 from players
      where players.id = player_awards.player_id
      and players.user_id = auth.uid()
    )
  );

create policy "Users can update own player awards"
  on player_awards for update
  using (
    exists (
      select 1 from players
      where players.id = player_awards.player_id
      and players.user_id = auth.uid()
    )
  );

create policy "Users can delete own player awards"
  on player_awards for delete
  using (
    exists (
      select 1 from players
      where players.id = player_awards.player_id
      and players.user_id = auth.uid()
    )
  );

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

-- ============================================
-- COMPLETE!
-- ============================================
-- Next steps:
-- 1. Create 2 users in Supabase Auth
-- 2. Run seed_data.sql (update user UUIDs first)
-- 3. Start using the app!

