-- 2KCompare Database Schema
-- Run this in your Supabase SQL Editor

-- Users table (Supabase Auth handles auth.users, this is for app-specific user data)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  display_name text not null,
  created_at timestamp with time zone default now()
);

-- Teams table
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  primary_color text,
  secondary_color text
);

-- Seasons table
create table if not exists seasons (
  id uuid primary key default gen_random_uuid(),
  year_start int not null,
  year_end int not null,
  champion_team_id uuid references teams(id),
  playoff_tree jsonb,
  created_at timestamp with time zone default now()
);

-- Players table
create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  player_name text not null,
  position text,
  height int,
  weight int,
  archetype text,
  team_id uuid references teams(id),
  career_highs jsonb,
  created_at timestamp with time zone default now()
);

-- Player stats table (flexible JSON stats)
create table if not exists player_stats (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references players(id),
  season_id uuid references seasons(id),
  opponent_team_id uuid references teams(id),
  opponent_team_name text, -- For display when team not in DB
  is_home boolean not null default true, -- true = home (vs), false = away (@)
  stats jsonb, -- flexible, add new stats anytime
  is_playoff_game boolean default false,
  playoff_series_id text, -- Link to playoff series
  created_at timestamp with time zone default now()
);

-- Season totals table (for past seasons without individual games)
create table if not exists season_totals (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references players(id),
  season_id uuid references seasons(id),
  stats jsonb, -- Season totals
  games_played int,
  created_at timestamp with time zone default now()
);

-- Season awards table
create table if not exists season_awards (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references players(id),
  season_id uuid references seasons(id),
  award_name text,
  created_at timestamp with time zone default now()
);

-- Create indexes for better query performance
create index if not exists idx_player_stats_player_id on player_stats(player_id);
create index if not exists idx_player_stats_season_id on player_stats(season_id);
create index if not exists idx_players_user_id on players(user_id);
create index if not exists idx_season_awards_player_id on season_awards(player_id);
create index if not exists idx_season_awards_season_id on season_awards(season_id);

