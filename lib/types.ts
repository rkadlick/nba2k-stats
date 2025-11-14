export interface User {
  id: string;
  email: string;
  display_name: string;
  created_at?: string;
}

export interface Team {
  id: string;
  name: string;
  primary_color?: string;
  secondary_color?: string;
}

export interface Season {
  id: string;
  year_start: number;
  year_end: number;
  champion_team_id?: string;
  playoff_tree?: Record<string, unknown>;
  created_at?: string;
}

export interface Player {
  id: string;
  user_id: string;
  player_name: string;
  position?: string;
  height?: number;
  weight?: number;
  archetype?: string;
  team_id?: string;
  career_highs?: Record<string, number | string>;
  created_at?: string;
}

export interface PlayerStats {
  id: string;
  player_id: string;
  season_id: string;
  opponent_team_id?: string;
  opponent_team_name?: string; // For display when team not in DB
  is_home: boolean; // true = home (vs), false = away (@)
  stats: Record<string, number | string | null>;
  is_playoff_game?: boolean;
  playoff_series_id?: string; // Link to playoff series
  created_at?: string;
}

export interface SeasonTotals {
  id: string;
  player_id: string;
  season_id: string;
  stats: Record<string, number | string | null>; // Season totals
  games_played?: number;
  created_at?: string;
}

export interface SeasonAward {
  id: string;
  player_id: string;
  season_id: string;
  award_name: string;
  created_at?: string;
}

export interface PlayerWithTeam extends Player {
  team?: Team;
}

export interface PlayerStatsWithDetails extends PlayerStats {
  opponent_team?: Team;
}

export type ViewMode = 'single' | 'split' | 'combined';

