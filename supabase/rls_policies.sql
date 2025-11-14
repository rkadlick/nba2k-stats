-- Row Level Security (RLS) Policies for 2KCompare
-- Run this AFTER schema.sql and migrate_to_text_ids.sql
-- This ensures users can only access/modify their own data

-- ============================================
-- Enable RLS on all tables
-- ============================================

alter table users enable row level security;
alter table teams enable row level security;
alter table seasons enable row level security;
alter table players enable row level security;
alter table player_stats enable row level security;
alter table season_totals enable row level security;
alter table season_awards enable row level security;

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Users can read their own user record
create policy "Users can view own profile"
  on users for select
  using (auth.uid()::text = id::text);

-- Users can update their own user record
create policy "Users can update own profile"
  on users for update
  using (auth.uid()::text = id::text);

-- ============================================
-- TEAMS TABLE POLICIES
-- ============================================

-- Everyone can read teams (public reference data)
create policy "Teams are viewable by everyone"
  on teams for select
  using (true);

-- Only authenticated users can insert teams (optional - you may want to restrict this further)
create policy "Authenticated users can insert teams"
  on teams for insert
  with check (auth.role() = 'authenticated');

-- Only authenticated users can update teams
create policy "Authenticated users can update teams"
  on teams for update
  using (auth.role() = 'authenticated');

-- ============================================
-- SEASONS TABLE POLICIES
-- ============================================

-- Everyone can read seasons
create policy "Seasons are viewable by everyone"
  on seasons for select
  using (true);

-- Only authenticated users can insert seasons
create policy "Authenticated users can insert seasons"
  on seasons for insert
  with check (auth.role() = 'authenticated');

-- Only authenticated users can update seasons
create policy "Authenticated users can update seasons"
  on seasons for update
  using (auth.role() = 'authenticated');

-- ============================================
-- PLAYERS TABLE POLICIES
-- ============================================

-- Users can read their own player record
create policy "Users can view own player"
  on players for select
  using (
    exists (
      select 1 from users
      where users.id::text = auth.uid()::text
      and users.id = players.user_id
    )
  );

-- Users can read other players (for comparison view)
create policy "Users can view all players"
  on players for select
  using (auth.role() = 'authenticated');

-- Users can insert their own player
create policy "Users can insert own player"
  on players for insert
  with check (
    exists (
      select 1 from users
      where users.id::text = auth.uid()::text
      and users.id = user_id
    )
  );

-- Users can update their own player
create policy "Users can update own player"
  on players for update
  using (
    exists (
      select 1 from users
      where users.id::text = auth.uid()::text
      and users.id = players.user_id
    )
  );

-- Users can delete their own player
create policy "Users can delete own player"
  on players for delete
  using (
    exists (
      select 1 from users
      where users.id::text = auth.uid()::text
      and users.id = players.user_id
    )
  );

-- ============================================
-- PLAYER_STATS TABLE POLICIES
-- ============================================

-- Users can read stats for their own player
create policy "Users can view own player stats"
  on player_stats for select
  using (
    exists (
      select 1 from players
      join users on users.id = players.user_id
      where players.id = player_stats.player_id
      and users.id::text = auth.uid()::text
    )
  );

-- Users can read all player stats (for comparison view)
create policy "Users can view all player stats"
  on player_stats for select
  using (auth.role() = 'authenticated');

-- Users can insert stats for their own player
create policy "Users can insert own player stats"
  on player_stats for insert
  with check (
    exists (
      select 1 from players
      join users on users.id = players.user_id
      where players.id = player_stats.player_id
      and users.id::text = auth.uid()::text
    )
  );

-- Users can update stats for their own player
create policy "Users can update own player stats"
  on player_stats for update
  using (
    exists (
      select 1 from players
      join users on users.id = players.user_id
      where players.id = player_stats.player_id
      and users.id::text = auth.uid()::text
    )
  );

-- Users can delete stats for their own player
create policy "Users can delete own player stats"
  on player_stats for delete
  using (
    exists (
      select 1 from players
      join users on users.id = players.user_id
      where players.id = player_stats.player_id
      and users.id::text = auth.uid()::text
    )
  );

-- ============================================
-- SEASON_TOTALS TABLE POLICIES
-- ============================================

-- Users can read totals for their own player
create policy "Users can view own season totals"
  on season_totals for select
  using (
    exists (
      select 1 from players
      join users on users.id = players.user_id
      where players.id = season_totals.player_id
      and users.id::text = auth.uid()::text
    )
  );

-- Users can read all season totals (for comparison)
create policy "Users can view all season totals"
  on season_totals for select
  using (auth.role() = 'authenticated');

-- Users can insert totals for their own player
create policy "Users can insert own season totals"
  on season_totals for insert
  with check (
    exists (
      select 1 from players
      join users on users.id = players.user_id
      where players.id = season_totals.player_id
      and users.id::text = auth.uid()::text
    )
  );

-- Users can update totals for their own player
create policy "Users can update own season totals"
  on season_totals for update
  using (
    exists (
      select 1 from players
      join users on users.id = players.user_id
      where players.id = season_totals.player_id
      and users.id::text = auth.uid()::text
    )
  );

-- Users can delete totals for their own player
create policy "Users can delete own season totals"
  on season_totals for delete
  using (
    exists (
      select 1 from players
      join users on users.id = players.user_id
      where players.id = season_totals.player_id
      and users.id::text = auth.uid()::text
    )
  );

-- ============================================
-- SEASON_AWARDS TABLE POLICIES
-- ============================================

-- Users can read awards for their own player
create policy "Users can view own awards"
  on season_awards for select
  using (
    exists (
      select 1 from players
      join users on users.id = players.user_id
      where players.id = season_awards.player_id
      and users.id::text = auth.uid()::text
    )
  );

-- Users can read all awards (for comparison)
create policy "Users can view all awards"
  on season_awards for select
  using (auth.role() = 'authenticated');

-- Users can insert awards for their own player
create policy "Users can insert own awards"
  on season_awards for insert
  with check (
    exists (
      select 1 from players
      join users on users.id = players.user_id
      where players.id = season_awards.player_id
      and users.id::text = auth.uid()::text
    )
  );

-- Users can update awards for their own player
create policy "Users can update own awards"
  on season_awards for update
  using (
    exists (
      select 1 from players
      join users on users.id = players.user_id
      where players.id = season_awards.player_id
      and users.id::text = auth.uid()::text
    )
  );

-- Users can delete awards for their own player
create policy "Users can delete own awards"
  on season_awards for delete
  using (
    exists (
      select 1 from players
      join users on users.id = players.user_id
      where players.id = season_awards.player_id
      and users.id::text = auth.uid()::text
    )
  );

