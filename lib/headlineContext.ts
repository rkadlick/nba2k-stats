import {
  Award,
  Player,
  PlayerGameStats,
  PlayoffSeries,
  SeasonTotals,
} from "./types";
import {
  computeMilestoneCounts,
  is5x5,
  isDoubleDouble,
  isQuadDouble,
  isTripleDouble,
  MilestoneCounts,
} from "./statHelpers";
import { getTeamAbbreviation, getTeamById } from "./teams";
import { CAREER_HIGHS_FIELDS } from "./formUtils";

export type HeadlineStyle = "priority" | "head_to_head" | "box_score" | "basic";

export interface PlayoffHeadlineContext {
  roundName: string;
  gameNumber: number | null;
  seriesRecord: string;
  playerSeriesWins: number;
  opponentSeriesWins: number;
  isFinals: boolean;
  playerLeadsSeries: boolean;
  seriesTied: boolean;
}

export interface HeadToHeadRecord {
  wins: number;
  losses: number;
}

export interface HeadlineContext {
  player: string;
  team: string;
  opponent: string;
  result: string;
  line: string;
  context: {
    seasonAvg: Record<string, number | null>;
    careerHighs: Record<string, number>;
    milestones: string[];
    awards: string[];
    playoff: PlayoffHeadlineContext | null;
    winStreak: number;
    lossStreak: number;
    seasonHeadToHead: HeadToHeadRecord | null;
    careerHeadToHead: HeadToHeadRecord | null;
    isKeyGame: boolean;
    isPlayoff: boolean;
    isCupGame: boolean;
    isCupChampionship: boolean;
    isOvertime: boolean;
    isSimulated: boolean;
    careerGamesPlayed?: number;
  };
  generationHints: {
    style: HeadlineStyle;
    subjectFocus: "player" | "team";
    allowDryHumor: boolean;
    mandatoryThemes: string[];
  };
}

const STAT_LINE_FIELDS: { key: keyof PlayerGameStats; label: string }[] = [
  { key: "points", label: "PTS" },
  { key: "rebounds", label: "REB" },
  { key: "assists", label: "AST" },
  { key: "steals", label: "STL" },
  { key: "blocks", label: "BLK" },
];

const FINALS_ROUND_NAMES = new Set([
  "finals",
  "nba finals",
  "the finals",
]);

function formatGameLine(game: PlayerGameStats): string {
  const parts = STAT_LINE_FIELDS.map(({ key, label }) => {
    const value = game[key];
    if (typeof value === "number") {
      return `${value} ${label}`;
    }
    return null;
  }).filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : "No box score stats recorded";
}

function computeWinStreak(games: PlayerGameStats[]): number {
  const sorted = [...games].sort(
    (a, b) =>
      new Date(b.game_date).getTime() - new Date(a.game_date).getTime()
  );

  let streak = 0;
  for (const game of sorted) {
    if (game.is_win) streak += 1;
    else break;
  }

  return streak;
}

function computeLossStreak(games: PlayerGameStats[]): number {
  const sorted = [...games].sort(
    (a, b) =>
      new Date(b.game_date).getTime() - new Date(a.game_date).getTime()
  );

  let streak = 0;
  for (const game of sorted) {
    if (!game.is_win) streak += 1;
    else break;
  }

  return streak;
}

function computeHeadToHead(
  games: PlayerGameStats[],
  opponentTeamId: string | undefined,
  seasonId?: string
): HeadToHeadRecord | null {
  if (!opponentTeamId) return null;

  const matchups = games.filter(
    (g) =>
      g.opponent_team_id === opponentTeamId &&
      !g.is_playoff_game &&
      (!seasonId || g.season_id === seasonId)
  );

  if (matchups.length === 0) return null;

  return {
    wins: matchups.filter((g) => g.is_win).length,
    losses: matchups.filter((g) => !g.is_win).length,
  };
}

function isFinalsSeries(
  playoffSeries: PlayoffSeries | null,
  playoffSeriesId?: string
): boolean {
  if (playoffSeries?.round_name) {
    const normalized = playoffSeries.round_name.trim().toLowerCase();
    if (FINALS_ROUND_NAMES.has(normalized) || normalized.includes("finals")) {
      return !normalized.includes("conference");
    }
  }

  return /-fnl(?:-\d+)?$/i.test(playoffSeriesId || "");
}

