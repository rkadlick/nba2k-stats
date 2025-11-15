-- Migration: Update awards RLS policy to allow viewing all awards
-- This allows users to see awards entered by other users when viewing their players
-- Awards are still user-specific for creation/update/delete (only the user who created them can modify)

-- Drop the old policy
drop policy if exists "Users can view own awards" on awards;

-- Create new policy that allows all authenticated users to view all awards
create policy "Users can view all awards"
  on awards for select
  using (auth.role() = 'authenticated');

-- Note: Insert, update, and delete policies remain unchanged
-- Users can only create/update/delete their own awards

