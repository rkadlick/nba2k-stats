# 🟣 2KCompare

**NBA 2K25 MyPlayer Stat Tracking & Comparison App**

A private, two-user web application for tracking and comparing NBA 2K25 MyPlayer statistics side-by-side.

## 🏀 Features

- **Two-user authentication** via Supabase Auth
- **Side-by-side stat comparison** with dynamic stat tables
- **Game management** - Add, edit, and delete individual game statistics
- **Season organization** (2024–25, 2025–26, etc.) with automatic season assignment
- **Team color theming** for player panels
- **Comprehensive stat tracking** - Points, rebounds, assists, shooting percentages, and more
- **Season totals** - Manual entry or automatic calculation from games
- **Career highs** tracking and manual override
- **League awards** management per season
- **Playoff bracket visualization** with seeds and full tournament structure
- **Double-doubles and triple-doubles** automatic detection
- **Requires Supabase** - All data comes from database

## 🔧 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS v4
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **State Management:** React Hooks (useState, useEffect, useMemo)

## 📋 Requirements

- Node.js 18+ 
- npm or yarn
- Supabase account (required)

## 🚀 Local Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd nba2k-stats
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Note:** Supabase configuration is **required**. The app will not function without valid Supabase credentials.

See `.env.example` for reference.

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Navigate to `/login` to authenticate with your Supabase credentials.

## 🗄️ Supabase Setup

**📖 For complete setup instructions, see [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md)**

**⚡ Quick start? See [`QUICK_START_SUPABASE.md`](./QUICK_START_SUPABASE.md)**

### Quick Overview

1. **Get credentials**: Supabase Dashboard → Settings → API
2. **Create `.env.local`** with your Project URL and anon key
3. **Run schema**: SQL Editor → Copy `supabase/create_database.sql` → Run
4. **Create users**: Authentication → Users → Add 2 users
5. **Seed data**: SQL Editor → Copy `supabase/seed_data.sql` (update user IDs) → Run
6. **Optional**: Run `supabase/playoff_seed_data.sql` for sample playoff bracket data
7. **Test**: `npm run dev` → Login at `http://localhost:3000/login`

For detailed step-by-step instructions, troubleshooting, and security notes, see the full setup guide.

## 📁 Project Structure

```
nba2k-stats/
├── app/
│   ├── login/          # Authentication page
│   ├── page.tsx        # Main dashboard (split-view)
│   └── layout.tsx      # Root layout
├── components/
│   ├── PlayerPanel.tsx     # Player stat panel component
│   ├── StatTable.tsx       # Game stats table with season totals
│   ├── CareerView.tsx      # Career overview with all seasons
│   ├── AddGameModal.tsx    # Add/Edit game form
│   ├── EditStatsModal.tsx  # Edit stats, awards, career highs, playoffs
│   ├── PlayoffTree.tsx     # Playoff bracket visualization
│   ├── SeasonSelector.tsx  # Season dropdown
│   └── GameStatsTable.tsx  # Alternative game stats display
├── lib/
│   ├── supabaseClient.ts  # Supabase client setup
│   ├── types.ts           # TypeScript type definitions
│   ├── statHelpers.ts     # Stat calculation helpers
│   └── teamAbbreviations.ts # NBA team abbreviation mapping
├── supabase/
│   ├── create_database.sql    # Complete database schema and setup
│   ├── seed_data.sql          # Sample data seed script
│   ├── playoff_seed_data.sql # Sample playoff bracket data
│   └── TEAM_IDS.md            # Team ID reference guide
└── public/                     # Static assets
```

## 🎮 Usage

### Viewing Stats

- **Split View:** Default side-by-side comparison of both players
- **Single View:** Focus on one player at a time with edit mode
- **Combined View:** Both players plus playoff trees
- **Career View:** Select "Career" from season dropdown to see all-time stats

### Adding Games

1. Click **"Add Game"** button in the top bar
2. Select date (season auto-assigns based on date)
3. Choose opponent team
4. Enter scores (win/loss calculated automatically)
5. Fill in all stat fields
6. Click **"Add Game"** to save

### Editing Stats

1. Click **"Edit Stats"** button in the top bar
2. Navigate between tabs:
   - **Games:** Edit or delete individual games
   - **Season Totals:** Manual entry for seasons without games
   - **League Awards:** Add/edit awards for each season
   - **Career Highs:** Override career high statistics
   - **Playoff Tree:** Manage playoff bracket and series

### Playoff Bracket

- View playoff brackets for each season
- Each player sees their own team's playoff path
- Bracket shows seeds, series results, and player game stats
- Edit playoff series in the Edit Stats modal

## 🔒 Git & Version Control

### Initialize Git (Already Done)

The project comes with Git initialized. To set up a remote repository:

```bash
# Create a private repository on GitHub
# Then link it:
git remote add origin https://github.com/<your-username>/nba2k-stats.git
git branch -M main
git push -u origin main
```

### Best Practices

- Use feature branches: `git checkout -b feature/add-stat-input`
- Commit with descriptive messages: `git commit -m "feat: add stat input form"`
- Never commit `.env.local` (already in `.gitignore`)
- Tag releases: `git tag v1.0.0 -m "Version 1.0.0 Release"`

## ⚠️ Supabase Required

This app **requires** Supabase to be configured. Without `.env.local` with valid Supabase credentials:

- The app will show an error message
- Authentication will not work
- No data will be displayed

Make sure to follow the setup instructions in `SUPABASE_SETUP.md` before running the app.

## 📝 Database Schema

The app uses the following main tables:

- `users` - User profiles
- `teams` - NBA teams with colors (30 teams)
- `seasons` - Season data (2024–25, etc.)
- `players` - Player profiles linked to users
- `player_game_stats` - Individual game statistics
- `season_totals` - Season totals (manual or calculated)
- `awards` - League awards
- `player_awards` - Links players to awards
- `playoff_series` - Playoff bracket structure with seeds

See `supabase/create_database.sql` for full schema details.

## 🎨 Customization

### Team Colors

Update team colors in the `teams` table. Colors are used to theme player panels.

### Adding New Stats

The database schema supports all standard NBA statistics. New stat fields can be added to the `player_game_stats` table if needed.

## 🐛 Troubleshooting

**App shows error message:**
- Check that `.env.local` exists and has correct variable names
- Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- Restart the dev server after changing environment variables

**Authentication not working:**
- Verify Supabase Auth is enabled in your project
- Check that users exist in Supabase Auth
- Ensure RLS (Row Level Security) policies allow access

**Stats not displaying:**
- Verify data exists in `player_game_stats` table
- Check that `season_id` matches selected season
- Ensure `player_id` matches player records

**Playoff bracket not showing:**
- Verify playoff series exist in `playoff_series` table
- Check that `season_id` matches selected season
- Ensure teams are properly linked

## 📄 License

Private project - All rights reserved

## 🤝 Contributing

This is a private two-user application. For questions or issues, contact the repository owner.

---

**Built with ❤️ for NBA 2K25 stat tracking**

**Version 1.0.0**
