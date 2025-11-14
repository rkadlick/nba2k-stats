# Migration Guide

If you already ran `schema.sql` before it was updated, run this ONE migration script.

## Run Migration

1. Go to **SQL Editor** in Supabase
2. Click **"New query"**
3. Copy the entire contents of `supabase/migrate_to_text_ids.sql`
4. Paste and click **"Run"**

This fixes everything at once:
- Changes `teams.id` from uuid to text
- Changes `seasons.id` from uuid to text  
- Changes `players.id` from uuid to text
- Updates all foreign keys

## After Migration

1. ✅ Run `teams.sql`
2. ✅ Run `seed.sql` (update user UUIDs first)
