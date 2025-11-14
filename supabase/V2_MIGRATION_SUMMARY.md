# Schema v2 Complete Migration Summary

## Overview

Schema v2 completely redesigns the stat tracking system with explicit columns, detailed game stats, comprehensive season totals, and a structured awards/playoff system.

## Key Changes

### 1. Game Stats (`player_game_stats`)

**Replaces**: `player_stats` table with JSON stats

**New Structure**:
- Explicit columns for all stats (no JSON)
- Game date, score, win/loss tracking
- Key game flag
- Playoff game matching (series ID + game number)
- All stat fields as columns

### 2. Season Totals (`season_totals`)

**Enhanced with**:
- Explicit total columns
- Per game averages
- Percentages (FG%, FT%, 3PT%)
- Games started vs played
- Double doubles, triple doubles
- Manual entry flag (for past seasons)

### 3. Awards System

**New Tables**:
- `awards` - All awards for a season (who won, what team)
- `player_awards` - Links players to awards they won

**Features**:
- Track awards player won
- Track awards other players won (for comparison)
- Finals MVP tracking
- Winner player name + team

### 4. Playoff Series

**New Table**: `playoff_series`
- Structured playoff bracket
- Round tracking
- Series wins/losses
- Links games to series via `playoff_series_id` + `playoff_game_number`

### 5. Metadata

- All tables now have `updated_at` timestamps
- Automatic triggers update `updated_at` on changes
- Unique constraints where needed

## Migration Path

### Option 1: Fresh Install (Recommended if starting new)

1. Run `schema_v2.sql`
2. Run `teams.sql`
3. Run `seed_v2.sql` (when available)
4. Run `rls_policies_v2.sql`

### Option 2: Migrate Existing Data

1. **Backup your database first!**
2. Run `migrate_to_v2.sql`
3. Verify data migrated correctly
4. Update application code
5. (Optional) Drop old tables after verification

## New Stat Fields Per Game

- `game_date` - Date played (in-game date)
- `is_win` - Win/loss boolean
- `player_score` - Player's team score
- `opponent_score` - Opponent score
- `is_key_game` - Key game flag
- `playoff_game_number` - Game number in series (e.g., Game 3)
- `offensive_rebounds` - Separate from total rebounds
- `fouls` - Personal fouls
- `plus_minus` - Plus/minus rating
- `ft_made` / `ft_attempted` - Free throws

## Season Totals Fields

**Totals**: All stat totals as explicit columns
**Averages**: Per game averages
**Percentages**: FG%, FT%, 3PT%
**Games**: `games_played`, `games_started`
**Achievements**: `double_doubles`, `triple_doubles`
**Flag**: `is_manual_entry` - true for past seasons without games

## Awards Structure

**`awards` table**:
- Award name (MVP, Finals MVP, DPOY, etc.)
- Winner player ID/name
- Winner team ID/name
- League award flag

**`player_awards` table**:
- Links players to awards they won
- Allows querying "which awards did this player win?"

## Playoff Series Structure

**`playoff_series` table**:
- Round name and number
- Two teams (with IDs or names)
- Win counts for each team
- Winner tracking
- Completion status

**Game linking**:
- Games link via `playoff_series_id`
- `playoff_game_number` indicates which game in series (1-7)

## Application Updates Needed

1. Update data loading to use `player_game_stats` instead of `player_stats`
2. Update components to use new `PlayerGameStats` type
3. Create UI for entering games with all new fields
4. Create UI for manual season totals entry
5. Update playoff tree to use `playoff_series` table
6. Update awards display to use new awards structure

## Files Created

- `schema_v2.sql` - Complete new schema
- `migrate_to_v2.sql` - Migration script for existing data
- `rls_policies_v2.sql` - Security policies for v2
- `SCHEMA_V2_GUIDE.md` - Detailed guide
- `V2_MIGRATION_SUMMARY.md` - This file

## Next Steps

1. Review the new schema
2. Decide: fresh install or migrate?
3. Run appropriate SQL scripts
4. Update application code
5. Test thoroughly

