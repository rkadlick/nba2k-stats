"use client";

import { useMemo } from "react";
import { PlayerWithTeam, PlayerGameStatsWithDetails } from "@/lib/types";

interface UsePlayerStatsProps {
  players: PlayerWithTeam[];
  allStats: PlayerGameStatsWithDetails[];
}

export function usePlayerStats({ players, allStats }: UsePlayerStatsProps) {
  // Get stats for each player (all seasons)
  const player1Stats = useMemo(() => {
    if (players.length === 0) return [];
    return allStats.filter((stat) => stat.player_id === players[0].id);
  }, [allStats, players]);

  const player2Stats = useMemo(() => {
    if (players.length < 2) return [];
    return allStats.filter((stat) => stat.player_id === players[1].id);
  }, [allStats, players]);

  return {
    player1Stats,
    player2Stats,
  };
}