function getPlayoffHeadlineContext(
  game: PlayerGameStats,
  playoffSeries: PlayoffSeries | null,
  seriesGames: PlayerGameStats[]
): PlayoffHeadlineContext | null {
  if (!game.is_playoff_game) return null;

  const playerSeriesWins = seriesGames.filter((g) => g.is_win).length;
  const opponentSeriesWins = seriesGames.filter((g) => !g.is_win).length;
  const roundName =
    playoffSeries?.round_name ||
    (isFinalsSeries(playoffSeries, game.playoff_series_id)
      ? "NBA Finals"
      : "Playoffs");

  return {
    roundName,
    gameNumber: game.playoff_game_number ?? null,
    seriesRecord: `${playerSeriesWins}-${opponentSeriesWins}`,
    playerSeriesWins,
    opponentSeriesWins,
    isFinals: isFinalsSeries(playoffSeries, game.playoff_series_id),
    playerLeadsSeries: playerSeriesWins > opponentSeriesWins,
    seriesTied: playerSeriesWins === opponentSeriesWins,
  };
}

function computeCareerHighsFromGames(
  games: PlayerGameStats[],
  manualHighs?: Record<string, number>
): Record<string, number> {
  const result: Record<string, number> = {};

  CAREER_HIGHS_FIELDS.forEach(({ key }) => {
    const manual = manualHighs?.[key];
    if (manual !== undefined && manual !== null) {
      result[key] = manual;
      return;
    }

    const values = games
      .map((game) => game[key as keyof PlayerGameStats] as number | undefined)
      .filter((value): value is number => typeof value === "number");

    result[key] = values.length > 0 ? Math.max(...values) : 0;
  });

  return result;
}

function detectMilestones(
  game: PlayerGameStats,
  priorGames: PlayerGameStats[],
  careerHighs: Record<string, number>
): string[] {
  const milestones: string[] = [];

  if (isTripleDouble(game)) milestones.push("triple-double");
  else if (isDoubleDouble(game)) milestones.push("double-double");
  if (isQuadDouble(game)) milestones.push("quad-double");
  if (is5x5(game)) milestones.push("5x5");

  const points = game.points ?? 0;
  if (points >= 70) milestones.push("70+ points");
  else if (points >= 60) milestones.push("60+ points");
  else if (points >= 50) milestones.push("50+ points");
  else if (points >= 40) milestones.push("40+ points");

  CAREER_HIGHS_FIELDS.forEach(({ key, label }) => {
    const gameValue = game[key as keyof PlayerGameStats] as number | undefined;
    if (typeof gameValue !== "number") return;

    const priorMax = priorGames
      .map((g) => g[key as keyof PlayerGameStats] as number | undefined)
      .filter((value): value is number => typeof value === "number");

    const previousBest =
      priorMax.length > 0 ? Math.max(...priorMax) : careerHighs[key] ?? 0;

    if (gameValue > previousBest) {
      milestones.push(`new career high in ${label.toLowerCase()}`);
    }
  });

  return milestones;
}

function ordinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

// "Rare" feats earn landmark status at lower counts than "common" ones — a 5th
// career triple-double is notable, a 5th career double-double is not.
const MILESTONE_META: {
  key: keyof MilestoneCounts;
  rare: boolean;
  label: string;
  gameQualifies: (game: PlayerGameStats) => boolean;
}[] = [
  { key: "tripleDoubles", rare: true, label: "triple-double", gameQualifies: isTripleDouble },
  { key: "quadDoubles", rare: true, label: "quad-double", gameQualifies: isQuadDouble },
  { key: "fiveByFive", rare: true, label: "5x5", gameQualifies: is5x5 },
  {
    key: "games50Plus",
    rare: true,
    label: "50+ point game",
    gameQualifies: (g) => (g.points ?? 0) >= 50,
  },
  {
    key: "games60Plus",
    rare: true,
    label: "60+ point game",
    gameQualifies: (g) => (g.points ?? 0) >= 60,
  },
  {
    key: "games70Plus",
    rare: true,
    label: "70+ point game",
    gameQualifies: (g) => (g.points ?? 0) >= 70,
  },
  { key: "doubleDoubles", rare: false, label: "double-double", gameQualifies: isDoubleDouble },
  {
    key: "games40Plus",
    rare: false,
    label: "40+ point game",
    gameQualifies: (g) => (g.points ?? 0) >= 40,
  },
];

