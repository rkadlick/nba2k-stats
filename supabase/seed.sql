-- 2KCompare Seed Data
-- Run this AFTER schema.sql AND teams.sql to populate sample data
-- IMPORTANT: Run teams.sql first to populate all NBA teams

-- Insert users (Note: You'll need to create these users in Supabase Auth first)
-- IMPORTANT: Replace these UUIDs with actual user IDs from auth.users
-- To get user IDs: Supabase Dashboard → Authentication → Users → Click on user → Copy UUID
insert into users (id, email, display_name) values
  ('REPLACE_WITH_USER1_UUID', 'player1@example.com', 'Player One'),
  ('REPLACE_WITH_USER2_UUID', 'player2@example.com', 'Player Two')
on conflict (id) do nothing;

-- Insert season
insert into seasons (id, year_start, year_end, playoff_tree) values
  (
    'season-2024-25',
    2024,
    2025,
    '{
      "round1": [
        {"team1": "Los Angeles Lakers", "team2": "Golden State Warriors", "winner": "Los Angeles Lakers"},
        {"team1": "Boston Celtics", "team2": "Miami Heat", "winner": "Boston Celtics"}
      ],
      "round2": [
        {"team1": "Los Angeles Lakers", "team2": "Phoenix Suns", "winner": null},
        {"team1": "Boston Celtics", "team2": "Milwaukee Bucks", "winner": null}
      ]
    }'::jsonb
  )
on conflict (id) do nothing;

-- Insert players
-- Note: user_id references the UUIDs from the users table above
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

-- Insert sample stats for player 1 (Lakers player)
insert into player_stats (player_id, season_id, opponent_team_id, opponent_team_name, is_home, stats, is_playoff_game, playoff_series_id) values
  (
    'player-1',
    'season-2024-25',
    'team-bos', -- Boston Celtics
    'Boston Celtics',
    true,
    '{"points": 28, "rebounds": 5, "assists": 12, "steals": 2, "blocks": 0, "turnovers": 3, "minutes": 36, "fg_made": 11, "fg_attempted": 20, "threes_made": 4, "threes_attempted": 8}'::jsonb,
    false,
    null
  ),
  (
    'player-1',
    'season-2024-25',
    'team-bos', -- Boston Celtics
    'Boston Celtics',
    false,
    '{"points": 35, "rebounds": 7, "assists": 15, "steals": 3, "blocks": 1, "turnovers": 2, "minutes": 38, "fg_made": 14, "fg_attempted": 24, "threes_made": 5, "threes_attempted": 10}'::jsonb,
    false,
    null
  ),
  (
    'player-1',
    'season-2024-25',
    'team-phx', -- Phoenix Suns
    'Phoenix Suns',
    true,
    '{"points": 22, "rebounds": 4, "assists": 8, "steals": 1, "blocks": 0, "turnovers": 4, "minutes": 32, "fg_made": 9, "fg_attempted": 18, "threes_made": 2, "threes_attempted": 6}'::jsonb,
    true,
    'series-lakers-suns'
  );

-- Insert sample stats for player 2 (Celtics player)
insert into player_stats (player_id, season_id, opponent_team_id, opponent_team_name, is_home, stats, is_playoff_game, playoff_series_id) values
  (
    'player-2',
    'season-2024-25',
    'team-lal', -- Los Angeles Lakers
    'Los Angeles Lakers',
    false,
    '{"points": 32, "rebounds": 10, "assists": 6, "steals": 2, "blocks": 3, "turnovers": 2, "minutes": 37, "fg_made": 13, "fg_attempted": 22, "threes_made": 3, "threes_attempted": 7}'::jsonb,
    false,
    null
  ),
  (
    'player-2',
    'season-2024-25',
    'team-lal', -- Los Angeles Lakers
    'Los Angeles Lakers',
    true,
    '{"points": 27, "rebounds": 12, "assists": 8, "steals": 4, "blocks": 2, "turnovers": 3, "minutes": 35, "fg_made": 11, "fg_attempted": 19, "threes_made": 2, "threes_attempted": 5}'::jsonb,
    false,
    null
  ),
  (
    'player-2',
    'season-2024-25',
    'team-mia', -- Miami Heat
    'Miami Heat',
    true,
    '{"points": 41, "rebounds": 14, "assists": 7, "steals": 3, "blocks": 4, "turnovers": 1, "minutes": 40, "fg_made": 16, "fg_attempted": 26, "threes_made": 4, "threes_attempted": 9}'::jsonb,
    true,
    'series-celtics-heat'
  );

-- Insert sample awards
insert into season_awards (player_id, season_id, award_name) values
  ('player-1', 'season-2024-25', 'Player of the Week'),
  ('player-2', 'season-2024-25', 'Defensive Player of the Week');

