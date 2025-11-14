-- Complete Migration: Change teams.id and seasons.id from uuid to text
-- Run this if you already created the schema with uuid IDs
-- This combines both migrations into one script

-- ============================================
-- PART 1: Migrate Teams Table
-- ============================================

-- Drop foreign key constraints that reference teams.id
alter table if exists seasons drop constraint if exists seasons_champion_team_id_fkey;
alter table if exists players drop constraint if exists players_team_id_fkey;
alter table if exists player_stats drop constraint if exists player_stats_opponent_team_id_fkey;

-- Change teams.id from uuid to text
alter table if exists teams drop constraint if exists teams_pkey;
alter table teams alter column id type text;
alter table teams add primary key (id);

-- Update foreign key columns to match
alter table seasons alter column champion_team_id type text;
alter table players alter column team_id type text;
alter table player_stats alter column opponent_team_id type text;

-- Recreate foreign key constraints for teams
alter table seasons 
  add constraint seasons_champion_team_id_fkey 
  foreign key (champion_team_id) references teams(id);

alter table players 
  add constraint players_team_id_fkey 
  foreign key (team_id) references teams(id);

alter table player_stats 
  add constraint player_stats_opponent_team_id_fkey 
  foreign key (opponent_team_id) references teams(id);

-- ============================================
-- PART 2: Migrate Seasons Table
-- ============================================

-- Drop foreign key constraints that reference seasons.id
alter table if exists player_stats drop constraint if exists player_stats_season_id_fkey;
alter table if exists season_totals drop constraint if exists season_totals_season_id_fkey;
alter table if exists season_awards drop constraint if exists season_awards_season_id_fkey;

-- Change seasons.id from uuid to text
alter table if exists seasons drop constraint if exists seasons_pkey;
alter table seasons alter column id type text;
alter table seasons add primary key (id);

-- Update foreign key columns to match
alter table player_stats alter column season_id type text;
alter table season_totals alter column season_id type text;
alter table season_awards alter column season_id type text;

-- Recreate foreign key constraints for seasons
alter table player_stats 
  add constraint player_stats_season_id_fkey 
  foreign key (season_id) references seasons(id);

alter table season_totals 
  add constraint season_totals_season_id_fkey 
  foreign key (season_id) references seasons(id);

alter table season_awards 
  add constraint season_awards_season_id_fkey 
  foreign key (season_id) references seasons(id);

