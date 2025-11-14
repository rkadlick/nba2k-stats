-- 2KCompare Seed Data
-- Run this AFTER create_database.sql
-- IMPORTANT: Replace user UUIDs with actual IDs from Supabase Auth

-- ============================================
-- INSERT USERS
-- ============================================
-- IMPORTANT: Replace these UUIDs with actual user IDs from auth.users
-- To get user IDs: Supabase Dashboard → Authentication → Users → Click on user → Copy UUID
insert into users (id, email, display_name) values
  ('REPLACE_WITH_USER1_UUID', 'player1@example.com', 'Player One'),
  ('REPLACE_WITH_USER2_UUID', 'player2@example.com', 'Player Two')
on conflict (id) do nothing;

-- ============================================
-- INSERT SEASON
-- ============================================
insert into seasons (id, year_start, year_end) values
  ('season-2024-25', 2024, 2025)
on conflict (id) do nothing;

-- ============================================
-- INSERT PLAYERS
-- ============================================
-- Note: Update user_id with actual UUIDs from users table above
insert into players (id, user_id, player_name, position, height, weight, archetype, team_id, career_highs) values
  (
    'player-1',
    'REPLACE_WITH_USER1_UUID',
    'Ace Baller',
    'PG',
    75,
    190,
    'Playmaking Shot Creator',
    'team-lal', -- Los Angeles Lakers
    '{"points": 52, "rebounds": 12, "assists": 18, "steals": 6, "blocks": 3}'::jsonb
  ),
  (
    'player-2',
    'REPLACE_WITH_USER2_UUID',
    'Dunk Master',
    'SF',
    80,
    220,
    'Two-Way Slasher',
    'team-bos', -- Boston Celtics
    '{"points": 48, "rebounds": 15, "assists": 10, "steals": 5, "blocks": 7}'::jsonb
  )
on conflict (id) do nothing;

-- ============================================
-- INSERT SAMPLE GAME STATS (Player 1 - Lakers)
-- ============================================
insert into player_game_stats (
  player_id,
  season_id,
  game_date,
  opponent_team_id,
  opponent_team_name,
  is_home,
  is_win,
  player_score,
  opponent_score,
  is_key_game,
  is_playoff_game,
  minutes,
  points,
  rebounds,
  offensive_rebounds,
  assists,
  steals,
  blocks,
  turnovers,
  fouls,
  plus_minus,
  fg_made,
  fg_attempted,
  threes_made,
  threes_attempted,
  ft_made,
  ft_attempted
) values
  (
    'player-1',
    'season-2024-25',
    '2024-10-15',
    'team-bos',
    'Boston Celtics',
    true,
    true,
    112,
    108,
    false,
    false,
    36.0,
    28,
    5,
    1,
    12,
    2,
    0,
    3,
    2,
    8,
    11,
    20,
    4,
    8,
    2,
    2
  ),
  (
    'player-1',
    'season-2024-25',
    '2024-10-18',
    'team-bos',
    'Boston Celtics',
    false,
    true,
    118,
    105,
    false,
    false,
    38.0,
    35,
    7,
    2,
    15,
    3,
    1,
    2,
    1,
    12,
    14,
    24,
    5,
    10,
    2,
    2
  ),
  (
    'player-1',
    'season-2024-25',
    '2024-11-05',
    'team-phx',
    'Phoenix Suns',
    true,
    false,
    98,
    105,
    false,
    true,
    32.0,
    22,
    4,
    0,
    8,
    1,
    0,
    4,
    3,
    -7,
    9,
    18,
    2,
    6,
    2,
    2
  );

-- ============================================
-- INSERT SAMPLE GAME STATS (Player 2 - Celtics)
-- ============================================
insert into player_game_stats (
  player_id,
  season_id,
  game_date,
  opponent_team_id,
  opponent_team_name,
  is_home,
  is_win,
  player_score,
  opponent_score,
  is_key_game,
  is_playoff_game,
  minutes,
  points,
  rebounds,
  offensive_rebounds,
  assists,
  steals,
  blocks,
  turnovers,
  fouls,
  plus_minus,
  fg_made,
  fg_attempted,
  threes_made,
  threes_attempted,
  ft_made,
  ft_attempted
) values
  (
    'player-2',
    'season-2024-25',
    '2024-10-15',
    'team-lal',
    'Los Angeles Lakers',
    false,
    false,
    108,
    112,
    false,
    false,
    37.0,
    32,
    10,
    3,
    6,
    2,
    3,
    2,
    3,
    -4,
    13,
    22,
    3,
    7,
    3,
    4
  ),
  (
    'player-2',
    'season-2024-25',
    '2024-10-20',
    'team-lal',
    'Los Angeles Lakers',
    true,
    true,
    115,
    110,
    false,
    false,
    35.0,
    27,
    12,
    4,
    8,
    4,
    2,
    3,
    2,
    5,
    11,
    19,
    2,
    5,
    3,
    4
  ),
  (
    'player-2',
    'season-2024-25',
    '2024-11-02',
    'team-mia',
    'Miami Heat',
    true,
    true,
    120,
    98,
    true,
    true,
    40.0,
    41,
    14,
    5,
    7,
    3,
    4,
    1,
    2,
    22,
    16,
    26,
    4,
    9,
    5,
    5
  );

