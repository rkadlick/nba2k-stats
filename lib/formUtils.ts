/**
 * Shared form utilities and constants for the EditStatsModal
 */

import { SeasonTotals } from "@/lib/types";

/**
 * Season Totals Form Field Definitions
 */
export const SEASON_TOTALS_FIELDS = [
  {
    key: 'games_played' as keyof SeasonTotals,
    label: 'Games Played',
    showAverage: false,
  },
  {
    key: 'games_started' as keyof SeasonTotals,
    label: 'Games Started',
    showAverage: false,
  },
  {
    key: 'total_points' as keyof SeasonTotals,
    label: 'Points',
    showAverage: true,
    avgLabel: 'PPG',
  },
  {
    key: 'total_rebounds' as keyof SeasonTotals,
    label: 'Rebounds',
    showAverage: true,
    avgLabel: 'RPG',
  },
  {
    key: 'total_assists' as keyof SeasonTotals,
    label: 'Assists',
    showAverage: true,
    avgLabel: 'APG',
  },
  {
    key: 'total_steals' as keyof SeasonTotals,
    label: 'Steals',
    showAverage: true,
    avgLabel: 'SPG',
  },
  {
    key: 'total_blocks' as keyof SeasonTotals,
    label: 'Blocks',
    showAverage: true,
    avgLabel: 'BPG',
  },
  {
    key: 'total_turnovers' as keyof SeasonTotals,
    label: 'Turnovers',
    showAverage: true,
    avgLabel: 'TOPG',
  },
  {
    key: 'total_minutes' as keyof SeasonTotals,
    label: 'Minutes',
    showAverage: true,
    avgLabel: 'MPG',
    step: 0.1,
  },
  {
    key: 'total_fouls' as keyof SeasonTotals,
    label: 'Fouls',
    showAverage: true,
    avgLabel: 'FPG',
  },
  {
    key: 'total_plus_minus' as keyof SeasonTotals,
    label: '+/-',
    showAverage: true,
    avgLabel: '+/-PG',
  },
  {
    key: 'total_fg_made' as keyof SeasonTotals,
    label: 'FG Made',
    showAverage: false,
  },
  {
    key: 'total_fg_attempted' as keyof SeasonTotals,
    label: 'FG Attempted',
    showAverage: false,
    showPercentage: true,
  },
  {
    key: 'total_threes_made' as keyof SeasonTotals,
    label: '3PT Made',
    showAverage: false,
  },
  {
    key: 'total_threes_attempted' as keyof SeasonTotals,
    label: '3PT Attempted',
    showAverage: false,
    showPercentage: true,
  },
  {
    key: 'total_ft_made' as keyof SeasonTotals,
    label: 'FT Made',
    showAverage: false,
  },
  {
    key: 'total_ft_attempted' as keyof SeasonTotals,
    label: 'FT Attempted',
    showAverage: false,
    showPercentage: true,
  },
  {
    key: 'double_doubles' as keyof SeasonTotals,
    label: 'Double-Doubles',
    showAverage: false,
  },
  {
    key: 'triple_doubles' as keyof SeasonTotals,
    label: 'Triple-Doubles',
    showAverage: false,
  },
] as const;

/**
 * Career Highs Field Definitions
 */
export const CAREER_HIGHS_FIELDS = [
  { key: 'points', label: 'Points' },
  { key: 'rebounds', label: 'Rebounds' },
  { key: 'assists', label: 'Assists' },
  { key: 'steals', label: 'Steals' },
  { key: 'blocks', label: 'Blocks' },
  { key: 'minutes', label: 'Minutes' },
  { key: 'fg_made', label: 'Field Goals Made' },
  { key: 'threes_made', label: 'Three-Pointers Made' },
  { key: 'ft_made', label: 'Free Throws Made' },
] as const;

/**
 * Calculate percentages for shooting stats
 */
