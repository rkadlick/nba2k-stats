"use client";

import { useEffect } from "react";
import { Player } from "@/lib/types";
import { getTeamColor } from "@/lib/teams";

const FALLBACK_PRIMARY = "#2563eb";
const FALLBACK_SECONDARY = "#7c3aed";
const FALLBACK_TEXT = "#ffffff";

interface TeamButtonThemeProps {
  currentPlayer: Player | null;
}

/**
 * Sets CSS variables for team-themed primary/secondary buttons.
 * Uses current player's team colors; falls back to blue/purple when no player.
 */
export function TeamButtonTheme({ currentPlayer }: TeamButtonThemeProps) {
  useEffect(() => {
    const root = document.documentElement;
    const teamId = currentPlayer?.team_id ?? "";

    if (teamId) {
      root.style.setProperty(
        "--color-btn-primary-raw",
        getTeamColor(teamId, "primary")
      );
      root.style.setProperty(
        "--color-btn-secondary-raw",
        getTeamColor(teamId, "secondary")
      );
      root.style.setProperty(
        "--color-btn-primary-text",
        getTeamColor(teamId, "onPrimary")
      );
      root.style.setProperty(
        "--color-btn-secondary-text",
        getTeamColor(teamId, "onPrimary")
      );
    } else {
      root.style.setProperty("--color-btn-primary-raw", FALLBACK_PRIMARY);
      root.style.setProperty("--color-btn-secondary-raw", FALLBACK_SECONDARY);
      root.style.setProperty("--color-btn-primary-text", FALLBACK_TEXT);
      root.style.setProperty("--color-btn-secondary-text", FALLBACK_TEXT);
    }

    return () => {
      root.style.removeProperty("--color-btn-primary-raw");
      root.style.removeProperty("--color-btn-secondary-raw");
      root.style.removeProperty("--color-btn-primary-text");
      root.style.removeProperty("--color-btn-secondary-text");
    };
  }, [currentPlayer?.team_id]);

  return null;
}
