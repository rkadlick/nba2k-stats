-- Playoff Series Seed Data for 2024-25 Season
-- Single unified bracket (not separate per player)
-- Each player will see only their team's path through filtering

-- First, delete all existing playoff series for this season
delete from playoff_series where season_id = 'season-2024-25';

-- ============================================
-- WESTERN CONFERENCE
-- ============================================

-- PLAY-IN TOURNAMENT (2 series per conference)
-- (7) Golden State Warriors vs (8) New Orleans Pelicans - Winner gets 7th seed
insert into playoff_series (id, season_id, round_name, round_number, team1_id, team2_id, team1_seed, team2_seed, team1_wins, team2_wins, winner_team_id, is_complete) values
  ('series-2024-25-west-pi-7-8', 'season-2024-25', 'Play-In Tournament', 0, 'team-gsw', 'team-nop', 7, 8, 1, 0, 'team-gsw', true)
on conflict (id) do update set
  team1_wins = 1,
  team2_wins = 0,
  winner_team_id = 'team-gsw',
  is_complete = true;

-- (9) Portland Trail Blazers vs (10) Utah Jazz - Winner plays loser of 7/8 for 8th seed
insert into playoff_series (id, season_id, round_name, round_number, team1_id, team2_id, team1_seed, team2_seed, team1_wins, team2_wins, winner_team_id, is_complete) values
  ('series-2024-25-west-pi-9-10', 'season-2024-25', 'Play-In Tournament', 0, 'team-por', 'team-uta', 9, 10, 1, 0, 'team-por', true)
on conflict (id) do update set
  team1_wins = 1,
  team2_wins = 0,
  winner_team_id = 'team-por',
  is_complete = true;

-- ROUND 1 (4 series per conference)
-- (1) Los Angeles Lakers vs (8) New Orleans Pelicans
insert into playoff_series (id, season_id, round_name, round_number, team1_id, team2_id, team1_seed, team2_seed, team1_wins, team2_wins, winner_team_id, is_complete) values
  ('series-2024-25-west-r1-1-8', 'season-2024-25', 'Round 1', 1, 'team-lal', 'team-nop', 1, 8, 4, 1, 'team-lal', true)
on conflict (id) do update set
  team1_wins = 4,
  team2_wins = 1,
  winner_team_id = 'team-lal',
  is_complete = true;

-- (2) Denver Nuggets vs (7) Golden State Warriors
insert into playoff_series (id, season_id, round_name, round_number, team1_id, team2_id, team1_seed, team2_seed, team1_wins, team2_wins, winner_team_id, is_complete) values
  ('series-2024-25-west-r1-2-7', 'season-2024-25', 'Round 1', 1, 'team-den', 'team-gsw', 2, 7, 4, 2, 'team-den', true)
on conflict (id) do update set
  team1_wins = 4,
  team2_wins = 2,
  winner_team_id = 'team-den',
  is_complete = true;

-- (3) Phoenix Suns vs (6) Dallas Mavericks
insert into playoff_series (id, season_id, round_name, round_number, team1_id, team2_id, team1_seed, team2_seed, team1_wins, team2_wins, winner_team_id, is_complete) values
  ('series-2024-25-west-r1-3-6', 'season-2024-25', 'Round 1', 1, 'team-phx', 'team-dal', 3, 6, 4, 3, 'team-phx', true)
on conflict (id) do update set
  team1_wins = 4,
  team2_wins = 3,
  winner_team_id = 'team-phx',
  is_complete = true;

-- (4) Los Angeles Clippers vs (5) Minnesota Timberwolves
insert into playoff_series (id, season_id, round_name, round_number, team1_id, team2_id, team1_seed, team2_seed, team1_wins, team2_wins, winner_team_id, is_complete) values
  ('series-2024-25-west-r1-4-5', 'season-2024-25', 'Round 1', 1, 'team-lac', 'team-min', 4, 5, 4, 2, 'team-lac', true)
on conflict (id) do update set
  team1_wins = 4,
  team2_wins = 2,
  winner_team_id = 'team-lac',
  is_complete = true;

