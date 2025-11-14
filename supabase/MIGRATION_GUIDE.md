# Migration Guide: Fix Teams Table ID Type

If you already ran `schema.sql` before the teams table was updated to use text IDs, you need to run this migration.

## Quick Fix

Run `migrate_teams_to_text.sql` in your Supabase SQL Editor:

1. Go to **SQL Editor** in Supabase
2. Click **"New query"**
3. Copy the entire contents of `supabase/migrate_teams_to_text.sql`
4. Paste and click **"Run"**

This will:
- Change `teams.id` from `uuid` to `text`
- Update all foreign key columns that reference teams
- Recreate all foreign key constraints

## After Migration

Once the migration is complete, you can proceed with:
1. ✅ Run `teams.sql` - This will now work with text IDs
2. ✅ Run `seed.sql` - This will work correctly

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

