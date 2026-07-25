"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { logger } from "@/lib/logger";

/**
 * Loads real (private) player names from the players table when authenticated.
 */
export function usePrivatePlayerNames(isAuthenticated: boolean) {
  const [namesById, setNamesById] = useState<Record<string, string>>({});

  const loadPrivateNames = useCallback(async () => {
    if (!isAuthenticated || !supabase) {
      setNamesById({});
      return;
    }

    try {
      const { data, error } = await supabase
        .from("players")
        .select("id, player_name");

      if (error) {
        logger.error("Error loading private player names:", error);
        return;
      }

      const map: Record<string, string> = {};
      (data ?? []).forEach((row: { id: string; player_name: string }) => {
        if (row.id && row.player_name?.trim()) {
          map[row.id] = row.player_name.trim();
        }
      });
      setNamesById(map);
    } catch (error) {
      logger.error("Error loading private player names:", error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void loadPrivateNames();
  }, [loadPrivateNames]);

  return { namesById, reload: loadPrivateNames };
}
