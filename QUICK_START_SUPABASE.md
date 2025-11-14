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

## 3. Run Schema (2 min)

1. Supabase Dashboard → **SQL Editor**
2. Open `supabase/schema.sql` → Copy → Paste → **Run**
3. **New query**: Open `supabase/teams.sql` → Copy → Paste → **Run** (populates all 30 NBA teams)

## 4. Create Users (1 min)

1. **Authentication** → **Users** → **Add user**
2. Create 2 users:
   - `player1@example.com` / password
   - `player2@example.com` / password
3. **Auto Confirm User**: ✅ Checked

## 5. Seed Data (1 min)

1. **SQL Editor** → New query
2. Open `supabase/seed.sql`
3. **Replace** `'user-1'` and `'user-2'` with actual user UUIDs
4. Copy → Paste → **Run**

## 6. Test (30 sec)

```bash
npm run dev
```

Go to `http://localhost:3000/login` and sign in!

---

**Full guide**: See `SUPABASE_SETUP.md` for detailed instructions and troubleshooting.

