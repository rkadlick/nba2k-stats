import { useState, useEffect, useMemo } from 'react';
import { Player, PlayerGameStatsWithDetails } from '@/lib/types';

interface UseGamesProps {
  selectedSeason: string;
  currentUserPlayer: Player | null;
  allStats: PlayerGameStatsWithDetails[];
}

export function useGames({
  selectedSeason,
  currentUserPlayer,
  allStats,
}: UseGamesProps) {
  const [seasonGames, setSeasonGames] = useState<PlayerGameStatsWithDetails[]>([]);

  // Load games for selected season
  useEffect(() => {
    if (selectedSeason && currentUserPlayer) {
      const games = allStats.filter(
        stat => stat.player_id === currentUserPlayer.id && stat.season_id === selectedSeason
      );
      setSeasonGames(games.sort((a, b) => new Date(b.game_date).getTime() - new Date(a.game_date).getTime()));
    } else {
      setSeasonGames([]);
    }
  }, [selectedSeason, currentUserPlayer, allStats]);

  return {
    seasonGames,
    setSeasonGames,
  };
}
