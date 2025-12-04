"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Player, PlayerWithTeam, Team } from "@/lib/types";
import { logger } from "@/lib/logger";

interface UsePlayersDataProps {
  teams: Team[];
}

export function usePlayersData({ teams }: UsePlayersDataProps) {
  const [players, setPlayers] = useState<PlayerWithTeam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlayers = async () => {
      if (teams.length === 0) return; // Wait for teams to load first
      
      setLoading(true);
      
      try {
        // Load players with teams
        // Use players_public view which obfuscates names for anonymous users
        // Authenticated users will see real names via the view's function
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
        setLoading(false);
      }
    };

    loadPlayers();
  }, [teams]);

  return { players, loading: loading && players.length === 0 };
}
