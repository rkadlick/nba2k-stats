"use client";

import { useMemo, useCallback } from "react";
import { PlayerWithTeam, Award, PlayerAwardInfo } from "@/lib/types";

interface UsePlayerAwardsProps {
  players: PlayerWithTeam[];
  allSeasonAwards: Award[];
}

export function usePlayerAwards({ players, allSeasonAwards }: UsePlayerAwardsProps) {
  
  const filterPlayerAwards = useCallback((player: PlayerWithTeam): PlayerAwardInfo[] => {
    // Filter from allSeasonAwards (Award[]) which has winner_player_id and winner_player_name
    const filteredAwards = allSeasonAwards.filter((award) => {
      // CRITICAL: Award must belong to this player's user (user who owns this player)
      if (award.user_id !== player.user_id) return false;
      // Award must belong to this player's league
      if (award.player_id && award.player_id !== player.id) return false;
      // Award is won by this player
      return (
        award.winner_player_id === player.id ||
        award.winner_player_name?.trim().toLowerCase() ===
          player.player_name.trim().toLowerCase()
      );
    });
    
    // Transform to PlayerAwardInfo format for CareerView
    return filteredAwards.map((award) => ({
      id: award.id,
      player_id: award.player_id || award.winner_player_id || "",
      season_id: award.season_id,
      award_name: award.award_name,
      award_id: award.id,
      created_at: award.created_at,
    }));
  }, [allSeasonAwards]);

  // Get awards for each player (all seasons)
  // CRITICAL: Awards must belong to the player's user (award.user_id matches player.user_id)
  // Awards belong to a player's league if award.player_id matches
  // Awards are won by a player if winner_player_id matches OR winner_player_name matches
  const player1Awards = useMemo((): PlayerAwardInfo[] => {
    if (players.length === 0) return [];
    return filterPlayerAwards(players[0]);
  }, [filterPlayerAwards, players]);

  const player2Awards = useMemo((): PlayerAwardInfo[] => {
    if (players.length < 2) return [];
    return filterPlayerAwards(players[1]);
  }, [filterPlayerAwards, players]);

  // Helper function to get awards for any player
  const getPlayerAwards = useCallback((playerId: string): PlayerAwardInfo[] => {
    const player = players.find(p => p.id === playerId);
    if (!player) return [];
    return filterPlayerAwards(player);
  }, [filterPlayerAwards, players]);

  return {
    player1Awards,
    player2Awards,
    getPlayerAwards, // For future extensibility
  };
}
