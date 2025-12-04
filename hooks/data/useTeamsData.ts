"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Team } from "@/lib/types";
import { logger } from "@/lib/logger";

export function useTeamsData() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTeams = async () => {
      setLoading(true);
      
      try {
        if (!supabase) return;
        const { data: teamsData, error: teamsError } = await supabase
          .from("teams")
          .select("*")
          .order("name", { ascending: true });

        if (teamsError) {
          logger.error("Error loading teams:", teamsError);
        } else {
          setTeams((teamsData || []) as Team[]);
        }
      } catch (error) {
        logger.error("Error loading teams:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTeams();
  }, []);

  return { teams, loading: loading && teams.length === 0 };
}
