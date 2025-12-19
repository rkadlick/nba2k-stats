import { Season, PlayoffSeries } from "@/lib/types";
import { getConferenceFromTeamId } from "@/lib/teams";

/**
 * Round configuration for playoff series
 */
export const ROUND_NUMBERS: Record<string, number> = {
  'Play-In Tournament': 0,
  'Round 1': 1,
  'Conference Semifinals': 2,
  'Conference Finals': 3,
  'NBA Finals': 4,
};

export const ROUNDS = [
  'Play-In Tournament',
  'Round 1',
  'Conference Semifinals',
  'Conference Finals',
  'NBA Finals'
] as const;

/**
 * Get abbreviated season year (e.g., "2324" for 2023-2024)
 */
export const getSeasonYearShort = (yearStart: number, yearEnd: number): string => {
  const startShort = yearStart.toString().slice(-2);
  const endShort = yearEnd.toString().slice(-2);
  return `${startShort}${endShort}`;
};

/**
 * Get abbreviated round name
 */
export const getRoundAbbrev = (roundName: string): string => {
  const abbrevMap: Record<string, string> = {
    'Play-In Tournament': 'plyn',
    'Round 1': 'rnd1',
    'Conference Semifinals': 'rnd2',
    'Conference Finals': 'cnf',
    'NBA Finals': 'fnl',
  };
  return abbrevMap[roundName] || 'rnd1';
};

/**
 * Generate a unique ID for a playoff series
 */
export const generateSeriesId = (
  season: Season,
  roundName: string,
  team1Id: string | undefined,
  team2Id: string | undefined,
  playerId: string | undefined,
  existingSeries?: PlayoffSeries[]
): string => {
  const playerNum = playerId ? playerId.split('-')[1] : '0';
  const yearShort = getSeasonYearShort(season.year_start, season.year_end);
  const roundAbbrev = getRoundAbbrev(roundName);

  // Finals — no conference letter
  if (roundName === 'NBA Finals') {
    const baseId = `${playerNum}-${yearShort}-${roundAbbrev}`;

    // Check for duplicates across same player + finals + season
    if (existingSeries) {
      const count = existingSeries.filter(
        (s) =>
          s.id.startsWith(baseId) &&
          s.season_id === season.id &&
          s.player_id === playerId
      ).length;
      return count > 0 ? `${baseId}-${count + 1}` : baseId;
    }

    return baseId;
  }

  // Determine conference
  const conference =
    getConferenceFromTeamId(team1Id) || getConferenceFromTeamId(team2Id);
  const confLetter = conference === 'East' ? 'e' : 'w';
  const baseId = `${playerNum}-${yearShort}-${roundAbbrev}-${confLetter}`;

  // Compute numeric suffix for duplicates
  if (existingSeries) {
    const count = existingSeries.filter(
      (s) =>
        s.id.startsWith(baseId) &&
        s.season_id === season.id &&
        s.player_id === playerId
    ).length;
    return count > 0 ? `${baseId}-${count + 1}` : baseId;
  }

  return baseId;
};

/**
 * Determine the winner of a playoff series based on wins
 */
export const determineWinner = (
  team1Id: string | undefined,
  team1Name: string | undefined,
  team1Wins: number,
  team2Id: string | undefined,
  team2Name: string | undefined,
  team2Wins: number
): { winner_team_id?: string; winner_team_name?: string; is_complete: boolean } => {
  if (team1Wins >= 4 && team1Id) {
    return {
      winner_team_id: team1Id,
      winner_team_name: team1Name,
      is_complete: true,
    };
  }
  if (team2Wins >= 4 && team2Id) {
    return {
      winner_team_id: team2Id,
      winner_team_name: team2Name,
      is_complete: true,
    };
  }
  return {
    winner_team_id: undefined,
    winner_team_name: undefined,
    is_complete: false,
  };
};
