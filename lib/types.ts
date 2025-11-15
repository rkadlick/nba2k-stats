export interface User {
  id: string;
  email: string;
  display_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface Team {
  id: string;
  name: string;
  primary_color?: string;
  secondary_color?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Season {
  id: string;
  year_start: number;
  year_end: number;
  champion_team_id?: string;
  champion_player_id?: string; // Finals MVP
  playoff_tree?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
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
  career_highs?: Record<string, number | string>; // Manual input
  created_at?: string;
  updated_at?: string;
}

export interface PlayerGameStats {
  id: string;
  player_id: string;
  season_id: string;
  game_date: string; // Date played (in-game date)
  opponent_team_id?: string;
  opponent_team_name?: string;
  is_home: boolean;
  is_win: boolean;
  player_score: number;
  opponent_score: number;
  is_key_game?: boolean;
  is_playoff_game?: boolean;
  playoff_series_id?: string;
  playoff_game_number?: number; // e.g., Game 3 of second round
  // Stats
  minutes?: number;
  points?: number;
  rebounds?: number;
  offensive_rebounds?: number;
  assists?: number;
  steals?: number;
  blocks?: number;
  turnovers?: number;
  fouls?: number;
  plus_minus?: number;
  fg_made?: number;
  fg_attempted?: number;
  threes_made?: number;
  threes_attempted?: number;
  ft_made?: number;
  ft_attempted?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SeasonTotals {
  id: string;
  player_id: string;
  season_id: string;
  is_manual_entry: boolean; // true = manually entered, false = calculated
  // Games
  games_played: number;
  games_started?: number;
  // Totals
  total_points: number;
  total_rebounds: number;
  total_assists: number;
  total_steals: number;
  total_blocks: number;
  total_turnovers: number;
  total_minutes: number;
  total_fouls: number;
  total_plus_minus: number;
  total_fg_made: number;
  total_fg_attempted: number;
  total_threes_made: number;
  total_threes_attempted: number;
  total_ft_made: number;
  total_ft_attempted: number;
  // Per game averages
  avg_points?: number;
  avg_rebounds?: number;
  avg_assists?: number;
  avg_steals?: number;
  avg_blocks?: number;
  avg_turnovers?: number;
  avg_minutes?: number;
  avg_fouls?: number;
  avg_plus_minus?: number;
  // Percentages
  fg_percentage?: number;
  ft_percentage?: number;
  three_pt_percentage?: number;
  // Special achievements
  double_doubles: number;
  triple_doubles: number;
  created_at?: string;
  updated_at?: string;
}

export interface Award {
  id: string;
  user_id: string; // Each user has their own awards
  season_id: string;
  award_name: string;
  winner_player_id?: string;
  winner_player_name?: string;
  winner_team_id?: string;
  winner_team_name?: string;
  is_league_award: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PlayerAward {
  id: string;
  player_id: string;
  award_id: string;
  season_id: string;
  created_at?: string;
}

export interface PlayoffSeries {
  id: string;
  player_id: string; // Each player has their own playoff bracket
  season_id: string;
  round_name: string;
  round_number: number;
  team1_id?: string;
  team1_name?: string;
  team1_seed?: number; // Regular season seed (1-10)
  team2_id?: string;
  team2_name?: string;
  team2_seed?: number; // Regular season seed (1-10)
  team1_wins: number;
  team2_wins: number;
  winner_team_id?: string;
  winner_team_name?: string;
  is_complete: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PlayerWithTeam extends Player {
  team?: Team;
}

export interface PlayerGameStatsWithDetails extends PlayerGameStats {
  opponent_team?: Team;
}

// Helper type for components that need award info with player linkage
export interface PlayerAwardInfo {
  id: string;
  player_id: string;
  season_id: string;
  award_name: string;
  award_id: string;
  created_at?: string;
}

// Legacy type alias for backward compatibility during migration
export type PlayerStatsWithDetails = PlayerGameStatsWithDetails;
export type SeasonAward = PlayerAwardInfo;

export type ViewMode = 'single' | 'split' | 'combined';

// Special season object for career view
export const CAREER_SEASON_ID = 'career';
