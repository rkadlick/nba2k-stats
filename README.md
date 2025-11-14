# 🟣 2KCompare

**NBA 2K25 MyPlayer Stat Tracking & Comparison App**

A private, two-user web application for tracking and comparing NBA 2K25 MyPlayer statistics side-by-side.

## 🏀 Features

- **Two-user authentication** via Supabase Auth
- **Side-by-side stat comparison** with dynamic stat tables
- **Season organization** (2024–25, 2025–26, etc.)
- **Team color theming** for player panels
- **Flexible stat tracking** using JSON (supports unlimited stat fields)
- **Career highs** and **season awards** tracking
- **Playoff tree visualization** (placeholder data)
- **Mock mode** for offline testing without Supabase

## 🔧 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Forms:** React Hook Form
- **Tables:** React Table (@tanstack/react-table)

## 📋 Requirements

- Node.js 18+ 
- npm or yarn
- Supabase account (for production use, optional for local mock mode)

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

**Note:** If you don't create `.env.local`, the app will run in **mock mode** with demo data (no authentication required).

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

- **With Supabase:** Navigate to `/login` to authenticate
- **Mock Mode:** Navigate to `/login` and click "Sign In" (no credentials needed)

## 🗄️ Supabase Setup

**📖 For complete setup instructions, see [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md)**

**⚡ Quick start? See [`QUICK_START_SUPABASE.md`](./QUICK_START_SUPABASE.md)**

### Quick Overview

1. **Get credentials**: Supabase Dashboard → Settings → API
2. **Create `.env.local`** with your Project URL and anon key
3. **Run schema**: SQL Editor → Copy `supabase/schema.sql` → Run
4. **Create users**: Authentication → Users → Add 2 users
5. **Seed data**: SQL Editor → Copy `supabase/seed.sql` (update user IDs) → Run
6. **Test**: `npm run dev` → Login at `http://localhost:3000/login`

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
│   ├── StatTable.tsx       # Dynamic stat table
│   ├── SeasonSelector.tsx # Season dropdown
│   └── PlayoffTree.tsx    # Playoff bracket visualization
├── lib/
│   ├── supabaseClient.ts  # Supabase client setup
│   ├── mockData.ts        # Mock data for offline mode
│   └── types.ts           # TypeScript type definitions
├── supabase/
│   ├── schema.sql         # Database schema
│   └── seed.sql           # Sample data seed script
└── public/                 # Static assets
```

## 🎮 Usage

### Viewing Stats

- **Split View:** Default side-by-side comparison of both players
- **Single View:** Focus on one player at a time
- **Combined View:** Both players plus playoff tree

### Adding Stats

Currently, stats must be added directly to the database. Future versions will include a UI for adding games.

Example stat JSON structure:
```json
{
  "points": 28,
  "rebounds": 5,
  "assists": 12,
  "steals": 2,
  "blocks": 0,
  "turnovers": 3,
  "minutes": 36,
  "fg_made": 11,
  "fg_attempted": 20,
  "threes_made": 4,
  "threes_attempted": 8
}
```

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
- Tag releases: `git tag v0.1.0 -m "Initial MVP"`

## 🧪 Mock Mode

When Supabase credentials are not configured, the app automatically runs in **mock mode**:

- No authentication required
- Uses demo data from `lib/mockData.ts`
- Full UI functionality for testing
- Perfect for local development and UI testing

## 📝 Database Schema

The app uses the following main tables:

- `users` - User profiles
- `teams` - NBA teams with colors
- `seasons` - Season data (2024–25, etc.)
- `players` - Player profiles linked to users
- `player_stats` - Flexible JSON-based game stats
- `season_awards` - Awards per season

See `supabase/schema.sql` for full schema details.

## 🎨 Customization

### Team Colors

Update team colors in the `teams` table. Colors are used to theme player panels.

### Adding New Stats

Simply add new keys to the `stats` JSON field in `player_stats`. The UI will automatically display all stat keys found in the data.

## 🐛 Troubleshooting

**App shows mock data even with Supabase configured:**
- Check that `.env.local` exists and has correct variable names
- Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- Restart the dev server after changing environment variables

**Authentication not working:**
- Verify Supabase Auth is enabled in your project
- Check that users exist in Supabase Auth
- Ensure RLS (Row Level Security) policies allow access (if enabled)

**Stats not displaying:**
- Verify data exists in `player_stats` table
- Check that `season_id` matches selected season
- Ensure `player_id` matches player records

## 📄 License

Private project - All rights reserved

## 🤝 Contributing

This is a private two-user application. For questions or issues, contact the repository owner.

---

**Built with ❤️ for NBA 2K25 stat tracking**
