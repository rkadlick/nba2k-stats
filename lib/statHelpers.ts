import { NBA_STAT_ORDER, PlayerGameStats } from "./types";

/**
 * A "most recent N games" window, shared by the game trend chart and any
 * sibling panel that needs to mirror its selected range.
 */
export type GameRange = 5 | 10 | 20 | "all";

/**
 * Sort games most-recent-first, then take the requested window.
 */
export function sliceGamesByRange<
  T extends { game_date?: string | null; created_at?: string | null }
>(games: T[], range: GameRange): T[] {
  const sortedDesc = [...games].sort(
    (a, b) =>
      new Date(b.game_date || b.created_at || "").getTime() -
      new Date(a.game_date || a.created_at || "").getTime()
  );
  const count = range === "all" ? sortedDesc.length : range;
  return sortedDesc.slice(0, count);
}

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
 * Calculate if a game is a quad double (10+ in 4 categories)
 */
export function isQuadDouble(game: PlayerGameStats): boolean {
  const categories = [
    game.points || 0,
    game.rebounds || 0,
    game.assists || 0,
    game.steals || 0,
    game.blocks || 0,
  ];
  const tens = categories.filter((val) => val >= 10).length;
  return tens >= 4;
}

/**
 * Calculate if a game is a 5x5 (5+ in all 5 categories: points, rebounds, assists, steals, blocks)
 */
export function is5x5(game: PlayerGameStats): boolean {
  const pts = game.points ?? 0;
  const reb = game.rebounds ?? 0;
  const ast = game.assists ?? 0;
  const stl = game.steals ?? 0;
  const blk = game.blocks ?? 0;
  return pts >= 5 && reb >= 5 && ast >= 5 && stl >= 5 && blk >= 5;
}

export interface MilestoneCounts {
  doubleDoubles: number;
  tripleDoubles: number;
  quadDoubles: number;
  fiveByFive: number;
  games40Plus: number;
  games50Plus: number;
  games60Plus: number;
  games70Plus: number;
  games20PlusReb: number;
  games15PlusReb: number;
  games15PlusAst: number;
  games20PlusAst: number;
  games30PlusAst: number;
  games10PlusStl: number;
  games15PlusStl: number;
}

/**
 * Count milestone-type achievements (double-doubles, triple-doubles, big
 * scoring games, etc.) across a set of games. Shared by the comparison view
 * and headline generation's landmark detection.
 */
export function computeMilestoneCounts(games: PlayerGameStats[]): MilestoneCounts {
  const counts: MilestoneCounts = {
    doubleDoubles: 0,
    tripleDoubles: 0,
    quadDoubles: 0,
    fiveByFive: 0,
    games40Plus: 0,
    games50Plus: 0,
    games60Plus: 0,
    games70Plus: 0,
    games20PlusReb: 0,
    games15PlusReb: 0,
    games15PlusAst: 0,
    games20PlusAst: 0,
    games30PlusAst: 0,
    games10PlusStl: 0,
    games15PlusStl: 0,
  };

  games.forEach((g) => {
    if (isDoubleDouble(g)) counts.doubleDoubles++;
    if (isTripleDouble(g)) counts.tripleDoubles++;
    if (isQuadDouble(g)) counts.quadDoubles++;
    if (is5x5(g)) counts.fiveByFive++;
    if ((g.points ?? 0) >= 40) counts.games40Plus++;
    if ((g.points ?? 0) >= 50) counts.games50Plus++;
    if ((g.points ?? 0) >= 60) counts.games60Plus++;
    if ((g.points ?? 0) >= 70) counts.games70Plus++;
    if ((g.rebounds ?? 0) >= 20) counts.games20PlusReb++;
    if ((g.rebounds ?? 0) >= 15) counts.games15PlusReb++;
    if ((g.assists ?? 0) >= 15) counts.games15PlusAst++;
    if ((g.assists ?? 0) >= 20) counts.games20PlusAst++;
    if ((g.assists ?? 0) >= 30) counts.games30PlusAst++;
    if ((g.steals ?? 0) >= 10) counts.games10PlusStl++;
    if ((g.steals ?? 0) >= 15) counts.games15PlusStl++;
  });

  return counts;
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
 * Stat keys tracked as "season highs" (single-game bests within a given
 * set of games) — shared between the Season Highs summary and the game log's
 * per-cell marking of which entries are that high.
 */
export const SEASON_HIGH_STAT_KEYS = [
  "points",
  "rebounds",
  "assists",
  "steals",
  "blocks",
  "plus_minus",
  "fg_made",
  "threes_made",
  "ft_made",
] as const;

/**
 * Best single-game value per tracked stat within the given games.
 * Only includes keys where at least one game recorded a value greater than 0.
 */
export function getSeasonHighValues(
  games: PlayerGameStats[]
): Record<string, number> {
  const result: Record<string, number> = {};

  SEASON_HIGH_STAT_KEYS.forEach((key) => {
    let maxVal = -1;
    games.forEach((game) => {
      const val = (game[key] as number) || 0;
      if (val > maxVal) maxVal = val;
    });
    if (maxVal > 0) result[key] = maxVal;
  });

  return result;
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
