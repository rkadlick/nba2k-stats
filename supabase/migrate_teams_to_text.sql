-- Migration: Change teams.id from uuid to text
-- Run this if you already created the schema with uuid IDs
-- This allows us to use readable team IDs like 'team-lal', 'team-bos', etc.

-- Step 1: Drop foreign key constraints that reference teams.id
alter table if exists seasons drop constraint if exists seasons_champion_team_id_fkey;
alter table if exists players drop constraint if exists players_team_id_fkey;
alter table if exists player_stats drop constraint if exists player_stats_opponent_team_id_fkey;

-- Step 2: Change teams.id from uuid to text
-- First, we need to handle existing data if any
-- If teams table is empty, we can just alter it
-- If it has data, we'd need to migrate it (but since you're just starting, it should be empty)

-- Drop the primary key constraint
alter table if exists teams drop constraint if exists teams_pkey;

-- Change the column type
alter table teams alter column id type text;

-- Recreate primary key
alter table teams add primary key (id);

-- Step 3: Update foreign key columns to match
alter table seasons alter column champion_team_id type text;
alter table players alter column team_id type text;
alter table player_stats alter column opponent_team_id type text;

-- Step 4: Recreate foreign key constraints
alter table seasons 
  add constraint seasons_champion_team_id_fkey 
  foreign key (champion_team_id) references teams(id);

alter table players 
  add constraint players_team_id_fkey 
  foreign key (team_id) references teams(id);

alter table player_stats 
  add constraint player_stats_opponent_team_id_fkey 
  foreign key (opponent_team_id) references teams(id);

