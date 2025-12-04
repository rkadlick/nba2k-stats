"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Season } from "@/lib/types";
import { logger } from "@/lib/logger";

interface UseSeasonsDataProps {
  userId?: string;
}

export function useSeasonsData({ userId }: UseSeasonsDataProps) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [playerSeasons, setPlayerSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSeasons = async () => {
      setLoading(true);
      
      try {
        // Load seasons
        if (!supabase) return;
        const { data: seasonsData, error: seasonsError } = await supabase
          .from("seasons")
          .select("*")
          .order("year_start", { ascending: false });

        if (seasonsError) {
          logger.error("Error loading seasons:", seasonsError);
        } else if (seasonsData && seasonsData.length > 0) {
          setSeasons(seasonsData as Season[]);
        }

        // Load player seasons if user is logged in
        if (userId) {
          const playerId = await getPlayerIdForUser(userId);
          if (playerId) {
            if (!supabase) return;
            const { data: totalsData, error: totalsError } = await supabase
              .from("season_totals")
              .select("season_id")
              .eq("player_id", playerId);

            if (totalsError) {
              logger.error("Error loading season_totals:", totalsError);
            } else {
              const playerSeasonIds = (totalsData ?? []).map((t) => t.season_id);
              const filteredPlayerSeasons = seasonsData?.filter((s) =>
                playerSeasonIds.includes(s.id)
              );
              setPlayerSeasons(filteredPlayerSeasons ?? []);
            }
          }
        } else {
          setPlayerSeasons([]);
        }
      } catch (error) {
        logger.error("Error loading seasons:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSeasons();
  }, [userId]);

  // Helper function to get player ID for user
  const getPlayerIdForUser = async (userId: string) => {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("players")
      .select("id")
      .eq("user_id", userId)
      .single();
    if (error) {
      logger.error("Error loading player id for user:", error);
      return null;
    }
    return data?.id;
  };

  return {
    seasons,
    playerSeasons,
    loading: loading && seasons.length === 0, // Only show loading if we don't have data yet
  };
}