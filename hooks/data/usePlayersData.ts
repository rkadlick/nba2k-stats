"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Player, PlayerWithTeam } from "@/lib/types";
import { logger } from "@/lib/logger";
import { ALL_TEAMS } from "@/lib/teams";

export function usePlayersData() {
  const teams = ALL_TEAMS;
  const [players, setPlayers] = useState<PlayerWithTeam[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPlayers = useCallback(async (silent = false) => {
    if (teams.length === 0) return; // Wait for teams to load first

    if (!silent) setLoading(true);

    try {
      if (!supabase) return;
      const { data: playersData, error: playersError } = await supabase
        .from("players_public")
        .select("*")
        .order("created_at", { ascending: true });

      if (playersError) {
        logger.error("Error loading players:", playersError);
      } else {
        const playersWithTeams: PlayerWithTeam[] = (playersData || []).map(
          (player: Player) => ({
            ...player,
            team: teams.find((t) => t.id === player.team_id),
          })
        );
        setPlayers(playersWithTeams);
      }
    } catch (error) {
      logger.error("Error loading players:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [teams]);

    useEffect(() => {
      loadPlayers();
    }, [loadPlayers]);
  
  const reloadSilent = useCallback(() => loadPlayers(true), [loadPlayers]);

  return {
    players,
    loading: loading && players.length === 0,
    reload: loadPlayers,
    reloadSilent,
  };
}