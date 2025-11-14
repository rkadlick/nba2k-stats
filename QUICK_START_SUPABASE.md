# ⚡ Quick Start: Supabase Connection

**TL;DR version** - Get connected in 5 minutes

## 1. Get Credentials (2 min)

1. Go to [app.supabase.com](https://app.supabase.com) → Create/Select Project
2. **Settings** → **API**
3. Copy:
   - Project URL: `https://xxxxx.supabase.co`
   - anon key: `eyJhbGci...`

## 2. Create `.env.local` (30 sec)

In project root, create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

## 3. Run Database Setup (2 min)

1. Supabase Dashboard → **SQL Editor**
2. Open `supabase/create_database.sql` → Copy → Paste → **Run**
   - This creates all tables, indexes, triggers, teams, and RLS policies in one go

## 4. Create Users (1 min)

1. **Authentication** → **Users** → **Add user**
2. Create 2 users:
   - `player1@example.com` / password
   - `player2@example.com` / password
3. **Auto Confirm User**: ✅ Checked

## 5. Seed Data (1 min)

1. **SQL Editor** → New query
2. Open `supabase/seed_data.sql`
3. **Replace** `'REPLACE_WITH_USER1_UUID'` and `'REPLACE_WITH_USER2_UUID'` with actual user UUIDs
4. Copy → Paste → **Run**

## 6. Test (30 sec)

```bash
npm run dev
```

Go to `http://localhost:3000/login` and sign in!

---

**Full guide**: See `SUPABASE_SETUP.md` for detailed instructions and troubleshooting.

