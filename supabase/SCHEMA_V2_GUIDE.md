# Schema v2 Migration Guide

This guide explains the new v2 schema and how to migrate from v1.

## What Changed

### New Structure

**Old**: Flexible JSON stats in `player_stats` table
**New**: Explicit columns for all stat fields in `player_game_stats` table

### New Tables

1. **`player_game_stats`** - Replaces `player_stats` with explicit columns
2. **`awards`** - League-wide awards with winner tracking
3. **`player_awards`** - Links players to awards they won
4. **`playoff_series`** - Structured playoff bracket data

### Enhanced Tables

- **`season_totals`** - Now has explicit columns for all stats, percentages, achievements
- **`seasons`** - Added `champion_player_id` for Finals MVP
- All tables now have `updated_at` timestamps

## Migration Steps

### For New Installations

1. Run `schema_v2.sql` - This is the complete new schema
2. Run `teams.sql` - Populate NBA teams
3. Run `seed_v2.sql` - Sample data (coming soon)
4. Run `rls_policies_v2.sql` - Security policies (coming soon)

### For Existing Installations

1. **Backup your data first!**
2. Run `migrate_to_v2.sql` - This migrates existing data
3. Verify data migrated correctly
4. Update your application code to use new types
5. (Optional) Drop old tables after verification:
   ```sql
   drop table if exists player_stats;
   drop table if exists season_awards;
   ```

## New Game Stats Fields

Each game now tracks:

- **Game Info**: date, opponent, home/away, win/loss, score, key game flag
- **Playoff Info**: playoff flag, series ID, game number in series
- **Stats**: All stats as explicit columns (no JSON)

## Season Totals

Now includes:
- Per game averages (calculated or manual)
- Totals
- Percentages (FG%, FT%, 3PT%)
- Games started/played
- Double doubles, triple doubles
- Manual entry flag (for past seasons)

## Awards System

Two tables:
- **`awards`** - All awards for a season (who won, what team)
- **`player_awards`** - Which awards each player won

This allows tracking:
- Awards the player won
- Awards other players won (for comparison)
- League-wide award history

## Playoff Series

New `playoff_series` table tracks:
- Round name and number
- Teams in series
- Wins for each team
- Winner
- Completion status

Games link to series via `playoff_series_id` and `playoff_game_number`.

## Next Steps

After migration:
1. Update application code to use `PlayerGameStats` type
2. Update components to display new stat fields
3. Add UI for entering games with all new fields
4. Add UI for manual season totals entry
5. Update playoff tree to use new series structure

