# Migration Guide: Fix Teams and Seasons Table ID Types

If you already ran `schema.sql` before the tables were updated to use text IDs, you need to run this migration.

## Quick Fix (Recommended)

Run `migrate_all_to_text.sql` in your Supabase SQL Editor - this handles both teams and seasons:

1. Go to **SQL Editor** in Supabase
2. Click **"New query"**
3. Copy the entire contents of `supabase/migrate_all_to_text.sql`
4. Paste and click **"Run"**

This will:
- Change `teams.id` from `uuid` to `text`
- Change `seasons.id` from `uuid` to `text`
- Update all foreign key columns that reference teams and seasons
- Recreate all foreign key constraints

## Alternative: Run Migrations Separately

If you prefer to run them separately:

1. Run `migrate_teams_to_text.sql` first
2. Then run `migrate_seasons_to_text.sql`

## After Migration

Once the migration is complete, you can proceed with:
1. ✅ Run `teams.sql` - This will now work with text IDs
2. ✅ Run `seed.sql` - This will work correctly with text season IDs

## If You Haven't Run Schema Yet

If you haven't run `schema.sql` yet, just run the updated `schema.sql` file - it already has the correct text type for teams.id, so no migration needed.

## Verification

After running the migration, verify it worked:

```sql
-- Check teams table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'teams' AND column_name = 'id';
-- Should show: text

-- Try inserting a team (should work now)
INSERT INTO teams (id, name, primary_color, secondary_color) 
VALUES ('team-test', 'Test Team', '#000000', '#FFFFFF');
```

If the insert works, you're good to go!