export function calculatePercentages(formData: {
  total_fg_made: number;
  total_fg_attempted: number;
  total_threes_made: number;
  total_threes_attempted: number;
  total_ft_made: number;
  total_ft_attempted: number;
}): {
  fg_percentage: number | undefined;
  ft_percentage: number | undefined;
  three_pt_percentage: number | undefined;
} {
  const fgPct = formData.total_fg_attempted > 0
    ? Number((formData.total_fg_made / formData.total_fg_attempted).toFixed(3))
    : undefined;

  const ftPct = formData.total_ft_attempted > 0
    ? Number((formData.total_ft_made / formData.total_ft_attempted).toFixed(3))
    : undefined;

  const threePct = formData.total_threes_attempted > 0
    ? Number((formData.total_threes_made / formData.total_threes_attempted).toFixed(3))
    : undefined;

  return {
    fg_percentage: fgPct,
    ft_percentage: ftPct,
    three_pt_percentage: threePct,
  };
}

/**
 * Calculate per-game averages from totals
 */
export function calculatePerGameAverages(
  formData: {
    games_played: number;
    total_points: number;
    total_rebounds: number;
    total_assists: number;
    total_steals: number;
    total_blocks: number;
    total_turnovers: number;
    total_minutes: number;
    total_fouls: number;
    total_plus_minus: number;
  }
): {
  avg_points: number | undefined;
  avg_rebounds: number | undefined;
  avg_assists: number | undefined;
  avg_steals: number | undefined;
  avg_blocks: number | undefined;
  avg_turnovers: number | undefined;
  avg_minutes: number | undefined;
  avg_fouls: number | undefined;
  avg_plus_minus: number | undefined;
} {
  const gamesPlayed = formData.games_played;

  if (gamesPlayed <= 0) {
    return {
      avg_points: undefined,
      avg_rebounds: undefined,
      avg_assists: undefined,
      avg_steals: undefined,
      avg_blocks: undefined,
      avg_turnovers: undefined,
      avg_minutes: undefined,
      avg_fouls: undefined,
      avg_plus_minus: undefined,
    };
  }

  return {
    avg_points: Number((formData.total_points / gamesPlayed).toFixed(1)),
    avg_rebounds: Number((formData.total_rebounds / gamesPlayed).toFixed(1)),
    avg_assists: Number((formData.total_assists / gamesPlayed).toFixed(1)),
    avg_steals: Number((formData.total_steals / gamesPlayed).toFixed(1)),
    avg_blocks: Number((formData.total_blocks / gamesPlayed).toFixed(1)),
    avg_turnovers: Number((formData.total_turnovers / gamesPlayed).toFixed(1)),
    avg_minutes: Number((formData.total_minutes / gamesPlayed).toFixed(1)),
    avg_fouls: Number((formData.total_fouls / gamesPlayed).toFixed(1)),
    avg_plus_minus: Number((formData.total_plus_minus / gamesPlayed).toFixed(1)),
  };
}

/**
 * Initialize season totals form with default values
 */
export function initializeSeasonTotalsForm(): {
  games_played: number;
  games_started: number;
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
  double_doubles: number;
  triple_doubles: number;
} {
  return {
    games_played: 0,
    games_started: 0,
    total_points: 0,
    total_rebounds: 0,
    total_assists: 0,
    total_steals: 0,
    total_blocks: 0,
    total_turnovers: 0,
    total_minutes: 0,
    total_fouls: 0,
    total_plus_minus: 0,
    total_fg_made: 0,
    total_fg_attempted: 0,
    total_threes_made: 0,
    total_threes_attempted: 0,
    total_ft_made: 0,
    total_ft_attempted: 0,
    double_doubles: 0,
    triple_doubles: 0,
  };
}

/**
 * Validate season totals form data
 */
export function validateSeasonTotalsForm(formData: {
  games_played: number;
  games_started: number;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (formData.games_started > formData.games_played) {
    errors.push('Games started cannot exceed games played');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
