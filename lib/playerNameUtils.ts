import { User, Player, PlayerGameStatsWithDetails } from "./types";

export function getPublicPlayerName(
  player: Pick<Player, "id" | "player_name">
): string {
  if (player.player_name?.trim()) {
    return player.player_name.trim();
  }

  const baseId = player.id.replace(/-2k\d+$/i, "");
  switch (baseId) {
    case "player-1":
      return "Jim Simms";
    case "player-2":
      return "Phil Nantz";
    default:
      return "Player";
  }
}

export function getDisplayPlayerName(
  player: Player,
  currentUser: User | null,
  privateNamesById?: Record<string, string>
): string {
  if (currentUser && privateNamesById) {
    const privateName = privateNamesById[player.id];
    if (privateName) return privateName;
  }

  return getPublicPlayerName(player);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function preserveCase(matched: string, replacement: string): string {
  if (matched === matched.toUpperCase()) {
    return replacement.toUpperCase();
  }
  if (matched[0] === matched[0]?.toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

function replaceAllIgnoreCase(
  text: string,
  search: string,
  replacement: string
): string {
  if (!search || search.length < 2) return text;
  const regex = new RegExp(escapeRegExp(search), "gi");
  return text.replace(regex, (match) => preserveCase(match, replacement));
}

function buildNameReplacementVariants(
  publicName: string,
  privateName: string
): { from: string; to: string }[] {
  const pub = publicName.trim();
  const priv = privateName.trim();
  if (!pub || !priv || pub.toLowerCase() === priv.toLowerCase()) {
    return [];
  }

  const variants: { from: string; to: string }[] = [
    { from: `${pub}'s`, to: `${priv}'s` },
    { from: `${pub}'`, to: `${priv}'` },
    { from: pub, to: priv },
  ];

  const pubParts = pub.split(/\s+/);
  const privParts = priv.split(/\s+/);
  if (pubParts.length > 1 && privParts.length > 1) {
    const pubLast = pubParts[pubParts.length - 1];
    const privLast = privParts[privParts.length - 1];
    if (
      pubLast.length >= 3 &&
      pubLast.toLowerCase() !== privLast.toLowerCase()
    ) {
      variants.push({ from: `${pubLast}'s`, to: `${privLast}'s` });
      variants.push({ from: `${pubLast}'`, to: `${privLast}'` });
      variants.push({ from: pubLast, to: privLast });
    }
  }

  return variants.sort((a, b) => b.from.length - a.from.length);
}

/**
 * Replaces public placeholder names with private names in a stored headline.
 * Headlines are generated with public names only; swap at display for auth users.
 */
export function swapPublicNameInHeadline(
  headline: string,
  publicName: string,
  privateName: string
): string {
  if (!headline?.trim() || !publicName?.trim() || !privateName?.trim()) {
    return headline;
  }

  const variants = buildNameReplacementVariants(publicName, privateName);
  if (variants.length === 0) return headline;

  let result = headline;
  for (const { from, to } of variants) {
    result = replaceAllIgnoreCase(result, from, to);
  }

  return result;
}

export function getDisplayHeadline(
  game: PlayerGameStatsWithDetails,
  publicPlayers: Player[],
  privateNamesById: Record<string, string>,
  currentUser: User | null
): string | null {
  if (game.headline_status === "pending") {
    return "Generating headline...";
  }

  if (!game.headline) {
    return null;
  }

  if (!currentUser) {
    return game.headline;
  }

  const publicPlayer = publicPlayers.find((p) => p.id === game.player_id);
  const publicName = getPublicPlayerName(
    publicPlayer ?? { id: game.player_id, player_name: "" }
  );
  const privateName = privateNamesById[game.player_id];

  if (!privateName) {
    return game.headline;
  }

  return swapPublicNameInHeadline(game.headline, publicName, privateName);
}
