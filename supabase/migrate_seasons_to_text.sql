-- Migration: Change seasons.id from uuid to text
-- Run this if you already created the schema with uuid IDs
-- This allows us to use readable season IDs like 'season-2024-25'

-- Step 1: Drop foreign key constraints that reference seasons.id
alter table if exists player_stats drop constraint if exists player_stats_season_id_fkey;
alter table if exists season_totals drop constraint if exists season_totals_season_id_fkey;
alter table if exists season_awards drop constraint if exists season_awards_season_id_fkey;

-- Step 2: Change seasons.id from uuid to text
-- Drop the primary key constraint
alter table if exists seasons drop constraint if exists seasons_pkey;

-- Change the column type
alter table seasons alter column id type text;

-- Recreate primary key
alter table seasons add primary key (id);

-- Step 3: Update foreign key columns to match
alter table player_stats alter column season_id type text;
alter table season_totals alter column season_id type text;
alter table season_awards alter column season_id type text;

-- Step 4: Recreate foreign key constraints
alter table player_stats 
  add constraint player_stats_season_id_fkey 
  foreign key (season_id) references seasons(id);

alter table season_totals 
  add constraint season_totals_season_id_fkey 
  foreign key (season_id) references seasons(id);

alter table season_awards 
  add constraint season_awards_season_id_fkey 
  foreign key (season_id) references seasons(id);

