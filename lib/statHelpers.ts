import { NBA_STAT_ORDER, PlayerGameStats } from "./types";

/**
 * Extract stats from PlayerGameStats into a flat object format
 * This converts the new column-based structure to the old stats object format
 * for backward compatibility with components
 */
export function getStatsFromGame(
  game: PlayerGameStats
): Record<string, number | string | null> {
  const stats: Record<string, number | string | null> = {};

  // Add all stat fields if they exist
  if (game.minutes !== undefined && game.minutes !== null)
    stats.minutes = game.minutes;
  if (game.points !== undefined && game.points !== null)
    stats.points = game.points;
  if (game.rebounds !== undefined && game.rebounds !== null)
    stats.rebounds = game.rebounds;
  if (game.offensive_rebounds !== undefined && game.offensive_rebounds !== null)
    stats.offensive_rebounds = game.offensive_rebounds;
  if (game.assists !== undefined && game.assists !== null)
    stats.assists = game.assists;
  if (game.steals !== undefined && game.steals !== null)
    stats.steals = game.steals;
  if (game.blocks !== undefined && game.blocks !== null)
    stats.blocks = game.blocks;
  if (game.turnovers !== undefined && game.turnovers !== null)
    stats.turnovers = game.turnovers;
  if (game.fouls !== undefined && game.fouls !== null) stats.fouls = game.fouls;
  if (game.plus_minus !== undefined && game.plus_minus !== null)
    stats.plus_minus = game.plus_minus;
  if (game.fg_made !== undefined && game.fg_made !== null)
    stats.fg_made = game.fg_made;
  if (game.fg_attempted !== undefined && game.fg_attempted !== null)
    stats.fg_attempted = game.fg_attempted;
  if (game.threes_made !== undefined && game.threes_made !== null)
    stats.threes_made = game.threes_made;
  if (game.threes_attempted !== undefined && game.threes_attempted !== null)
    stats.threes_attempted = game.threes_attempted;
  if (game.ft_made !== undefined && game.ft_made !== null)
    stats.ft_made = game.ft_made;
  if (game.ft_attempted !== undefined && game.ft_attempted !== null)
    stats.ft_attempted = game.ft_attempted;

  // Add calculated percentages if we have the data
  if (
    game.fg_made !== undefined &&
    game.fg_attempted !== undefined &&
    game.fg_attempted > 0
  ) {
    stats.fg_percentage = Number((game.fg_made / game.fg_attempted).toFixed(3));
  }
  if (
    game.ft_made !== undefined &&
    game.ft_attempted !== undefined &&
    game.ft_attempted > 0
  ) {
    stats.ft_percentage = Number((game.ft_made / game.ft_attempted).toFixed(3));
  }
  if (
    game.threes_made !== undefined &&
    game.threes_attempted !== undefined &&
    game.threes_attempted > 0
  ) {
    stats.three_pt_percentage = Number(
      (game.threes_made / game.threes_attempted).toFixed(3)
    );
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
  const tens = categories.filter((val) => val >= 10).length;
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
  const tens = categories.filter((val) => val >= 10).length;
  return tens >= 3;
}

/**
 * Get all unique stat keys from an array of games
 */
export function getAllStatKeys(games: PlayerGameStats[]): string[] {
  const keys = new Set<string>();
  games.forEach((game) => {
    const stats = getStatsFromGame(game);
    Object.keys(stats).forEach((key) => {
      // Filter out unwanted or redundant fields
      if (
        key !== "player_score" &&
        key !== "opponent_score" &&
        key !== "fg_made" &&
        key !== "fg_attempted" &&
        key !== "threes_made" &&
        key !== "threes_attempted" &&
        key !== "ft_made" &&
        key !== "ft_attempted" &&
        key !== "fg_percentage" &&
        key !== "ft_percentage" &&
        key !== "three_pt_percentage" &&
        key !== "is_win"
      ) {
        keys.add(key);
      }
    });

    // Add combined columns if data exists
    if (stats.fg_made !== undefined || stats.fg_attempted !== undefined) {
      keys.add("fg");
    }
    if (
      stats.threes_made !== undefined ||
      stats.threes_attempted !== undefined
    ) {
      keys.add("threes");
    }
    if (stats.ft_made !== undefined || stats.ft_attempted !== undefined) {
      keys.add("ft");
    }
  });
  const ordered: string[] = [];
  const extras: string[] = [];

  NBA_STAT_ORDER.forEach((key) => {
    if (keys.has(key)) ordered.push(key);
  });

  keys.forEach((key) => {
    if (!NBA_STAT_ORDER.includes(key)) extras.push(key);
  });
  return [...ordered, ...extras.sort()];
}

/**
 * Add double/triple doubles to game log stat keys to get season totals keys
 */
export function getSeasonTotalsKeys(gameLogStatKeys: string[]): string[] {
  const seasonTotalsKeys = [...gameLogStatKeys];
  if (!seasonTotalsKeys.includes("double_doubles")) {
    seasonTotalsKeys.push("double_doubles");
  }
  if (!seasonTotalsKeys.includes("triple_doubles")) {
    seasonTotalsKeys.push("triple_doubles");
  }
  return seasonTotalsKeys;
}

export function getSeasonTotals(
  games: PlayerGameStats[]
): { totals: Record<string, number>; averages: Record<string, number>; count: number } {
  const totals: Record<string, number> = {};
  const counts: Record<string, number> = {};
  let doubleDoubles = 0;
  let tripleDoubles = 0;

  games.forEach((game) => {
    const gameStats = getStatsFromGame(game);

    // Sum up all numeric stat values we care about
    Object.entries(gameStats).forEach(([key, value]) => {
      if (
        typeof value === "number" &&
        key !== "player_score" &&
        key !== "opponent_score"
      ) {
        totals[key] = (totals[key] || 0) + value;
        counts[key] = (counts[key] || 0) + 1;
      }
    });

    // Count double/triple doubles
    if (isDoubleDouble(game)) doubleDoubles++;
    if (isTripleDouble(game)) tripleDoubles++;
  });

  totals.double_doubles = doubleDoubles;
  totals.triple_doubles = tripleDoubles;

  // Create average values
  const averages: Record<string, number> = {};
  Object.keys(totals).forEach((key) => {
    if (
      counts[key] > 0 &&
      key !== "double_doubles" &&
      key !== "triple_doubles"
    ) {
      averages[key] = Number((totals[key] / counts[key]).toFixed(3));
    }
  });

  return { totals, averages, count: games.length };
}
