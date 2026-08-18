# 🏀 NBA2K Career Stats Compared

A full-stack stat-tracking application built to record, compare, and visualize NBA 2K MyCareer statistics across multiple seasons. The app uses Next.js and Supabase to support authenticated player-specific stat entry, relational season/game data, and public read-only viewing of dashboards, trends, and playoff history.

It started as a practical solution to a real problem: NBA 2K does not preserve complete career stats across games, so my friend and I built this to track long-term performance over time. The app is actively used by both of us, and I’m sharing it publicly as a portfolio project to show the product and architecture behind it.

**Live site:** [https://nba.rtpdreamteam.com](https://nba.rtpdreamteam.com)

![NBA2K Career Stats Compared screenshot](public/nba-stats-screenshot-08-2026.jpg)

## Features
- **Public read-only viewing** — anyone can browse player stats, trends, awards, and playoff history without an account
- **Authenticated player-specific access** — Supabase Auth and row-level security restrict edit access to each player’s own data
- **Game stat CRUD workflows** — add, edit, and delete individual game entries with toast feedback and update flows
- **Relational stat tracking** — manage seasons, games, awards, playoff series, career highs, and derived season totals
- **Side-by-side comparison views** — compare both players across dynamic stat tables and trend views
- **Trend analysis** — visualize performance over the last 5/10/20 games or across a full season
- **Season totals and career highs** — support both calculated values and manual overrides where needed
- **Playoff bracket visualization** — view and manage seeded playoff structures with series outcomes and player context
- **AI headline generation logs** — track prompt/response metadata for generated game headlines

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS v4
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth

## Architecture Overview

This project uses a Next.js App Router frontend with Supabase as the backend layer for PostgreSQL, authentication, and row-level security.

Core architecture decisions:
- **Frontend:** Next.js renders the dashboard UI, stat views, edit workflows, and playoff visualizations
- **Backend/data layer:** Supabase stores relational player, season, game, award, and playoff data
- **Authentication:** Supabase Auth manages login and session state
- **Authorization:** row-level security policies restrict write access so each authenticated user can only edit their own player data
- **Public access model:** app data is readable in public mode, while authenticated users can manage only their own records
- **Server logic:** most data interactions happen directly through Supabase, with a dedicated API route for AI-generated headlines

This approach kept the app lightweight and fast to build while still enforcing real authorization rules at the database layer.

## Local Setup

### 1. Clone and Install

```bash
git clone <https://github.com/rkadlick/nba2k-stats>
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

## Supabase Setup

Database schema and supporting SQL files are available in the `supabase/` directory, including schema creation, seed data, and reference documentation.

Additional documentation:
- `supabase/TABLES.md`
- `supabase/POLICIES.md`
- `supabase/TRIGGERS.md`
- `supabase/FUNCTIONS.md`

## Project Structure


```
nba2k-stats/
├── app/
│   ├── globals.css        # Global CSS styles
│   ├── layout.tsx         # Root layout component
│   ├── login/
│   │   └── page.tsx       # Authentication page
│   └── page.tsx           # Main dashboard (split-view)
├── components/
│   ├── add-game-modal/    # Add game modal components
│   │   ├── BasicInfoSection.tsx
│   │   ├── index.tsx
│   │   ├── ModalFooter.tsx
│   │   ├── PlayoffSection.tsx
│   │   └── StatsSection.tsx
│   ├── edit-stats-modal/  # Edit stats modal components
│   │   ├── AwardsTab.tsx
│   │   ├── CareerHighsTab.tsx
│   │   ├── GamesTab.tsx
│   │   ├── index.tsx
│   │   ├── PlayoffTreeTab.tsx
│   │   └── SeasonTotalsTab.tsx
│   ├── ErrorBoundary.tsx   # Error boundary component
│   ├── FaviconSwitcher.tsx # Dynamic favicon component
│   ├── Footer.tsx          # Footer component
│   ├── Header.tsx          # Header component
│   ├── LoadingState.tsx    # Loading state component
│   ├── player-panel/       # Player panel components
│   │   ├── career-section/
│   │   │   ├── index.tsx
│   │   │   └── views/
│   │   │       ├── AwardView.tsx
│   │   │       ├── CareerViewSwitcher.tsx
│   │   │       ├── Overview.tsx
│   │   │       ├── PlayoffView.tsx
│   │   │       └── SplitsView.tsx
│   │   └── stats-section/
│   │       ├── index.tsx
│   │       ├── stat-table/
│   │       │   ├── GameHighs.tsx
│   │       │   ├── GameLog.tsx
│   │       │   ├── index.tsx
│   │       │   └── SeasonTotals.tsx
│   │       └── views/
│   │           ├── FullView.tsx
│   │           ├── HomeAwayView.tsx
│   │           ├── KeyGameView.tsx
│   │           ├── LeagueAwards.tsx
│   │           ├── NbaCupView.tsx
│   │           ├── OvertimeView.tsx
│   │           ├── PlayoffsView.tsx
│   │           ├── SeasonView.tsx
│   │           ├── SimulatedView.tsx
│   │           ├── StatisticsViewSwitcher.tsx
│   │           └── WinLossView.tsx
│   ├── playoff-tree/       # Playoff bracket components
│   │   ├── FinalsSection.tsx
│   │   ├── index.tsx
│   │   ├── MatchupCard.tsx
│   │   ├── PlayInColumn.tsx
│   │   └── RoundColumn.tsx
│   ├── SeasonSelector.tsx  # Season dropdown component
│   ├── SupabaseNotConfigured.tsx # Supabase config notice
│   ├── TeamLogo.tsx        # Team logo component
│   ├── Toast.tsx           # Toast notification component
│   ├── ToastProvider.tsx   # Toast context provider
│   └── views/              # View components
│       ├── PlayerView.tsx
│       └── SplitView.tsx
├── hooks/                  # Custom React hooks
│   ├── auth/
│   │   └── useAuth.ts
│   ├── data/
│   │   ├── usePlayersData.ts
│   │   ├── useSeasonsData.ts
│   │   └── useStatsData.ts
│   ├── filter/
│   │   ├── usePlayerAwards.ts
│   │   ├── usePlayerStats.ts
│   │   └── usePlayoffSeries.ts
│   ├── ui/
│   │   ├── useGameFormSubmit.ts
│   │   ├── useGameManagement.ts
│   │   ├── useModalState.ts
│   │   ├── usePlayerSeasonSelection.ts
│   │   └── useViewState.ts
│   └── useFavicon.ts
├── lib/                    # Utility libraries
│   ├── helpers/
│   │   └── dateUtils.ts
│   ├── logger.ts           # Logging utility
│   ├── playerNameUtils.ts  # Player name utilities
│   ├── statHelpers.ts      # Stat calculation helpers
│   ├── supabaseClient.ts   # Supabase client setup
│   ├── teams.ts            # NBA team data
│   └── types.ts            # TypeScript type definitions
├── supabase/               # Database setup and seed data
│   ├── create_database.sql    # Complete database schema
│   ├── seed_data.sql          # Sample data seed script
│   ├── playoff_seed_data.sql  # Playoff bracket seed data
│   └── TEAM_IDS.md            # Team ID reference guide
└─── public/                     # Static assets

```


## Usage

### Viewing Stats

- **Split View:** Default side-by-side comparison of both players
- **Single View:** Focus on one player at a time with edit mode

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

## Database Schema

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

## Tradeoffs and Future Improvements

This project was built as a real two-user application first and a portfolio project second, so some parts of the implementation prioritize speed and usability over broader production hardening.

Planned improvements include:
- adding automated tests for stat calculations and key CRUD workflows
- introducing schema-based validation for form submissions and API inputs
- improving user-facing error handling and recovery flows
- expanding activity/history tracking beyond AI headline generation logs
- anything that comes to mind...

## Contributing

This project was built as a personal, two‑user tool and isn’t actively accepting external contributions right now.

If you’d like to explore the code, fork the repo, or adapt parts of it for your own projects — go for it!

If you have feedback or want to share something you’ve built from it, feel free to reach out.

## License

This project is released under the MIT License.

You’re welcome to use, modify, or adapt it for personal or educational purposes — attribution is appreciated but not required.
