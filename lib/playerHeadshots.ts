import { getBasePlayerId } from "./playerNameUtils";

// Headshots live in /public/headshots and follow the naming convention
// `player-<N>-<gameYear>-<seasonShort>.jpg`, e.g. "player-2-26-2526.jpg":
//   <N>           - base player number, from the base player id (player-1, player-2, ...)
//   <gameYear>    - 2-digit game version the photo is for, taken from the
//                   "-2kNN" suffix on the full player id ("25" when unsuffixed)
//   <seasonShort> - 4-digit season code, e.g. "2526" for the 2025-2026 season
//
// Falls back to `player-<N>-placeholder.jpg` when no game/season-specific
// photo has been added yet.
const KNOWN_HEADSHOTS = new Set([
  "player-2-26-2526",
  "player-2-26-2627",
]);

const PLACEHOLDER_HEADSHOTS = new Set(["player-1", "player-2"]);

function getGameYearShort(playerId: string): string {
  const match = playerId.match(/-2k(\d+)$/i);
  return match ? match[1].slice(-2) : "25";
}

function getSeasonShort(seasonId: string): string | null {
  const match = seasonId.match(/^season-(\d{4})-(\d{2,4})$/);
  if (!match) return null;
  const [, startYear, endYear] = match;
  return `${startYear.slice(-2)}${endYear.slice(-2)}`;
}

export function getPlayerHeadshotUrl(
  playerId: string,
  seasonId?: string | null
): string | null {
  const baseId = getBasePlayerId(playerId);
  const gameYear = getGameYearShort(playerId);

  if (seasonId) {
    const seasonShort = getSeasonShort(seasonId);
    const key = seasonShort && `${baseId}-${gameYear}-${seasonShort}`;
    if (key && KNOWN_HEADSHOTS.has(key)) {
      return `/headshots/${key}.jpg`;
    }
  }

  if (PLACEHOLDER_HEADSHOTS.has(baseId)) {
    return `/headshots/${baseId}-placeholder.jpg`;
  }

  return null;
}
