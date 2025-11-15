-- Migration: Add player_id to playoff_series table
-- This ensures each player has their own playoff bracket
-- NOTE: If you have existing playoff_series records, you'll need to manually assign player_id to them
-- or delete them and recreate them through the UI (which will now automatically assign player_id)

-- Add player_id column as nullable first (to handle existing records)
alter table playoff_series
  add column if not exists player_id text references players(id);

-- Add index for performance
create index if not exists idx_playoff_series_player_id on playoff_series(player_id);

-- IMPORTANT: If you have existing playoff_series records, you need to either:
-- 1. Delete them: DELETE FROM playoff_series;
-- 2. Or manually assign player_id to each record based on which player they belong to
--    Example: UPDATE playoff_series SET player_id = 'player-id-here' WHERE id = 'series-id-here';

-- After handling existing records, you can make it NOT NULL:
-- alter table playoff_series alter column player_id set not null;

-- Note: The application code now ensures player_id is always set for new entries

