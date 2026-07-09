"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { PlayerGameStats, PlayerGameStatsWithDetails, User } from "@/lib/types";
import { logger } from "@/lib/logger";
import { ALL_TEAMS } from "@/lib/teams";

const teams = ALL_TEAMS;

interface UseStatsDataProps {
  currentUser?: User | null;
}

/**
 * Loads and caches player game stats for the entire league.
 * Anon users read player_game_stats_public; authenticated users read the base table.
 */
export function useStatsData({ currentUser = null }: UseStatsDataProps = {}) {
  const [allStats, setAllStats] = useState<PlayerGameStatsWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async (silent = false) => {
    if (teams.length === 0) return;

    if (!silent) setLoading(true);

    try {
      if (!supabase) return;

      const tableName = currentUser
        ? "player_game_stats"
        : "player_game_stats_public";

      const { data: statsData, error: statsError } = await supabase
        .from(tableName)
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
      if (!silent) setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const reloadSilent = useCallback(() => loadStats(true), [loadStats]);

  return {
    allStats,
    loading: loading && allStats.length === 0,
    reload: loadStats,
    reloadSilent,
  };
}
