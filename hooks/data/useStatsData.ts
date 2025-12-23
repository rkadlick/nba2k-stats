"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { PlayerGameStats, PlayerGameStatsWithDetails } from "@/lib/types";
import { logger } from "@/lib/logger";
import { ALL_TEAMS } from "@/lib/teams";

const teams = ALL_TEAMS;

/**
 * Loads and caches player game stats for the entire league.
 * Fully decoupled from Awards logic (handled by useAwardsData).
 */
export function useStatsData() {
  const [allStats, setAllStats] = useState<PlayerGameStatsWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    if (teams.length === 0) return; // Don’t run until teams are loaded

    setLoading(true);

    try {
      if (!supabase) return;

      const { data: statsData, error: statsError } = await supabase
        .from("player_game_stats")
        .select("*")
        .order("game_date", { ascending: false });

      if (statsError) {
        logger.error("Error loading game stats:", statsError);
        return;
      }

      const statsWithDetails: PlayerGameStatsWithDetails[] = (statsData || []).map(
        (stat: PlayerGameStats) => ({
          ...stat,
          opponent_team: teams.find((t) => t.id === stat.opponent_team_id),
        })
      );

      setAllStats(statsWithDetails);
    } catch (error) {
      logger.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  }, [teams]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    allStats,
    loading: loading && allStats.length === 0,
    reload: loadStats, // allow manual refresh
  };
}