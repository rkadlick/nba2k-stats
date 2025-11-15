-- Migration: Add player_id to awards table and remove player_awards table
-- This consolidates to a single awards table where player_id links awards to specific players/leagues

-- Step 1: Add player_id column to awards table
alter table awards
  add column if not exists player_id text references players(id);

-- Step 2: Migrate data from player_awards to awards table
-- Set player_id on awards based on player_awards relationships
update awards
set player_id = (
  select player_awards.player_id
  from player_awards
  where player_awards.award_id = awards.id
  limit 1
)
where player_id is null;

-- Step 3: Add index for performance
create index if not exists idx_awards_player_id on awards(player_id);

-- Step 4: Drop the player_awards table (no longer needed)
drop table if exists player_awards cascade;

-- Step 5: Update RLS policies if needed (they should already filter by user_id)
-- The existing RLS policies should be sufficient since they filter by user_id

