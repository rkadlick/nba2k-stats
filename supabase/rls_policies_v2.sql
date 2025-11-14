-- Row Level Security (RLS) Policies for 2KCompare v2 Schema
-- Run this AFTER schema_v2.sql or migrate_to_v2.sql

-- ============================================
-- Enable RLS on all tables
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
-- USERS TABLE POLICIES
-- ============================================

create policy "Users can view own profile"
  on users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on users for update
  using (auth.uid() = id);

-- ============================================
-- TEAMS TABLE POLICIES
-- ============================================

create policy "Teams are viewable by everyone"
  on teams for select
  using (true);

create policy "Authenticated users can insert teams"
  on teams for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update teams"
  on teams for update
  using (auth.role() = 'authenticated');

-- ============================================
-- SEASONS TABLE POLICIES
-- ============================================

create policy "Seasons are viewable by everyone"
  on seasons for select
  using (true);

create policy "Authenticated users can insert seasons"
  on seasons for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update seasons"
  on seasons for update
  using (auth.role() = 'authenticated');

-- ============================================
-- PLAYERS TABLE POLICIES
-- ============================================

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

-- ============================================
-- PLAYER_GAME_STATS TABLE POLICIES
-- ============================================

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

-- ============================================
-- SEASON_TOTALS TABLE POLICIES
-- ============================================

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

-- ============================================
-- AWARDS TABLE POLICIES
-- ============================================

create policy "Awards are viewable by everyone"
  on awards for select
  using (true);

create policy "Authenticated users can insert awards"
  on awards for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update awards"
  on awards for update
  using (auth.role() = 'authenticated');

-- ============================================
-- PLAYER_AWARDS TABLE POLICIES
-- ============================================

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

-- ============================================
-- PLAYOFF_SERIES TABLE POLICIES
-- ============================================

create policy "Playoff series are viewable by everyone"
  on playoff_series for select
  using (true);

create policy "Authenticated users can insert playoff series"
  on playoff_series for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update playoff series"
  on playoff_series for update
  using (auth.role() = 'authenticated');

