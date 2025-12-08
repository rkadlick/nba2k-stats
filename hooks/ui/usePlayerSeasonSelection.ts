// hooks/ui/usePlayerSeasonSelection.ts
import { useState, useCallback } from "react";
import { Season } from "@/lib/types";

export function usePlayerSeasonSelection(defaultSeason: Season | null) {
  const [playerSelectedSeasons, setPlayerSelectedSeasons] = useState<
    Record<string, Season | string>
  >({});

  const getSelectedSeasonForPlayer = useCallback(
    (playerId: string): Season | null => {
      const selected = playerSelectedSeasons[playerId];
      if (!selected) return defaultSeason;
      if (typeof selected === "string") return null; // Career view
      return selected;
    },
    [playerSelectedSeasons, defaultSeason]
  );

  const handlePlayerSeasonChange = useCallback(
    (playerId: string, season: Season | string) => {
      setPlayerSelectedSeasons((prev) => ({
        ...prev,
        [playerId]: season,
      }));
    },
    []
  );

  return {
    getSelectedSeasonForPlayer,
    handlePlayerSeasonChange,
  };
}