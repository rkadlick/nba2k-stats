import { Player, User } from '@/lib/types';

/**
 * Obfuscates player names for public viewing.
 * Player 1 (first by created_at) → "Jim Simms"
 * Player 2 (second by created_at) → "Phil Nantz"
 * Returns real name if user is logged in.
 */
export function getDisplayPlayerName(
  player: Player,
  players: Player[],
  currentUser: User | null
): string {
  // If user is logged in, show real name
  if (currentUser) {
    return player.player_name;
  }

  // Sort players by created_at to determine order
  const sortedPlayers = [...players].sort((a, b) => {
    const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
    return aDate - bDate;
  });

  // Find player index
  const playerIndex = sortedPlayers.findIndex((p) => p.id === player.id);

  // Return obfuscated name based on position
  if (playerIndex === 0) {
    return 'Jim Simms';
  } else if (playerIndex === 1) {
    return 'Phil Nantz';
  }

  // Fallback: if somehow there are more than 2 players, use generic names
  return `Player ${playerIndex + 1}`;
}

