-- Migration: Update per-game average columns to support 3 decimal places
-- Run this in Supabase SQL Editor

-- Update avg_points from numeric(5,2) to numeric(6,3)
alter table season_totals 
  alter column avg_points type numeric(6,3);

-- Update avg_rebounds from numeric(5,2) to numeric(6,3)
alter table season_totals 
  alter column avg_rebounds type numeric(6,3);

-- Update avg_assists from numeric(5,2) to numeric(6,3)
alter table season_totals 
  alter column avg_assists type numeric(6,3);

-- Update avg_steals from numeric(4,2) to numeric(5,3)
alter table season_totals 
  alter column avg_steals type numeric(5,3);

-- Update avg_blocks from numeric(4,2) to numeric(5,3)
alter table season_totals 
  alter column avg_blocks type numeric(5,3);

-- Update avg_turnovers from numeric(4,2) to numeric(5,3)
alter table season_totals 
  alter column avg_turnovers type numeric(5,3);

-- Update avg_minutes from numeric(4,1) to numeric(5,3)
alter table season_totals 
  alter column avg_minutes type numeric(5,3);

-- Update avg_fouls from numeric(4,2) to numeric(5,3)
alter table season_totals 
  alter column avg_fouls type numeric(5,3);

-- Update avg_plus_minus from numeric(5,2) to numeric(6,3)
alter table season_totals 
  alter column avg_plus_minus type numeric(6,3);

