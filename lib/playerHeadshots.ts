import { getBasePlayerId } from "./playerNameUtils";

// Placeholder headshots until real per-player (and optionally per-season)
// photos are wired up. Keyed by base player id (game-version suffixes like
// "-2k26" are stripped via getBasePlayerId), with an optional season-id
// override for a season-specific photo.
const PLAYER_HEADSHOTS: Record<string, string> = {
  "player-1": "/player-1.jpg",
  "player-2": "/player-2.jpg",
};

const SEASON_HEADSHOTS: Record<string, string> = {
  // `${basePlayerId}:${seasonId}` -> image path
};

export function getPlayerHeadshotUrl(
  playerId: string,
  seasonId?: string | null
): string | null {
  const baseId = getBasePlayerId(playerId);

  if (seasonId) {
    const seasonUrl = SEASON_HEADSHOTS[`${baseId}:${seasonId}`];
    if (seasonUrl) return seasonUrl;
  }

  return PLAYER_HEADSHOTS[baseId] ?? null;
}
