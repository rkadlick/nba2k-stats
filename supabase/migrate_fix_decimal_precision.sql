-- Migration: Fix decimal precision for per-game averages and percentages
-- Run this in Supabase SQL Editor after migrate_per_game_decimals.sql

-- Revert per-game averages back to 1 decimal place (they were originally 2, then changed to 3)
-- Now setting to 1 decimal place as per requirements

-- Update avg_points from numeric(6,3) to numeric(5,1)
alter table season_totals 
  alter column avg_points type numeric(5,1);

-- Update avg_rebounds from numeric(6,3) to numeric(5,1)
alter table season_totals 
  alter column avg_rebounds type numeric(5,1);

-- Update avg_assists from numeric(6,3) to numeric(5,1)
alter table season_totals 
  alter column avg_assists type numeric(5,1);

-- Update avg_steals from numeric(5,3) to numeric(4,1)
alter table season_totals 
  alter column avg_steals type numeric(4,1);

-- Update avg_blocks from numeric(5,3) to numeric(4,1)
alter table season_totals 
  alter column avg_blocks type numeric(4,1);

-- Update avg_turnovers from numeric(5,3) to numeric(4,1)
alter table season_totals 
  alter column avg_turnovers type numeric(4,1);

-- Update avg_minutes from numeric(5,3) to numeric(4,1)
alter table season_totals 
  alter column avg_minutes type numeric(4,1);

-- Update avg_fouls from numeric(5,3) to numeric(4,1)
alter table season_totals 
  alter column avg_fouls type numeric(4,1);

-- Update avg_plus_minus from numeric(6,3) to numeric(5,1)
alter table season_totals 
  alter column avg_plus_minus type numeric(5,1);

-- Percentages are already numeric(5,3) which is correct for 3 decimal places
-- No changes needed for fg_percentage, ft_percentage, three_pt_percentage