-- CONFERENCE SEMIFINALS (2 series per conference)
-- (1) Los Angeles Lakers vs (4) Los Angeles Clippers
insert into playoff_series (id, season_id, round_name, round_number, team1_id, team2_id, team1_seed, team2_seed, team1_wins, team2_wins, winner_team_id, is_complete) values
  ('series-2024-25-west-sf-1-4', 'season-2024-25', 'Conference Semifinals', 2, 'team-lal', 'team-lac', 1, 4, 4, 2, 'team-lal', true)
on conflict (id) do update set
  team1_wins = 4,
  team2_wins = 2,
  winner_team_id = 'team-lal',
  is_complete = true;

-- (2) Denver Nuggets vs (3) Phoenix Suns
insert into playoff_series (id, season_id, round_name, round_number, team1_id, team2_id, team1_seed, team2_seed, team1_wins, team2_wins, winner_team_id, is_complete) values
  ('series-2024-25-west-sf-2-3', 'season-2024-25', 'Conference Semifinals', 2, 'team-den', 'team-phx', 2, 3, 4, 3, 'team-den', true)
on conflict (id) do update set
  team1_wins = 4,
  team2_wins = 3,
  winner_team_id = 'team-den',
  is_complete = true;

-- CONFERENCE FINALS (1 series per conference)
-- Los Angeles Lakers vs Denver Nuggets
insert into playoff_series (id, season_id, round_name, round_number, team1_id, team2_id, team1_seed, team2_seed, team1_wins, team2_wins, winner_team_id, is_complete) values
  ('series-2024-25-west-cf', 'season-2024-25', 'Conference Finals', 3, 'team-lal', 'team-den', 1, 2, 4, 3, 'team-lal', true)
on conflict (id) do update set
  team1_wins = 4,
  team2_wins = 3,
  winner_team_id = 'team-lal',
  is_complete = true;

-- ============================================
-- EASTERN CONFERENCE
-- ============================================

-- PLAY-IN TOURNAMENT (2 series per conference)
-- (7) Atlanta Hawks vs (8) Miami Heat - Winner gets 7th seed
insert into playoff_series (id, season_id, round_name, round_number, team1_id, team2_id, team1_seed, team2_seed, team1_wins, team2_wins, winner_team_id, is_complete) values
  ('series-2024-25-east-pi-7-8', 'season-2024-25', 'Play-In Tournament', 0, 'team-atl', 'team-mia', 7, 8, 1, 0, 'team-atl', true)
on conflict (id) do update set
  team1_wins = 1,
  team2_wins = 0,
  winner_team_id = 'team-atl',
  is_complete = true;

-- (9) Chicago Bulls vs (10) Orlando Magic - Winner plays loser of 7/8 for 8th seed
insert into playoff_series (id, season_id, round_name, round_number, team1_id, team2_id, team1_seed, team2_seed, team1_wins, team2_wins, winner_team_id, is_complete) values
  ('series-2024-25-east-pi-9-10', 'season-2024-25', 'Play-In Tournament', 0, 'team-chi', 'team-orl', 9, 10, 1, 0, 'team-chi', true)
on conflict (id) do update set
  team1_wins = 1,
  team2_wins = 0,
  winner_team_id = 'team-chi',
  is_complete = true;

-- ROUND 1 (4 series per conference)
-- (1) Boston Celtics vs (8) Miami Heat
insert into playoff_series (id, season_id, round_name, round_number, team1_id, team2_id, team1_seed, team2_seed, team1_wins, team2_wins, winner_team_id, is_complete) values
  ('series-2024-25-east-r1-1-8', 'season-2024-25', 'Round 1', 1, 'team-bos', 'team-mia', 1, 8, 4, 1, 'team-bos', true)
on conflict (id) do update set
  team1_wins = 4,
  team2_wins = 1,
  winner_team_id = 'team-bos',
  is_complete = true;

