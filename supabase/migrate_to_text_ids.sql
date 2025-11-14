-- Complete Migration: Convert all ID types to text where needed
-- Run this ONCE if you already created the schema with UUID IDs
-- This fixes: teams.id, seasons.id, and players.id

-- ============================================
-- PART 1: Migrate Teams Table
-- ============================================
alter table if exists seasons drop constraint if exists seasons_champion_team_id_fkey;
alter table if exists players drop constraint if exists players_team_id_fkey;
alter table if exists player_stats drop constraint if exists player_stats_opponent_team_id_fkey;

alter table if exists teams drop constraint if exists teams_pkey;
alter table teams alter column id type text;
alter table teams add primary key (id);

alter table seasons alter column champion_team_id type text;
alter table players alter column team_id type text;
alter table player_stats alter column opponent_team_id type text;

alter table seasons add constraint seasons_champion_team_id_fkey foreign key (champion_team_id) references teams(id);
alter table players add constraint players_team_id_fkey foreign key (team_id) references teams(id);
alter table player_stats add constraint player_stats_opponent_team_id_fkey foreign key (opponent_team_id) references teams(id);

-- ============================================
-- PART 2: Migrate Seasons Table
-- ============================================
alter table if exists player_stats drop constraint if exists player_stats_season_id_fkey;
alter table if exists season_totals drop constraint if exists season_totals_season_id_fkey;
alter table if exists season_awards drop constraint if exists season_awards_season_id_fkey;

alter table if exists seasons drop constraint if exists seasons_pkey;
alter table seasons alter column id type text;
alter table seasons add primary key (id);

alter table player_stats alter column season_id type text;
alter table season_totals alter column season_id type text;
alter table season_awards alter column season_id type text;

alter table player_stats add constraint player_stats_season_id_fkey foreign key (season_id) references seasons(id);
alter table season_totals add constraint season_totals_season_id_fkey foreign key (season_id) references seasons(id);
alter table season_awards add constraint season_awards_season_id_fkey foreign key (season_id) references seasons(id);

-- ============================================
-- PART 3: Migrate Players Table
-- ============================================
alter table if exists player_stats drop constraint if exists player_stats_player_id_fkey;
alter table if exists season_totals drop constraint if exists season_totals_player_id_fkey;
alter table if exists season_awards drop constraint if exists season_awards_player_id_fkey;

alter table if exists players drop constraint if exists players_pkey;
alter table players alter column id type text;
alter table players add primary key (id);

alter table player_stats alter column player_id type text;
alter table season_totals alter column player_id type text;
alter table season_awards alter column player_id type text;

alter table player_stats add constraint player_stats_player_id_fkey foreign key (player_id) references players(id);
alter table season_totals add constraint season_totals_player_id_fkey foreign key (player_id) references players(id);
alter table season_awards add constraint season_awards_player_id_fkey foreign key (player_id) references players(id);

