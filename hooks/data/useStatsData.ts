"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { PlayerGameStats, PlayerGameStatsWithDetails, Award } from "@/lib/types";
import { logger } from "@/lib/logger";
import { getAllTeams } from "@/lib/teams";

const teams = getAllTeams();


export function useStatsData() {

  const [allStats, setAllStats] = useState<PlayerGameStatsWithDetails[]>([]);
  const [allSeasonAwards, setAllSeasonAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    if (teams.length === 0) return; // Wait for teams to load first
    
    setLoading(true);
    
    try {
      if (!supabase) return;
      
      // Load ALL game stats (not filtered by season)
      const { data: statsData, error: statsError } = await supabase
        .from("player_game_stats")
        .select("*")
        .order("game_date", { ascending: false });

      if (statsError) {
        logger.error("Error loading game stats:", statsError);
      } else {
        const statsWithDetails: PlayerGameStatsWithDetails[] = (
          statsData || []
        ).map((stat: PlayerGameStats) => ({
          ...stat,
          opponent_team: teams.find((t) => t.id === stat.opponent_team_id),
        }));
        setAllStats(statsWithDetails);
      }

      // Load ALL awards
      const { data: seasonAwardsData, error: seasonAwardsError } =
        await supabase
          .from("awards")
          .select("*")
          .order("season_id")
          .order("award_name");

      if (seasonAwardsError) {
        logger.error("Error loading awards:", seasonAwardsError);
      } else {
        const awards = (seasonAwardsData || []) as Award[];
        setAllSeasonAwards(awards);
      }
    } catch (error) {
      logger.error("Error loading stats and awards:", error);
    } finally {
      setLoading(false);
    }
  }, [teams]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return { 
    allStats, 
    allSeasonAwards, 
    loading: loading && allStats.length === 0,
    reload: loadStats, // Add reload function
  };
}