-- (2) Milwaukee Bucks vs (7) Atlanta Hawks
insert into playoff_series (id, season_id, round_name, round_number, team1_id, team2_id, team1_seed, team2_seed, team1_wins, team2_wins, winner_team_id, is_complete) values
  ('series-2024-25-east-r1-2-7', 'season-2024-25', 'Round 1', 1, 'team-mil', 'team-atl', 2, 7, 4, 2, 'team-mil', true)
on conflict (id) do update set
  team1_wins = 4,
  team2_wins = 2,
  winner_team_id = 'team-mil',
  is_complete = true;

-- (3) Cleveland Cavaliers vs (6) New York Knicks
insert into playoff_series (id, season_id, round_name, round_number, team1_id, team2_id, team1_seed, team2_seed, team1_wins, team2_wins, winner_team_id, is_complete) values
  ('series-2024-25-east-r1-3-6', 'season-2024-25', 'Round 1', 1, 'team-cle', 'team-nyk', 3, 6, 4, 2, 'team-cle', true)
on conflict (id) do update set
  team1_wins = 4,
  team2_wins = 2,
  winner_team_id = 'team-cle',
  is_complete = true;

-- (4) Philadelphia 76ers vs (5) Brooklyn Nets
insert into playoff_series (id, season_id, round_name, round_number, team1_id, team2_id, team1_seed, team2_seed, team1_wins, team2_wins, winner_team_id, is_complete) values
  ('series-2024-25-east-r1-4-5', 'season-2024-25', 'Round 1', 1, 'team-phi', 'team-bkn', 4, 5, 4, 3, 'team-phi', true)
on conflict (id) do update set
  team1_wins = 4,
  team2_wins = 3,
  winner_team_id = 'team-phi',
  is_complete = true;

-- CONFERENCE SEMIFINALS (2 series per conference)
-- (1) Boston Celtics vs (4) Philadelphia 76ers
insert into playoff_series (id, season_id, round_name, round_number, team1_id, team2_id, team1_seed, team2_seed, team1_wins, team2_wins, winner_team_id, is_complete) values
  ('series-2024-25-east-sf-1-4', 'season-2024-25', 'Conference Semifinals', 2, 'team-bos', 'team-phi', 1, 4, 2, 4, 'team-phi', true)
on conflict (id) do update set
  team1_wins = 2,
  team2_wins = 4,
  winner_team_id = 'team-phi',
  is_complete = true;

-- (2) Milwaukee Bucks vs (3) Cleveland Cavaliers
insert into playoff_series (id, season_id, round_name, round_number, team1_id, team2_id, team1_seed, team2_seed, team1_wins, team2_wins, winner_team_id, is_complete) values
  ('series-2024-25-east-sf-2-3', 'season-2024-25', 'Conference Semifinals', 2, 'team-mil', 'team-cle', 2, 3, 4, 2, 'team-mil', true)
on conflict (id) do update set
  team1_wins = 4,
  team2_wins = 2,
  winner_team_id = 'team-mil',
  is_complete = true;

-- CONFERENCE FINALS (1 series per conference)
-- Milwaukee Bucks vs Philadelphia 76ers
insert into playoff_series (id, season_id, round_name, round_number, team1_id, team2_id, team1_seed, team2_seed, team1_wins, team2_wins, winner_team_id, is_complete) values
  ('series-2024-25-east-cf', 'season-2024-25', 'Conference Finals', 3, 'team-mil', 'team-phi', 2, 4, 4, 2, 'team-mil', true)
on conflict (id) do update set
  team1_wins = 4,
  team2_wins = 2,
  winner_team_id = 'team-mil',
  is_complete = true;

-- ============================================
-- NBA FINALS (1 series)
-- ============================================
-- Los Angeles Lakers (West) vs Milwaukee Bucks (East)
insert into playoff_series (id, season_id, round_name, round_number, team1_id, team2_id, team1_seed, team2_seed, team1_wins, team2_wins, winner_team_id, is_complete) values
  ('series-2024-25-finals', 'season-2024-25', 'NBA Finals', 4, 'team-lal', 'team-mil', 1, 1, 4, 2, 'team-lal', true)
on conflict (id) do update set
  team1_wins = 4,
  team2_wins = 2,
  winner_team_id = 'team-lal',
  is_complete = true;
