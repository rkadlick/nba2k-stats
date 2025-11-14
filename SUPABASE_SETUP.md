# 🗄️ Supabase Setup Guide for 2KCompare

Complete step-by-step guide to connect your 2KCompare app to Supabase.

## Prerequisites

- ✅ Supabase account (you already have this)
- ✅ Node.js 18+ installed
- ✅ Project dependencies installed (`npm install`)

---

## Step 1: Create a New Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click **"New Project"**
3. Fill in the project details:
   - **Name**: `2kcompare` (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free tier is fine for development
4. Click **"Create new project"**
5. Wait 2-3 minutes for the project to initialize

---

## Step 2: Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** (gear icon in sidebar)
2. Click **"API"** in the settings menu
3. You'll see two important values:

   **Project URL**
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```

   **anon/public key**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4eHh4eCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQxNzY5MzIyLCJleHAiOjE5NTczNDUzMjJ9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

4. **Copy both values** - you'll need them in the next step

---

## Step 3: Configure Environment Variables

1. In your project root directory (`nba2k-stats/`), create a file named `.env.local`
   ```bash
   touch .env.local
   ```

2. Open `.env.local` in your editor and add:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. Replace the values with your actual Project URL and anon key from Step 2

4. **Important**: `.env.local` is already in `.gitignore`, so it won't be committed to Git

---

## Step 4: Set Up Database Schema

1. In your Supabase dashboard, click **"SQL Editor"** in the sidebar
2. Click **"New query"**
3. Open the file `supabase/schema.sql` from your project
4. **Copy the entire contents** of `schema.sql`
5. Paste it into the SQL Editor
6. Click **"Run"** (or press `Ctrl/Cmd + Enter`)
7. You should see: ✅ "Success. No rows returned"

This creates all the necessary tables:
- `users`
- `teams`
- `seasons`
- `players`
- `player_stats`
- `season_totals`
- `season_awards`

---

## Step 4b: Populate NBA Teams

1. In the **SQL Editor**, click **"New query"**
2. Open the file `supabase/teams.sql` from your project
3. **Copy the entire contents** of `teams.sql`
4. Paste it into the SQL Editor
5. Click **"Run"**
6. You should see: ✅ "Success. 30 rows affected"

This populates all 30 NBA teams with their official colors:
- All teams are now available for selection
- Team IDs follow the pattern: `team-xxx` (e.g., `team-lal` for Lakers, `team-bos` for Celtics)

---

## Step 5: Enable Authentication

1. In Supabase dashboard, go to **"Authentication"** → **"Providers"**
2. Make sure **"Email"** provider is enabled (should be by default)
3. Optionally configure:
   - **"Confirm email"**: Toggle off for easier testing (not recommended for production)
   - **"Secure email change"**: Leave enabled

---

## Step 6: Create Your Two Users

### Option A: Via Supabase Dashboard (Recommended)

1. Go to **"Authentication"** → **"Users"**
2. Click **"Add user"** → **"Create new user"**
3. Fill in:
   - **Email**: `player1@example.com` (use real emails)
   - **Password**: Choose a secure password
   - **Auto Confirm User**: ✅ Check this (or you'll need to confirm emails)
4. Click **"Create user"**
5. Repeat for the second user: `player2@example.com`

### Option B: Via Sign-Up Flow (Future)

You can also create a sign-up page, but for now, manual creation is simpler.

---

## Step 7: Seed Initial Data

### 7a. Update User IDs in Seed File

1. Go back to **"Authentication"** → **"Users"**
2. Click on each user to see their **UUID** (looks like: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)
3. Open `supabase/seed.sql` in your project
4. Find these lines:
   ```sql
   insert into users (id, email, display_name) values
     ('REPLACE_WITH_USER1_UUID', 'player1@example.com', 'Player One'),
     ('REPLACE_WITH_USER2_UUID', 'player2@example.com', 'Player Two')
   ```
5. Replace `'REPLACE_WITH_USER1_UUID'` and `'REPLACE_WITH_USER2_UUID'` with the actual UUIDs from your Supabase users
6. Also replace the UUIDs in the `players` table insert statements (they reference the same user IDs)
7. Save the file

### 7b. Run Seed Script

1. Go back to **SQL Editor** in Supabase
2. Click **"New query"**
3. Open `supabase/seed.sql` from your project
4. **Copy the entire contents** (with your updated user IDs)
5. Paste into SQL Editor
6. Click **"Run"**

This will create:
- 1 season (2024-25)
- 2 players (linked to your users, assigned to Lakers and Celtics)
- Sample game stats (with proper team references)
- Sample awards

**Note**: Teams are already populated from `teams.sql`, so the seed file references existing team IDs like `team-lal` and `team-bos`.

---

## Step 7c: Set Up Row Level Security (RLS)

1. Go back to **SQL Editor** in Supabase
2. Click **"New query"**
3. Open `supabase/rls_policies.sql` from your project
4. **Copy the entire contents**
5. Paste into SQL Editor
6. Click **"Run"**

This sets up security policies so:
- Users can only modify their own player data
- Users can view all players/stats (for comparison)
- Teams and seasons are public read-only reference data
- All modifications require authentication

---

## Step 8: Verify Setup

1. **Restart your dev server** (if it's running):
   ```bash
   # Stop with Ctrl+C, then:
   npm run dev
   ```

2. Open `http://localhost:3000/login`

3. Try logging in with one of your user credentials:
   - Email: `player1@example.com`
   - Password: (the one you set)

4. You should see the dashboard with player stats!

---

## Step 9: Test Data Flow

### Check Database Tables

1. In Supabase dashboard, go to **"Table Editor"**
2. You should see all your tables populated:
   - `teams` - 2 teams
   - `seasons` - 1 season
   - `players` - 2 players
   - `player_stats` - 6 game records
   - `season_awards` - 2 awards

### Add More Data

You can manually add data via:
- **Table Editor**: Click on any table → "Insert row"
- **SQL Editor**: Write INSERT queries
- **API**: Use Supabase client in your app (future feature)

---

## Troubleshooting

### ❌ "Invalid API key" error

- Check that `.env.local` exists and has correct values
- Make sure variable names are exactly: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart your dev server after changing `.env.local`

### ❌ "User not found" or authentication fails

- Verify users exist in **Authentication** → **Users**
- Check that email matches exactly (case-sensitive)
- Try resetting password in Supabase dashboard

### ❌ "Relation does not exist" error

- Make sure you ran `schema.sql` completely
- Check **Table Editor** to see if tables exist
- Re-run `schema.sql` if needed

### ❌ Data not showing

- Check that `seed.sql` ran successfully
- Verify user IDs in seed file match actual user UUIDs
- Check **Table Editor** to see if data exists
- Make sure you're logged in as the correct user

### ❌ Still seeing mock data

- Verify `.env.local` exists and has correct values
- Restart dev server: `npm run dev`
- Check browser console for errors
- Verify Supabase project is active (not paused)

---

## Security Notes

### Row Level Security (RLS)

RLS is configured via `rls_policies.sql`. The policies ensure:
- ✅ Users can only modify their own player data
- ✅ Users can view all players/stats (for comparison feature)
- ✅ Teams and seasons are public read-only
- ✅ All operations require authentication

To modify policies:
1. Go to **"Authentication"** → **"Policies"** in Supabase
2. View/edit policies per table
3. Or update `rls_policies.sql` and re-run

### API Keys

- **anon key**: Safe to expose in client-side code (already in `.env.local`)
- **service_role key**: **NEVER** expose this - it bypasses RLS
- Keep `.env.local` out of Git (already in `.gitignore`)

---

## Next Steps

### Add More Seasons

```sql
insert into seasons (year_start, year_end) values
  (2025, 2026),
  (2026, 2027);
```

### Add More Teams

```sql
insert into teams (name, primary_color, secondary_color) values
  ('Golden State Warriors', '#1D428A', '#FFC72C'),
  ('Miami Heat', '#98002E', '#F9A01B');
```

### Add Game Stats

Use the Table Editor or SQL:

```sql
insert into player_stats (
  player_id, 
  season_id, 
  opponent_team_name, 
  is_home, 
  stats
) values (
  'player-1-uuid',
  'season-2024-25',
  'Phoenix Suns',
  true,
  '{"points": 30, "rebounds": 8, "assists": 10}'::jsonb
);
```

---

## Quick Reference

### Environment Variables
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Key Files
- `supabase/schema.sql` - Database structure
- `supabase/seed.sql` - Sample data
- `.env.local` - Your credentials (not in Git)
- `lib/supabaseClient.ts` - Supabase client setup

### Supabase Dashboard Links
- **API Settings**: Settings → API
- **SQL Editor**: SQL Editor (sidebar)
- **Table Editor**: Table Editor (sidebar)
- **Authentication**: Authentication → Users
- **Policies**: Authentication → Policies

---

## Support

If you run into issues:
1. Check the **Troubleshooting** section above
2. Check Supabase logs: **"Logs"** in sidebar
3. Check browser console for errors
4. Verify all steps were completed in order

---

**You're all set!** 🎉 Your app should now be connected to Supabase and ready to track NBA 2K stats!

