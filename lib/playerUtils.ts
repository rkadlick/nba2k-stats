import { Player } from "@/lib/types";
import { DEFAULT_GAME_VERSION } from "@/lib/constants";

/** Players for split/comparison view: one per user, filtered by game edition. */
export function filterPlayersByGameVersion<T extends Player>(
  players: T[],
  gameVersion: string = DEFAULT_GAME_VERSION
): T[] {
  return players
    .filter((p) => (p.game_version ?? DEFAULT_GAME_VERSION) === gameVersion)
    .sort(
      (a, b) =>
        new Date(a.created_at ?? 0).getTime() -
        new Date(b.created_at ?? 0).getTime()
    );
}

export function getPlayerForUser(
  players: Player[],
  userId: string,
  gameVersion: string = DEFAULT_GAME_VERSION
): Player | undefined {
  return players.find(
    (p) =>
      p.user_id === userId &&
      (p.game_version ?? DEFAULT_GAME_VERSION) === gameVersion
  );
}

export function getAvailableGameVersions(players: Player[]): string[] {
  const versions = new Set(
    players.map((p) => p.game_version ?? DEFAULT_GAME_VERSION)
  );
  return Array.from(versions).sort();
}

export function formatGameVersionLabel(version: string): string {
  return version.toUpperCase().replace(/^2K/i, "2K");
}
