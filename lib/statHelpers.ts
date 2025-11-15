import { PlayerGameStats } from './types';

/**
 * Extract stats from PlayerGameStats into a flat object format
 * This converts the new column-based structure to the old stats object format
 * for backward compatibility with components
 */
export function getStatsFromGame(game: PlayerGameStats): Record<string, number | string | null> {
  const stats: Record<string, number | string | null> = {};
  
  // Add all stat fields if they exist
  if (game.minutes !== undefined && game.minutes !== null) stats.minutes = game.minutes;
  if (game.points !== undefined && game.points !== null) stats.points = game.points;
  if (game.rebounds !== undefined && game.rebounds !== null) stats.rebounds = game.rebounds;
  if (game.offensive_rebounds !== undefined && game.offensive_rebounds !== null) stats.offensive_rebounds = game.offensive_rebounds;
  if (game.assists !== undefined && game.assists !== null) stats.assists = game.assists;
  if (game.steals !== undefined && game.steals !== null) stats.steals = game.steals;
  if (game.blocks !== undefined && game.blocks !== null) stats.blocks = game.blocks;
  if (game.turnovers !== undefined && game.turnovers !== null) stats.turnovers = game.turnovers;
  if (game.fouls !== undefined && game.fouls !== null) stats.fouls = game.fouls;
  if (game.plus_minus !== undefined && game.plus_minus !== null) stats.plus_minus = game.plus_minus;
  if (game.fg_made !== undefined && game.fg_made !== null) stats.fg_made = game.fg_made;
  if (game.fg_attempted !== undefined && game.fg_attempted !== null) stats.fg_attempted = game.fg_attempted;
  if (game.threes_made !== undefined && game.threes_made !== null) stats.threes_made = game.threes_made;
  if (game.threes_attempted !== undefined && game.threes_attempted !== null) stats.threes_attempted = game.threes_attempted;
  if (game.ft_made !== undefined && game.ft_made !== null) stats.ft_made = game.ft_made;
  if (game.ft_attempted !== undefined && game.ft_attempted !== null) stats.ft_attempted = game.ft_attempted;
  
  // Add calculated percentages if we have the data
  if (game.fg_made !== undefined && game.fg_attempted !== undefined && game.fg_attempted > 0) {
    stats.fg_percentage = Number((game.fg_made / game.fg_attempted).toFixed(3));
  }
  if (game.ft_made !== undefined && game.ft_attempted !== undefined && game.ft_attempted > 0) {
    stats.ft_percentage = Number((game.ft_made / game.ft_attempted).toFixed(3));
  }
  if (game.threes_made !== undefined && game.threes_attempted !== undefined && game.threes_attempted > 0) {
    stats.three_pt_percentage = Number((game.threes_made / game.threes_attempted).toFixed(3));
  }
  
  // Add game result info
  stats.is_win = game.is_win ? 1 : 0;
  stats.player_score = game.player_score;
  stats.opponent_score = game.opponent_score;
  
  return stats;
}

/**
 * Calculate if a game is a double double (10+ in 2 categories)
 */
export function isDoubleDouble(game: PlayerGameStats): boolean {
  const categories = [
    game.points || 0,
    game.rebounds || 0,
    game.assists || 0,
    game.steals || 0,
    game.blocks || 0,
  ];
  const tens = categories.filter(val => val >= 10).length;
  return tens >= 2;
}

/**
 * Calculate if a game is a triple double (10+ in 3 categories)
 */
export function isTripleDouble(game: PlayerGameStats): boolean {
  const categories = [
    game.points || 0,
    game.rebounds || 0,
    game.assists || 0,
    game.steals || 0,
    game.blocks || 0,
  ];
  const tens = categories.filter(val => val >= 10).length;
  return tens >= 3;
}

/**
 * Get all unique stat keys from an array of games
 */
export function getAllStatKeys(games: PlayerGameStats[]): string[] {
  const keys = new Set<string>();
  games.forEach((game) => {
    const stats = getStatsFromGame(game);
    Object.keys(stats).forEach((key) => keys.add(key));
  });
  return Array.from(keys).sort();
}