function isCareerLandmark(count: number, rare: boolean): boolean {
  if (count <= 0) return false;
  if (rare) return count < 25 ? count % 5 === 0 : count % 25 === 0;
  return count % 25 === 0;
}

function isSeasonLandmark(count: number, rare: boolean): boolean {
  if (count <= 0) return false;
  return count % (rare ? 5 : 10) === 0;
}

// Only flags landmarks for achievements this specific game contributed to —
// counts include the current game, so e.g. a 50th career triple-double only
// fires on the game that made it the 50th.
function detectLandmarks(
  game: PlayerGameStats,
  careerCounts: MilestoneCounts,
  seasonCounts: MilestoneCounts
): string[] {
  const landmarks: string[] = [];

  MILESTONE_META.forEach(({ key, rare, label, gameQualifies }) => {
    if (!gameQualifies(game)) return;

    const careerCount = careerCounts[key];
    if (isCareerLandmark(careerCount, rare)) {
      landmarks.push(`${ordinal(careerCount)} career ${label}`);
    }

    const seasonCount = seasonCounts[key];
    if (isSeasonLandmark(seasonCount, rare)) {
      landmarks.push(`${ordinal(seasonCount)} ${label} this season`);
    }
  });

  return landmarks;
}

function getPlayerAwards(awards: Award[], playerId: string): string[] {
  return awards
    .filter((award) => award.winner_player_id === playerId)
    .map((award) => `${award.season_id} ${award.award_name}`);
}

function getCupChampionshipFlag(game: PlayerGameStats): boolean {
  return !!(
    game as PlayerGameStats & { is_cup_championship?: boolean }
  ).is_cup_championship;
}

function buildMandatoryThemes(game: PlayerGameStats): string[] {
  const themes: string[] = [];

  if (game.is_playoff_game) {
    themes.push("playoff_series_record");
  }

  if (getCupChampionshipFlag(game)) {
    themes.push("nba_cup_championship");
  } else if (game.is_cup_game) {
    themes.push("nba_cup");
  }

  if (game.is_key_game) {
    themes.push("key_game");
  }

  return themes;
}

function pickHeadlineStyle(game: PlayerGameStats): HeadlineStyle {
  if (game.is_playoff_game || getCupChampionshipFlag(game)) {
    return "priority";
  }

  const roll = Math.random();
  if (roll < 0.2) return "head_to_head";
  if (roll < 0.38) return "box_score";
  if (roll < 0.52) return "basic";
  return "priority";
}

function rollAllowDryHumor(): boolean {
  return Math.random() < 0.03;
}

function pickSubjectFocus(game: PlayerGameStats): "player" | "team" {
  if (game.is_playoff_game || getCupChampionshipFlag(game)) {
    return "player";
  }
  return Math.random() < 0.7 ? "player" : "team";
}

