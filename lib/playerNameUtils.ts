import { User } from "./types";
import { Player } from "./types";

export function getDisplayPlayerName(
  player: Player,
  currentUser: User | null
): string {
  // If user is logged in, show real name
  if (currentUser) return player.player_name;

  // Otherwise, return public name based on static IDs (strip game-edition suffix)
  const baseId = player.id.replace(/-2k\d+$/i, "");
  switch (baseId) {
    case "player-1":
      return "Jim Simms";
    case "player-2":
      return "Phil Nantz";
    default:
      return player.player_name || "Player";
  }
}