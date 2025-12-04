"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { PlayerGameStats, PlayerGameStatsWithDetails, Award, Team } from "@/lib/types";
import { logger } from "@/lib/logger";

interface UseStatsDataProps {
  teams: Team[];
}

export function useStatsData({ teams }: UseStatsDataProps) {
  const [allStats, setAllStats] = useState<PlayerGameStatsWithDetails[]>([]);
  const [allSeasonAwards, setAllSeasonAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (teams.length === 0) return; // Wait for teams to load first
      
      setLoading(true);
      
      try {
        // Load ALL game stats (not filtered by season)
        if (!supabase) return;
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

        // Load ALL awards - we'll filter by player's user_id when displaying
        // RLS policies ensure users can only see their own awards, but we need to load
        // awards for each player based on that player's user_id
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
    };

    loadStats();
  }, [teams]);

  return { 
    allStats, 
    allSeasonAwards, 
    loading: loading && allStats.length === 0 
  };
}