export function buildHeadlineContext({
  game,
  player,
  seasonTotals,
  seasonGames,
  allGames,
  careerSeasonTotals,
  awards,
  playoffSeries,
  manualCareerHighs,
}: {
  game: PlayerGameStats;
  player: Player;
  seasonTotals: SeasonTotals | null;
  seasonGames: PlayerGameStats[];
  allGames: PlayerGameStats[];
  careerSeasonTotals: SeasonTotals[];
  awards: Award[];
  playoffSeries: PlayoffSeries | null;
  manualCareerHighs?: Record<string, number>;
}): HeadlineContext {
  const priorAllGames = allGames.filter((g) => g.id !== game.id);
  const careerHighs = computeCareerHighsFromGames(
    priorAllGames,
    manualCareerHighs
  );

  // allGames/seasonGames include the current game, so these counts are the
  // "through this game" totals landmark detection needs.
  const careerMilestoneCounts = computeMilestoneCounts(allGames);
  const seasonMilestoneCounts = computeMilestoneCounts(seasonGames);

  const playerTeam = player.team_id ? getTeamById(player.team_id) : null;
  const opponentName =
    game.opponent_team_name ||
    (game.opponent_team_id
      ? getTeamById(game.opponent_team_id)?.fullName
      : null) ||
    "Unknown";

  const opponentAbbrev = getTeamAbbreviation(
    game.opponent_team_id || opponentName
  );

  const resultLabel = game.is_win ? "W" : "L";
  const score = game.is_win
    ? `${game.player_score}-${game.opponent_score}`
    : `${game.opponent_score}-${game.player_score}`;

  const seasonAvg: Record<string, number | null> = {
    points: seasonTotals?.avg_points ?? null,
    rebounds: seasonTotals?.avg_rebounds ?? null,
    assists: seasonTotals?.avg_assists ?? null,
    steals: seasonTotals?.avg_steals ?? null,
    blocks: seasonTotals?.avg_blocks ?? null,
  };

  const careerGamesPlayed = careerSeasonTotals.reduce(
    (sum, totals) => sum + (totals.games_played || 0),
    0
  );

  const seriesGames = game.playoff_series_id
    ? allGames.filter((g) => g.playoff_series_id === game.playoff_series_id)
    : [game];

  const isCupChampionship = getCupChampionshipFlag(game);

  return {
    player: player.player_name,
    team: playerTeam?.abbreviation || playerTeam?.fullName || "Team",
    opponent: opponentAbbrev,
    result: `${resultLabel} ${score}`,
    line: formatGameLine(game),
    context: {
      seasonAvg,
      careerHighs,
      milestones: [
        ...detectMilestones(game, priorAllGames, careerHighs),
        ...detectLandmarks(game, careerMilestoneCounts, seasonMilestoneCounts),
      ],
      awards: getPlayerAwards(awards, player.id),
      playoff: getPlayoffHeadlineContext(game, playoffSeries, seriesGames),
      winStreak: computeWinStreak(seasonGames),
      lossStreak: computeLossStreak(seasonGames),
      seasonHeadToHead: computeHeadToHead(
        allGames,
        game.opponent_team_id,
        game.season_id
      ),
      careerHeadToHead: computeHeadToHead(allGames, game.opponent_team_id),
      isKeyGame: !!game.is_key_game,
      isPlayoff: !!game.is_playoff_game,
      isCupGame: !!game.is_cup_game,
      isCupChampionship,
      isOvertime: !!game.is_overtime,
      isSimulated: !!game.is_simulated,
      ...(careerGamesPlayed > 0 ? { careerGamesPlayed } : {}),
    },
    generationHints: {
      style: pickHeadlineStyle(game),
      subjectFocus: pickSubjectFocus(game),
      allowDryHumor: rollAllowDryHumor(),
      mandatoryThemes: buildMandatoryThemes(game),
    },
  };
}

export function buildFallbackHeadline(context: HeadlineContext): string {
  const { player, opponent, line, result, context: ctx } = context;
  const winLoss = result.startsWith("W") ? "win" : "loss";

  if (ctx.playoff?.seriesRecord) {
    const round = ctx.playoff.isFinals ? "Finals" : ctx.playoff.roundName;
    return `${player} ${result} in ${round}, series now ${ctx.playoff.seriesRecord}: ${line}`;
  }

  if (ctx.isCupChampionship) {
    return `${player} wins NBA Cup championship ${winLoss} vs ${opponent}: ${line}`;
  }

  if (ctx.isCupGame) {
    return `${player} ${result} in NBA Cup play vs ${opponent}: ${line}`;
  }

  const milestone = ctx.milestones[0];
  if (milestone) {
    return `${player} posts a ${milestone} in ${winLoss} vs ${opponent}: ${line}`;
  }

  if (ctx.winStreak >= 5) {
    return `${player} extends win streak to ${ctx.winStreak} with ${winLoss} vs ${opponent}: ${line}`;
  }

  if (ctx.lossStreak >= 5) {
    return `${player} drops ${ctx.lossStreak}th straight vs ${opponent}: ${line}`;
  }

  return `${player} records ${line} in ${winLoss} vs ${opponent}`;
}
