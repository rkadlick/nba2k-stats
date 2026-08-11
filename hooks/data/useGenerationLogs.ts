"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { logger } from "@/lib/logger";

export interface AiGenerationLog {
  id: string;
  created_at: string;
  feature: string;
  game_id: string | null;
  player_id: string | null;
  model: string | null;
  system_prompt: string | null;
  user_prompt: string;
  response_text: string | null;
  status: "success" | "fallback" | "error";
  error_message: string | null;
  latency_ms: number | null;
}

const LOG_LIMIT = 100;

export function useGenerationLogs() {
  const [logs, setLogs] = useState<AiGenerationLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      if (!supabase) return;
      const { data, error } = await supabase
        .from("ai_generation_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(LOG_LIMIT);

      if (error) {
        logger.error("Error loading generation logs:", error);
      } else {
        setLogs((data as AiGenerationLog[]) ?? []);
      }
    } catch (error) {
      logger.error("Error loading generation logs:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const reloadSilent = useCallback(() => loadLogs(true), [loadLogs]);

  return {
    logs,
    loading,
    reload: loadLogs,
    reloadSilent,
  };
}
