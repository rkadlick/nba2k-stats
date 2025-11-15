-- Migration: Add user_id to awards table
-- This ensures each user only sees/manages their own awards

-- Add user_id column
alter table awards
  add column if not exists user_id uuid references users(id);

-- Add index for performance
create index if not exists idx_awards_user_id on awards(user_id);

-- Update existing awards to set user_id based on winner_player_id
-- If winner_player_id exists, get the user_id from the players table
update awards
set user_id = (
  select players.user_id
  from players
  where players.id = awards.winner_player_id
  limit 1
)
where user_id is null and winner_player_id is not null;

-- IMPORTANT: For awards without a winner_player_id, you'll need to manually assign user_id
-- Or delete them and recreate through the UI (which will now automatically assign user_id)

-- After handling existing records, you can make it NOT NULL:
-- alter table awards alter column user_id set not null;

-- Update RLS policies to filter by user_id
drop policy if exists "Awards are viewable by everyone" on awards;
create policy "Users can view own awards"
  on awards for select
  using (user_id = auth.uid());

drop policy if exists "Authenticated users can insert awards" on awards;
create policy "Users can insert own awards"
  on awards for insert
  with check (user_id = auth.uid());

drop policy if exists "Authenticated users can update awards" on awards;
create policy "Users can update own awards"
  on awards for update
  using (user_id = auth.uid());

create policy "Users can delete own awards"
  on awards for delete
  using (user_id = auth.uid());