-- ============================================
-- INSERT SAMPLE SEASON TOTALS (calculated from games above)
-- ============================================
-- Note: These would normally be calculated automatically, but included here as example
insert into season_totals (
  player_id,
  season_id,
  is_manual_entry,
  games_played,
  games_started,
  total_points,
  total_rebounds,
  total_assists,
  total_steals,
  total_blocks,
  total_turnovers,
  total_minutes,
  total_fouls,
  total_plus_minus,
  total_fg_made,
  total_fg_attempted,
  total_threes_made,
  total_threes_attempted,
  total_ft_made,
  total_ft_attempted,
  avg_points,
  avg_rebounds,
  avg_assists,
  avg_steals,
  avg_blocks,
  avg_turnovers,
  avg_minutes,
  avg_fouls,
  avg_plus_minus,
  fg_percentage,
  ft_percentage,
  three_pt_percentage,
  double_doubles,
  triple_doubles
) values
  (
    'player-1',
    'season-2024-25',
    false,
    3,
    3,
    85,
    16,
    35,
    6,
    1,
    9,
    106.0,
    6,
    13,
    34,
    62,
    11,
    24,
    6,
    6,
    28.33,
    5.33,
    11.67,
    2.00,
    0.33,
    3.00,
    35.33,
    2.00,
    4.33,
    0.548,
    1.000,
    0.458,
    1,
    0
  ),
  (
    'player-2',
    'season-2024-25',
    false,
    3,
    3,
    100,
    36,
    21,
    9,
    9,
    6,
    112.0,
    7,
    23,
    40,
    67,
    9,
    21,
    11,
    13,
    33.33,
    12.00,
    7.00,
    3.00,
    3.00,
    2.00,
    37.33,
    2.33,
    7.67,
    0.597,
    0.846,
    0.429,
    2,
    0
  )
on conflict (player_id, season_id) do nothing;

-- ============================================
-- INSERT SAMPLE AWARDS
-- ============================================
insert into awards (season_id, award_name, winner_player_id, winner_team_id, is_league_award) values
  ('season-2024-25', 'Player of the Week', 'player-1', 'team-lal', true),
  ('season-2024-25', 'Defensive Player of the Week', 'player-2', 'team-bos', true),
  ('season-2024-25', 'MVP', null, null, true), -- Award exists but winner not tracked yet
  ('season-2024-25', 'Finals MVP', null, null, true)
on conflict do nothing;

-- Link players to awards they won
insert into player_awards (player_id, award_id, season_id)
select 
  'player-1',
  id,
  'season-2024-25'
from awards
where award_name = 'Player of the Week' and season_id = 'season-2024-25'
on conflict do nothing;

insert into player_awards (player_id, award_id, season_id)
select 
  'player-2',
  id,
  'season-2024-25'
from awards
where award_name = 'Defensive Player of the Week' and season_id = 'season-2024-25'
on conflict do nothing;

-- ============================================
-- INSERT SAMPLE PLAYOFF SERIES
-- ============================================
insert into playoff_series (
  id,
  season_id,
  round_name,
  round_number,
  team1_id,
  team2_id,
  team1_wins,
  team2_wins,
  winner_team_id,
  is_complete
) values
  (
    'series-2024-25-round1-lakers-warriors',
    'season-2024-25',
    'Round 1',
    1,
    'team-lal',
    'team-gsw',
    4,
    2,
    'team-lal',
    true
  ),
  (
    'series-2024-25-round1-celtics-heat',
    'season-2024-25',
    'Round 1',
    1,
    'team-bos',
    'team-mia',
    4,
    1,
    'team-bos',
    true
  ),
  (
    'series-2024-25-round2-lakers-suns',
    'season-2024-25',
    'Conference Semifinals',
    2,
    'team-lal',
    'team-phx',
    2,
    1,
    null,
    false
  )
on conflict (id) do nothing;

-- Update playoff game to link to series
update player_game_stats
set playoff_series_id = 'series-2024-25-round2-lakers-suns',
    playoff_game_number = 1
where player_id = 'player-1' 
  and opponent_team_name = 'Phoenix Suns'
  and is_playoff_game = true;

update player_game_stats
set playoff_series_id = 'series-2024-25-round1-celtics-heat',
    playoff_game_number = 1
where player_id = 'player-2'
  and opponent_team_name = 'Miami Heat'
  and is_playoff_game = true;

